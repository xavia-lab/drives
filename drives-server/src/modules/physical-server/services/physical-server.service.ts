import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op, Transaction } from 'sequelize';
import { PhysicalServer } from '../entities/physical-server.entity';
import { PhysicalCpu } from '../../physical-cpu/entities/physical-cpu.entity';
import { CpuModel } from '../../cpu-model/entities/cpu-model.entity';
import { OperatingSystem } from '../../operating-system/entities/operating-system.entity';
import { Rack } from '../../rack/entities/rack.entity';
import { ServerSlot } from '../entities/server-slot.entity';
import { ServerSlotService } from './server-slot.service';
import { CreatePhysicalServerDto } from '../dto/create-physical-server.dto';
import { UpdatePhysicalServerDto } from '../dto/update-physical-server.dto';
import { QueryPhysicalServerDto } from '../dto/query-physical-server.dto';
import { PaginationService } from '../../pagination/pagination.service';
import { PaginatedResponse } from '../../pagination/interfaces/paginated-response';

@Injectable()
export class PhysicalServerService {
  constructor(
    @InjectModel(PhysicalServer)
    private readonly physicalServerModel: typeof PhysicalServer,
    @InjectModel(PhysicalCpu)
    private readonly physicalCpuModel: typeof PhysicalCpu,
    @InjectModel(OperatingSystem)
    private readonly osModel: typeof OperatingSystem,
    @InjectModel(Rack)
    private readonly rackModel: typeof Rack,
    private readonly paginationService: PaginationService,
    private readonly serverSlotService: ServerSlotService,
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  private async validateForeignKeys(ids: {
    operatingSystemId?: string;
    rackId?: string;
  }): Promise<void> {
    const checkPromises: Promise<string | null>[] = [];

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
    if (ids.rackId) {
      checkPromises.push(
        this.rackModel
          .findByPk(ids.rackId)
          .then((exists) =>
            exists ? null : `Rack with ID ${ids.rackId} not found`,
          ),
      );
    }

    const results = await Promise.all(checkPromises);
    const errors = results.filter((error): error is string => error !== null);

    if (errors.length > 0) {
      throw new NotFoundException(errors.join('\n'));
    }
  }

  // Eager-loads the server's owned children (physical CPUs with their model
  // template, and backplane slots).
  private get readIncludes() {
    return [ServerSlot, { model: PhysicalCpu, include: [CpuModel] }];
  }

  async findAll(
    query?: QueryPhysicalServerDto,
  ): Promise<PaginatedResponse<PhysicalServer>> {
    return this.paginationService.paginate<PhysicalServer>(
      this.physicalServerModel,
      query,
      { include: this.readIncludes },
    );
  }

  async findOne(id: string): Promise<PhysicalServer | null> {
    const physicalServer = await this.physicalServerModel.findByPk(id, {
      include: this.readIncludes,
    });

    if (!physicalServer) {
      throw new NotFoundException(`PhysicalServer with ID ${id} not found`);
    }

    return physicalServer;
  }

  // Reconciles the set of physical CPUs assigned to a server. A chip may be
  // installed in at most one server; unlisted chips are released back into
  // unassigned inventory. No-op when `cpuIds` is omitted (undefined).
  private async syncCpus(
    serverId: string,
    cpuIds: string[] | undefined,
    transaction: Transaction,
  ): Promise<void> {
    if (cpuIds === undefined) return;

    const uniqueIds = [...new Set(cpuIds)];
    if (uniqueIds.length !== cpuIds.length) {
      throw new BadRequestException('Duplicate cpuIds are not allowed');
    }

    if (uniqueIds.length > 0) {
      const cpus = await this.physicalCpuModel.findAll({
        where: { id: uniqueIds },
        transaction,
      });

      if (cpus.length !== uniqueIds.length) {
        const found = new Set(cpus.map((cpu) => cpu.id));
        const missing = uniqueIds.filter((id) => !found.has(id));
        throw new NotFoundException(
          `PhysicalCpu with ID(s) ${missing.join(', ')} not found`,
        );
      }

      const conflict = cpus.find(
        (cpu) => cpu.physicalServerId && cpu.physicalServerId !== serverId,
      );
      if (conflict) {
        throw new ConflictException(
          `PhysicalCpu with ID ${conflict.id} is already assigned to another server`,
        );
      }
    }

    // Release any chips previously owned by this server but no longer listed.
    await this.physicalCpuModel.update(
      { physicalServerId: null },
      {
        where: {
          physicalServerId: serverId,
          ...(uniqueIds.length > 0 ? { id: { [Op.notIn]: uniqueIds } } : {}),
        },
        transaction,
      },
    );

    // Assign the requested chips to this server.
    if (uniqueIds.length > 0) {
      await this.physicalCpuModel.update(
        { physicalServerId: serverId },
        { where: { id: uniqueIds }, transaction },
      );
    }
  }

  async create(createDto: CreatePhysicalServerDto): Promise<PhysicalServer> {
    const existingByHostname = await this.physicalServerModel.findOne({
      where: { hostname: createDto.hostname },
    });

    if (existingByHostname) {
      throw new ConflictException(
        `PhysicalServer with hostname "${createDto.hostname}" already exists`,
      );
    }

    await this.validateForeignKeys(createDto);

    const { slots, cpuIds, ...serverData } = createDto;

    return this.sequelize.transaction(async (transaction) => {
      const physicalServer = await this.physicalServerModel.create(
        serverData as Partial<PhysicalServer>,
        { transaction },
      );

      if (cpuIds !== undefined) {
        await this.syncCpus(physicalServer.id, cpuIds, transaction);
      }

      if (slots && slots.length > 0) {
        await this.serverSlotService.syncForServer(
          physicalServer.id,
          slots,
          transaction,
        );
      }

      const reloaded = await this.physicalServerModel.findByPk(
        physicalServer.id,
        { include: this.readIncludes, transaction },
      );
      return reloaded as PhysicalServer;
    });
  }

  async update(
    id: string,
    updateDto: UpdatePhysicalServerDto,
  ): Promise<PhysicalServer> {
    const physicalServer = await this.physicalServerModel.findByPk(id);

    if (!physicalServer) {
      throw new NotFoundException(`PhysicalServer with ID ${id} not found`);
    }

    if (updateDto.hostname) {
      const existing = await this.physicalServerModel.findOne({
        where: { hostname: updateDto.hostname },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `PhysicalServer with hostname "${updateDto.hostname}" already exists`,
        );
      }
    }

    await this.validateForeignKeys(updateDto);

    const updateData: Partial<PhysicalServer> = {};
    if (updateDto.hostname !== undefined)
      updateData.hostname = updateDto.hostname;
    if (updateDto.memoryValue !== undefined)
      updateData.memoryValue = updateDto.memoryValue;
    if (updateDto.memoryUnit !== undefined)
      updateData.memoryUnit = updateDto.memoryUnit;
    if (updateDto.operatingSystemId !== undefined)
      updateData.operatingSystemId = updateDto.operatingSystemId;
    if (updateDto.rackId !== undefined) updateData.rackId = updateDto.rackId;
    if (updateDto.rackUnitPosition !== undefined)
      updateData.rackUnitPosition = updateDto.rackUnitPosition;

    const { slots, cpuIds } = updateDto;

    return this.sequelize.transaction(async (transaction) => {
      await physicalServer.update(updateData, { transaction });

      if (cpuIds !== undefined) {
        await this.syncCpus(id, cpuIds, transaction);
      }

      if (slots !== undefined) {
        await this.serverSlotService.syncForServer(id, slots, transaction);
      }

      const reloaded = await this.physicalServerModel.findByPk(id, {
        include: this.readIncludes,
        transaction,
      });
      return reloaded as PhysicalServer;
    });
  }

  async delete(id: string): Promise<boolean> {
    const physicalServer = await this.physicalServerModel.findByPk(id);

    if (!physicalServer) {
      throw new NotFoundException(`PhysicalServer with ID ${id} not found`);
    }

    const deletedCount = await this.physicalServerModel.destroy({
      where: { id },
    });
    return deletedCount > 0;
  }
}
