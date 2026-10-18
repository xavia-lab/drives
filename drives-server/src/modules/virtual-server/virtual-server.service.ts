import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import {
  VirtualServer,
  VirtualServerType,
} from './entities/virtual-server.entity';
import { PassthroughSlot } from './entities/passthrough-slot.entity';
import { PhysicalServer } from '../physical-server/entities/physical-server.entity';
import { ServerSlot } from '../physical-server/entities/server-slot.entity';
import { CpuModel } from '../cpu-model/entities/cpu-model.entity';
import { OperatingSystem } from '../operating-system/entities/operating-system.entity';
import { CreateVirtualServerDto } from './dto/create-virtual-server.dto';
import { UpdateVirtualServerDto } from './dto/update-virtual-server.dto';
import { QueryVirtualServerDto } from './dto/query-virtual-server.dto';
import { PaginationService } from '../common/pagination/pagination.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response';
import { PassthroughSlotService } from './passthrough-slot.service';
import { toBytes } from '../../lib/utils/human.readable.bytes.converter';

@Injectable()
export class VirtualServerService {
  constructor(
    @InjectModel(VirtualServer)
    private readonly virtualServerModel: typeof VirtualServer,
    @InjectModel(PhysicalServer)
    private readonly physicalServerModel: typeof PhysicalServer,
    @InjectModel(OperatingSystem)
    private readonly osModel: typeof OperatingSystem,
    private readonly paginationService: PaginationService,
    private readonly passthroughSlotService: PassthroughSlotService,
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  // Relations eagerly loaded for every read so the API (and UI) always has the
  // host, guest OS and the passthrough slot set in a single round trip.
  private get readIncludes() {
    return [
      PhysicalServer,
      OperatingSystem,
      {
        model: PassthroughSlot,
        include: [ServerSlot],
      },
    ];
  }

  // Private helper to check foreign key constraints concurrently and aggregate errors
  private async validateForeignKeys(
    ids: {
      hostServerId?: string;
      operatingSystemId?: string;
    },
    transaction?: Transaction,
  ): Promise<void> {
    const checkPromises: Promise<string | null>[] = [];

    if (ids.hostServerId) {
      checkPromises.push(
        this.physicalServerModel
          .findByPk(ids.hostServerId, { transaction })
          .then((exists) =>
            exists
              ? null
              : `Host PhysicalServer with ID ${ids.hostServerId} not found`,
          ),
      );
    }
    if (ids.operatingSystemId) {
      checkPromises.push(
        this.osModel
          .findByPk(ids.operatingSystemId, { transaction })
          .then((exists) =>
            exists
              ? null
              : `OperatingSystem with ID ${ids.operatingSystemId} not found`,
          ),
      );
    }

    const results = await Promise.all(checkPromises);
    const errors = results.filter((error): error is string => error !== null);

    if (errors.length > 0) {
      throw new NotFoundException(errors.join('\n'));
    }
  }

  /**
   * Guards against over-allocating a host's memory. Locks the host row so
   * concurrent guest create/update requests on the same host serialize, then
   * ensures the sum of allocated bytes across the host's *active* guests stays
   * within its `absoluteMemory` ceiling.
   *
   * Only active guests reserve host RAM: an inactive guest is powered off, so
   * neither its stored allocation nor the requested allocation of a guest being
   * saved as inactive counts toward the ceiling.
   */
  private async assertWithinHostCapacity(
    hostServerId: string,
    requestedBytes: number,
    isActive: boolean,
    transaction: Transaction,
    excludeVirtualServerId?: string,
  ): Promise<void> {
    const host = await this.physicalServerModel.findByPk(hostServerId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!host) {
      throw new NotFoundException(
        `Host PhysicalServer with ID ${hostServerId} not found`,
      );
    }

    const allocatedRaw = await this.virtualServerModel.sum(
      'absoluteAllocatedMemory',
      {
        where: {
          hostServerId,
          isActive: true,
          ...(excludeVirtualServerId
            ? { id: { [Op.ne]: excludeVirtualServerId } }
            : {}),
        },
        transaction,
      },
    );

    const alreadyAllocated = Number(allocatedRaw ?? 0);
    const hostCapacity = Number(host.absoluteMemory);
    const requestedContribution = isActive ? requestedBytes : 0;

    if (alreadyAllocated + requestedContribution > hostCapacity) {
      throw new ConflictException(
        `Allocating ${requestedBytes} bytes exceeds host PhysicalServer ${hostServerId} capacity: ` +
          `${alreadyAllocated} of ${hostCapacity} bytes already allocated`,
      );
    }
  }

  /**
   * Guards against granting a single guest more vCPUs than the host physically
   * provides. A host's total thread count is `cpuCount × cpuModel.threads`, so a
   * guest requesting more vCPUs than there are hardware threads can never be
   * fully scheduled.
   */
  private async assertWithinHostThreadCapacity(
    hostServerId: string,
    requestedVcpus: number,
    transaction: Transaction,
  ): Promise<void> {
    const host = await this.physicalServerModel.findByPk(hostServerId, {
      include: [CpuModel],
      transaction,
    });

    if (!host) {
      throw new NotFoundException(
        `Host PhysicalServer with ID ${hostServerId} not found`,
      );
    }

    const totalThreads =
      Number(host.cpuCount ?? 0) * Number(host.cpuModel?.threads ?? 0);

    // Skip when the host's CPU data is incomplete rather than blocking on 0.
    if (totalThreads > 0 && requestedVcpus > totalThreads) {
      throw new ConflictException(
        `Allocating ${requestedVcpus} vCPUs exceeds host PhysicalServer ${hostServerId} capacity: ` +
          `${totalThreads} hardware threads available`,
      );
    }
  }

  private resolveRequestedBytes(
    memoryValue: number | string,
    memoryUnit: string,
  ): number {
    return Math.round(toBytes(Number(memoryValue), memoryUnit));
  }

  async findAll(
    query?: QueryVirtualServerDto,
  ): Promise<PaginatedResponse<VirtualServer>> {
    return this.paginationService.paginate<VirtualServer>(
      this.virtualServerModel,
      query,
      {
        include: this.readIncludes,
      },
    );
  }

  async findOne(id: string): Promise<VirtualServer | null> {
    const virtualServer = await this.virtualServerModel.findByPk(id, {
      include: this.readIncludes,
    });

    if (!virtualServer) {
      throw new NotFoundException(`VirtualServer with ID ${id} not found`);
    }

    return virtualServer;
  }

  async create(createDto: CreateVirtualServerDto): Promise<VirtualServer> {
    const { passthroughSlots, ...serverData } = createDto;

    return this.sequelize.transaction(async (transaction) => {
      // 1. Uniqueness check for hostname
      const existingByHostname = await this.virtualServerModel.findOne({
        where: { hostname: createDto.hostname },
        transaction,
      });

      if (existingByHostname) {
        throw new ConflictException(
          `VirtualServer with hostname "${createDto.hostname}" already exists`,
        );
      }

      // 2. Partial Unique Constraint Check: Enforce uniqueness of VMID per host server (when VMID is not null)
      if (createDto.vmid) {
        const existingByVmid = await this.virtualServerModel.findOne({
          where: {
            hostServerId: createDto.hostServerId,
            vmid: createDto.vmid,
          },
          transaction,
        });

        if (existingByVmid) {
          throw new ConflictException(
            `VirtualServer with VMID ${createDto.vmid} already exists on host server ${createDto.hostServerId}`,
          );
        }
      }

      // 3. Validate parent foreign keys and host memory capacity.
      await this.validateForeignKeys(createDto, transaction);

      const requestedBytes = this.resolveRequestedBytes(
        createDto.allocatedMemoryValue,
        createDto.allocatedMemoryUnit,
      );
      await this.assertWithinHostCapacity(
        createDto.hostServerId,
        requestedBytes,
        createDto.isActive ?? true,
        transaction,
      );
      await this.assertWithinHostThreadCapacity(
        createDto.hostServerId,
        createDto.allocatedVcpus,
        transaction,
      );

      // 4. Passthrough slots are a hardware-passthrough feature available only
      // to full virtual machines; containers cannot receive them.
      if (
        createDto.type === VirtualServerType.CONTAINER &&
        passthroughSlots &&
        passthroughSlots.length > 0
      ) {
        throw new BadRequestException(
          `Virtual servers of type "${VirtualServerType.CONTAINER}" cannot have passthrough slots`,
        );
      }

      const virtualServer = await this.virtualServerModel.create(
        serverData as Partial<VirtualServer>,
        { transaction },
      );

      if (passthroughSlots && passthroughSlots.length > 0) {
        await this.passthroughSlotService.syncForVirtualServer(
          virtualServer.id,
          createDto.hostServerId,
          passthroughSlots,
          transaction,
        );
      }

      const reloaded = await this.virtualServerModel.findByPk(
        virtualServer.id,
        { include: this.readIncludes, transaction },
      );
      return reloaded as VirtualServer;
    });
  }

  async update(
    id: string,
    updateDto: UpdateVirtualServerDto,
  ): Promise<VirtualServer> {
    return this.sequelize.transaction(async (transaction) => {
      const virtualServerObject = await this.virtualServerModel.findByPk(id, {
        transaction,
      });

      if (!virtualServerObject) {
        throw new NotFoundException(`VirtualServer with ID ${id} not found`);
      }

      // Enforce unique name mapping within the target scope if hostname changes
      if (updateDto.hostname) {
        const existing = await this.virtualServerModel.findOne({
          where: { hostname: updateDto.hostname },
          transaction,
        });
        if (existing && existing.id !== id) {
          throw new ConflictException(
            `VirtualServer with hostname "${updateDto.hostname}" already exists`,
          );
        }
      }

      // Enforce partial unique cluster constraints if hostServerId or vmid changes
      if (updateDto.vmid || updateDto.hostServerId) {
        const targetHost =
          updateDto.hostServerId ?? virtualServerObject.hostServerId;
        const targetVmid =
          updateDto.vmid !== undefined
            ? updateDto.vmid
            : virtualServerObject.vmid;

        if (targetVmid !== null) {
          const existing = await this.virtualServerModel.findOne({
            where: { hostServerId: targetHost, vmid: targetVmid },
            transaction,
          });
          if (existing && existing.id !== id) {
            throw new ConflictException(
              `VirtualServer with VMID ${targetVmid} already exists on host server ${targetHost}`,
            );
          }
        }
      }

      // Validate passed keys for existence if present in payload modification parameters
      await this.validateForeignKeys(updateDto, transaction);

      const updateData: Partial<VirtualServer> = {};
      if (updateDto.vmid !== undefined) updateData.vmid = updateDto.vmid;
      if (updateDto.hostname !== undefined)
        updateData.hostname = updateDto.hostname;
      if (updateDto.type !== undefined) updateData.type = updateDto.type;
      if (updateDto.allocatedVcpus !== undefined)
        updateData.allocatedVcpus = updateDto.allocatedVcpus;
      if (updateDto.allocatedMemoryValue !== undefined)
        updateData.allocatedMemoryValue = updateDto.allocatedMemoryValue;
      if (updateDto.allocatedMemoryUnit !== undefined)
        updateData.allocatedMemoryUnit = updateDto.allocatedMemoryUnit;
      if (updateDto.isActive !== undefined)
        updateData.isActive = updateDto.isActive;
      if (updateDto.notes !== undefined) updateData.notes = updateDto.notes;
      if (updateDto.hostServerId !== undefined)
        updateData.hostServerId = updateDto.hostServerId;
      if (updateDto.operatingSystemId !== undefined)
        updateData.operatingSystemId = updateDto.operatingSystemId;

      // Resolve the effective host + memory allocation (falling back to the
      // current row for any field omitted from the partial update).
      const targetHostServerId =
        updateDto.hostServerId ?? virtualServerObject.hostServerId;
      const hostChanged =
        targetHostServerId !== virtualServerObject.hostServerId;

      const effectiveType = updateDto.type ?? virtualServerObject.type;

      // Passthrough slots are a hardware-passthrough feature available only to
      // full virtual machines; containers cannot receive them.
      if (
        effectiveType === VirtualServerType.CONTAINER &&
        (updateDto.passthroughSlots?.length ?? 0) > 0
      ) {
        throw new BadRequestException(
          `Virtual servers of type "${VirtualServerType.CONTAINER}" cannot have passthrough slots`,
        );
      }

      const effectiveValue =
        updateDto.allocatedMemoryValue ??
        virtualServerObject.allocatedMemoryValue;
      const effectiveUnit =
        updateDto.allocatedMemoryUnit ??
        virtualServerObject.allocatedMemoryUnit;
      const requestedBytes = this.resolveRequestedBytes(
        effectiveValue,
        effectiveUnit,
      );

      await this.assertWithinHostCapacity(
        targetHostServerId,
        requestedBytes,
        updateDto.isActive ?? virtualServerObject.isActive,
        transaction,
        id,
      );

      const effectiveVcpus =
        updateDto.allocatedVcpus ?? virtualServerObject.allocatedVcpus;
      await this.assertWithinHostThreadCapacity(
        targetHostServerId,
        effectiveVcpus,
        transaction,
      );

      await virtualServerObject.update(updateData, { transaction });

      // Passthrough mappings are re-validated against the (possibly new) host.
      // When the host changes the old mappings can no longer be trusted, so an
      // omitted payload is treated as "clear all". Converting to a container
      // likewise clears any existing mappings, since containers cannot have
      // passthrough slots.
      if (
        updateDto.passthroughSlots !== undefined ||
        hostChanged ||
        effectiveType === VirtualServerType.CONTAINER
      ) {
        await this.passthroughSlotService.syncForVirtualServer(
          id,
          targetHostServerId,
          updateDto.passthroughSlots ?? [],
          transaction,
        );
      }

      const reloaded = await this.virtualServerModel.findByPk(id, {
        include: this.readIncludes,
        transaction,
      });
      return reloaded as VirtualServer;
    });
  }

  async delete(id: string): Promise<boolean> {
    const virtualServerObject = await this.virtualServerModel.findByPk(id);

    if (!virtualServerObject) {
      throw new NotFoundException(`VirtualServer with ID ${id} not found`);
    }

    const deletedCount = await this.virtualServerModel.destroy({
      where: { id },
    });
    return deletedCount > 0;
  }
}
