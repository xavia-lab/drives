import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { WhereOptions } from 'sequelize';
import { LogicalVdev, VdevClass } from './entities/logical-vdev.entity';
import { LogicalDisk } from '../logical-disk/entities/logical-disk.entity';
import { StoragePool } from '../storage-pool/entities/storage-pool.entity';
import { VdevProfile } from '../vdev-profile/entities/vdev-profile.entity';
import { CreateLogicalVdevDto } from './dto/create-logical-vdev.dto';
import { UpdateLogicalVdevDto } from './dto/update-logical-vdev.dto';
import { QueryLogicalVdevDto } from './dto/query-logical-vdev.dto';
import { PaginationService } from '../pagination/pagination.service';
import { PaginatedResponse } from '../pagination/interfaces/paginated-response';
import { VdevCapacityService } from './vdev-capacity.service';

@Injectable()
export class LogicalVdevService {
  constructor(
    @InjectModel(LogicalVdev)
    private readonly logicalVdevModel: typeof LogicalVdev,
    @InjectModel(LogicalDisk)
    private readonly logicalDiskModel: typeof LogicalDisk,
    @InjectModel(StoragePool)
    private readonly storagePoolModel: typeof StoragePool,
    @InjectModel(VdevProfile)
    private readonly vdevProfileModel: typeof VdevProfile,
    private readonly paginationService: PaginationService,
    private readonly capacityService: VdevCapacityService,
  ) {}

  private includeRelations() {
    return [StoragePool, VdevProfile];
  }

  private buildWhere(query?: QueryLogicalVdevDto): WhereOptions {
    const where: WhereOptions = {};
    if (query?.storagePoolId) {
      (where as Record<string, unknown>).storagePoolId = query.storagePoolId;
    }
    if (query?.vdevClass) {
      (where as Record<string, unknown>).vdevClass = query.vdevClass;
    }
    if (query?.redundancyProfileId) {
      (where as Record<string, unknown>).redundancyProfileId =
        query.redundancyProfileId;
    }
    return where;
  }

  private async enrich<T extends LogicalVdev>(vdevs: T[]): Promise<T[]> {
    const capacities = await this.capacityService.calculateMany(
      vdevs.map((vdev) => vdev.id),
    );
    for (const vdev of vdevs) {
      const capacity = capacities.get(vdev.id);
      if (capacity) {
        vdev.setDataValue('capacity', capacity);
        vdev.setDataValue('memberCount', capacity.memberCount);
      }
    }
    return vdevs;
  }

  async findAll(
    query?: QueryLogicalVdevDto,
  ): Promise<PaginatedResponse<LogicalVdev>> {
    const result = await this.paginationService.paginate<LogicalVdev>(
      this.logicalVdevModel,
      query,
      {
        where: this.buildWhere(query),
        include: this.includeRelations(),
      },
    );
    result.data = await this.enrich(result.data);
    return result;
  }

  async findByPool(poolId: string): Promise<LogicalVdev[]> {
    await this.assertPoolExists(poolId);
    const vdevs = await this.logicalVdevModel.findAll({
      where: { storagePoolId: poolId },
      include: this.includeRelations(),
      order: [
        ['sortOrder', 'ASC'],
        ['displayKey', 'ASC'],
      ],
    });
    return this.enrich(vdevs);
  }

  async findOne(id: string): Promise<LogicalVdev> {
    const vdev = await this.logicalVdevModel.findByPk(id, {
      include: this.includeRelations(),
    });
    if (!vdev) {
      throw new NotFoundException(`LogicalVdev with ID ${id} not found`);
    }
    const capacity = await this.capacityService.calculate(vdev);
    const members = await this.capacityService.getMembers(id);
    vdev.setDataValue('capacity', capacity);
    vdev.setDataValue('memberCount', capacity.memberCount);
    vdev.setDataValue('members', members);
    return vdev;
  }

  async create(createDto: CreateLogicalVdevDto): Promise<LogicalVdev> {
    await this.assertPoolExists(createDto.storagePoolId);
    await this.assertProfileExists(createDto.redundancyProfileId);
    await this.assertUniqueName(createDto.storagePoolId, createDto.vdevName);

    const created = await this.logicalVdevModel.create({
      ...(createDto.id ? { id: createDto.id } : {}),
      storagePoolId: createDto.storagePoolId,
      redundancyProfileId: createDto.redundancyProfileId,
      vdevName: createDto.vdevName,
      vdevClass: createDto.vdevClass ?? VdevClass.DATA,
      sortOrder: createDto.sortOrder ?? 0,
      notes: createDto.notes ?? null,
    } as Partial<LogicalVdev>);

    return this.findOne(created.id);
  }

