import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { VirtualServer } from './entities/virtual-server.entity';
import { Server } from '../server/entities/server.entity';
import { OperatingSystem } from '../operating-system/entities/operating-system.entity';
import { CreateVirtualServerDto } from './dto/create-virtual-server.dto';
import { UpdateVirtualServerDto } from './dto/update-virtual-server.dto';
import { QueryVirtualServerDto } from './dto/query-virtual-server.dto';
import { PaginationService } from '../common/pagination/pagination.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response';

@Injectable()
export class VirtualServerService {
  constructor(
    @InjectModel(VirtualServer)
    private readonly virtualServerModel: typeof VirtualServer,
    @InjectModel(Server)
    private readonly serverModel: typeof Server,
    @InjectModel(OperatingSystem)
    private readonly osModel: typeof OperatingSystem,
    private readonly paginationService: PaginationService,
  ) {}

  // 🌟 Private helper to check foreign key constraints concurrently and aggregate errors
  private async validateForeignKeys(ids: {
    hostServerId?: string;
    operatingSystemId?: string;
  }): Promise<void> {
    const checkPromises: Promise<string | null>[] = [];

    if (ids.hostServerId) {
      checkPromises.push(
        this.serverModel
          .findByPk(ids.hostServerId)
          .then((exists) =>
            exists ? null : `Host Server with ID ${ids.hostServerId} not found`,
          ),
      );
    }
    if (ids.operatingSystemId) {
      checkPromises.push(
        this.osModel
          .findByPk(ids.operatingSystemId)
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

  async findAll(
    query?: QueryVirtualServerDto,
  ): Promise<PaginatedResponse<VirtualServer & { itemNumber: number }>> {
    // Clean delegation to the standalone pagination service with relational inclusions
    return this.paginationService.paginate<VirtualServer>(
      this.virtualServerModel,
      query,
      {
        include: [Server, OperatingSystem],
      },
    );
  }

  async findOne(id: string): Promise<VirtualServer | null> {
    const virtualServer = await this.virtualServerModel.findByPk(id, {
      include: [Server, OperatingSystem],
    });

    if (!virtualServer) {
      throw new NotFoundException(`VirtualServer with ID ${id} not found`);
    }

    return virtualServer;
  }

  async create(createDto: CreateVirtualServerDto): Promise<VirtualServer> {
    // 1. Uniqueness check for hostname
    const existingByHostname = await this.virtualServerModel.findOne({
      where: { hostname: createDto.hostname },
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
      });

      if (existingByVmid) {
        throw new ConflictException(
          `VirtualServer with VMID ${createDto.vmid} already exists on host server ${createDto.hostServerId}`,
        );
      }
    }

    // 🌟 Validate all incoming foreign keys concurrently before creation
    await this.validateForeignKeys(createDto);

    const virtualServer = await this.virtualServerModel.create(
      createDto as any,
    );
    return virtualServer.reload({ include: [Server, OperatingSystem] });
  }

  async update(
    id: string,
    updateDto: UpdateVirtualServerDto,
  ): Promise<VirtualServer> {
    const virtualServerObject = await this.virtualServerModel.findByPk(id);

    if (!virtualServerObject) {
      throw new NotFoundException(`VirtualServer with ID ${id} not found`);
    }

    // Enforce unique name mapping within the target scope if hostname changes
    if (updateDto.hostname) {
      const existing = await this.virtualServerModel.findOne({
        where: { hostname: updateDto.hostname },
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
        });
        if (existing && existing.id !== id) {
          throw new ConflictException(
            `VirtualServer with VMID ${targetVmid} already exists on host server ${targetHost}`,
          );
        }
      }
    }

    // 🌟 Validate passed keys for existence if present in payload modification parameters
    await this.validateForeignKeys(updateDto);

    const updateData: Partial<VirtualServer> = {};
    if (updateDto.vmid !== undefined) updateData.vmid = updateDto.vmid;
    if (updateDto.hostname !== undefined)
      updateData.hostname = updateDto.hostname;
    if (updateDto.type !== undefined) updateData.type = updateDto.type;
    if (updateDto.allocatedVcpus !== undefined)
      updateData.allocatedVcpus = updateDto.allocatedVcpus;
    if (updateDto.allocatedRamMb !== undefined)
      updateData.allocatedRamMb = updateDto.allocatedRamMb;
    if (updateDto.isActive !== undefined)
      updateData.isActive = updateDto.isActive;
    if (updateDto.notes !== undefined) updateData.notes = updateDto.notes;
    if (updateDto.hostServerId !== undefined)
      updateData.hostServerId = updateDto.hostServerId;
    if (updateDto.operatingSystemId !== undefined)
      updateData.operatingSystemId = updateDto.operatingSystemId;

    await virtualServerObject.update(updateData);
    return virtualServerObject.reload({ include: [Server, OperatingSystem] });
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