  async update(
    id: string,
    updateDto: UpdateLogicalVdevDto,
  ): Promise<LogicalVdev> {
    const vdev = await this.logicalVdevModel.findByPk(id);
    if (!vdev) {
      throw new NotFoundException(`LogicalVdev with ID ${id} not found`);
    }

    if (updateDto.redundancyProfileId) {
      await this.assertProfileExists(updateDto.redundancyProfileId);
    }
    if (
      updateDto.storagePoolId &&
      updateDto.storagePoolId !== vdev.storagePoolId
    ) {
      const memberCount = await this.logicalDiskModel.count({
        where: { logicalVdevId: id },
      });
      if (memberCount > 0) {
        throw new ConflictException(
          'Detach all member drives before moving a vdev to another storage pool',
        );
      }
      await this.assertPoolExists(updateDto.storagePoolId);
    }
    if (updateDto.vdevName || updateDto.storagePoolId) {
      const targetPool = updateDto.storagePoolId ?? vdev.storagePoolId;
      const targetName = updateDto.vdevName ?? vdev.vdevName;
      await this.assertUniqueName(targetPool, targetName, id);
    }

    const update: Partial<LogicalVdev> = {};
    if (updateDto.storagePoolId !== undefined)
      update.storagePoolId = updateDto.storagePoolId;
    if (updateDto.redundancyProfileId !== undefined)
      update.redundancyProfileId = updateDto.redundancyProfileId;
    if (updateDto.vdevName !== undefined) update.vdevName = updateDto.vdevName;
    if (updateDto.vdevClass !== undefined)
      update.vdevClass = updateDto.vdevClass;
    if (updateDto.sortOrder !== undefined)
      update.sortOrder = updateDto.sortOrder;
    if (updateDto.notes !== undefined) update.notes = updateDto.notes;

    await vdev.update(update);
    return this.findOne(id);
  }

  async delete(id: string): Promise<boolean> {
    const vdev = await this.logicalVdevModel.findByPk(id);
    if (!vdev) {
      throw new NotFoundException(`LogicalVdev with ID ${id} not found`);
    }

    const memberCount = await this.logicalDiskModel.count({
      where: { logicalVdevId: id },
    });
    if (memberCount > 0) {
      throw new ConflictException(
        `LogicalVdev ${id} still has ${memberCount} member drive(s); detach them before deleting the vdev`,
      );
    }

    await vdev.destroy();
    return true;
  }

  async getPoolCapacity(poolId: string) {
    await this.assertPoolExists(poolId);
    const vdevs = await this.logicalVdevModel.findAll({
      where: { storagePoolId: poolId },
      include: this.includeRelations(),
    });
    const capacities = await this.capacityService.calculateMany(
      vdevs.map((vdev) => vdev.id),
    );

    let rawBytes = 0;
    let usableBytes = 0;
    let capacityKnown = true;
    let estimated = false;
    for (const vdev of vdevs) {
      if (vdev.vdevClass !== VdevClass.DATA) continue;
      const capacity = capacities.get(vdev.id);
      if (!capacity) continue;
      if (capacity.rawBytes === null || capacity.usableBytes === null) {
        capacityKnown = false;
      } else {
        rawBytes += capacity.rawBytes;
        usableBytes += capacity.usableBytes;
      }
      estimated = estimated || capacity.estimated;
    }

    return {
      storagePoolId: poolId,
      vdevCount: vdevs.length,
      dataVdevCount: vdevs.filter((vdev) => vdev.vdevClass === VdevClass.DATA)
        .length,
      rawBytes: capacityKnown ? rawBytes : null,
      usableBytes: capacityKnown ? usableBytes : null,
      capacityKnown,
      estimated,
    };
  }

  private async assertPoolExists(id: string): Promise<void> {
    const exists = await this.storagePoolModel.findByPk(id, {
      attributes: ['id'],
    });
    if (!exists) {
      throw new NotFoundException(`StoragePool with ID ${id} not found`);
    }
  }

  private async assertProfileExists(id: string): Promise<void> {
    const exists = await this.vdevProfileModel.findByPk(id, {
      attributes: ['id'],
    });
    if (!exists) {
      throw new NotFoundException(`VdevProfile with ID ${id} not found`);
    }
  }

  private async assertUniqueName(
    storagePoolId: string,
    vdevName: string,
    exceptId?: string,
  ): Promise<void> {
    const existing = await this.logicalVdevModel.findOne({
      where: { storagePoolId, vdevName },
    });
    if (existing && existing.id !== exceptId) {
      throw new ConflictException(
        `LogicalVdev with name "${vdevName}" already exists in storage pool ${storagePoolId}`,
      );
    }
  }
}
