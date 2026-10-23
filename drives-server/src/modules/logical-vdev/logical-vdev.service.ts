import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, Sequelize, Transaction, WhereOptions } from 'sequelize';
import { LogicalVdev, VdevClass } from './entities/logical-vdev.entity';
import { LogicalDisk } from '../logical-disk/entities/logical-disk.entity';
import { StoragePool } from '../storage-pool/entities/storage-pool.entity';
import { PoolType } from '../pool-type/entities/pool-type.entity';
import { VdevProfile } from '../vdev-profile/entities/vdev-profile.entity';
import {
  LogicalVdevEvent,
  VdevConfigAction,
} from './entities/logical-vdev-event.entity';
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
    @InjectModel(PoolType)
    private readonly poolTypeModel: typeof PoolType,
    @InjectModel(LogicalVdevEvent)
    private readonly vdevEventModel: typeof LogicalVdevEvent,
    @InjectConnection()
    private readonly sequelize: Sequelize,
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
    await this.enrich(vdevs);
    await Promise.all(
      vdevs.map(async (vdev) => {
        vdev.setDataValue(
          'members',
          await this.capacityService.getMembers(vdev.id),
        );
      }),
    );
    return vdevs;
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

  async create(
    createDto: CreateLogicalVdevDto,
    performedByUserId?: string | null,
  ): Promise<LogicalVdev> {
    const created = await this.sequelize.transaction(async (transaction) => {
      await this.assertPoolExists(createDto.storagePoolId);
      const profile = await this.assertProfileExists(
        createDto.redundancyProfileId,
      );
      await this.assertProfileCompatible(createDto.storagePoolId, profile);
      await this.assertUniqueName(createDto.storagePoolId, createDto.vdevName);

      const vdev = await this.logicalVdevModel.create(
        {
          ...(createDto.id ? { id: createDto.id } : {}),
          storagePoolId: createDto.storagePoolId,
          redundancyProfileId: createDto.redundancyProfileId,
          vdevName: createDto.vdevName,
          vdevClass: createDto.vdevClass ?? VdevClass.DATA,
          sortOrder: createDto.sortOrder ?? 0,
          notes: createDto.notes ?? null,
          profileSnapshot: profile.toJSON(),
        } as Partial<LogicalVdev>,
        { transaction },
      );

      await this.vdevEventModel.create(
        {
          logicalVdevId: vdev.id,
          storagePoolId: vdev.storagePoolId,
          action: VdevConfigAction.CREATE,
          beforeSnapshot: null,
          afterSnapshot: vdev.toJSON<Record<string, unknown>>(),
          performedByUserId: performedByUserId ?? null,
        } as Partial<LogicalVdevEvent>,
        { transaction },
      );

      return vdev;
    });

    return this.findOne(created.id);
  }

  async update(
    id: string,
    updateDto: UpdateLogicalVdevDto,
    performedByUserId?: string | null,
  ): Promise<LogicalVdev> {
    const vdev = await this.logicalVdevModel.findByPk(id);
    if (!vdev) {
      throw new NotFoundException(`LogicalVdev with ID ${id} not found`);
    }
    const beforeSnapshot = vdev.toJSON<Record<string, unknown>>();

    let nextProfile: VdevProfile | null = null;
    if (updateDto.redundancyProfileId) {
      nextProfile = await this.assertProfileExists(
        updateDto.redundancyProfileId,
      );
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
    if (nextProfile) {
      await this.assertProfileCompatible(
        updateDto.storagePoolId ?? vdev.storagePoolId,
        nextProfile,
      );
      update.profileSnapshot = nextProfile.toJSON();
    } else if (
      updateDto.storagePoolId &&
      updateDto.storagePoolId !== vdev.storagePoolId
    ) {
      const currentProfile = await this.assertProfileExists(
        vdev.redundancyProfileId,
      );
      await this.assertProfileCompatible(
        updateDto.storagePoolId,
        currentProfile,
      );
    }

    await this.sequelize.transaction(async (transaction) => {
      await vdev.update(update, { transaction });
      await this.vdevEventModel.create(
        {
          logicalVdevId: vdev.id,
          storagePoolId: vdev.storagePoolId,
          action: VdevConfigAction.UPDATE,
          beforeSnapshot,
          afterSnapshot: vdev.toJSON<Record<string, unknown>>(),
          performedByUserId: performedByUserId ?? null,
        } as Partial<LogicalVdevEvent>,
        { transaction },
      );
    });
    return this.findOne(id);
  }

  async delete(
    id: string,
    performedByUserId?: string | null,
  ): Promise<boolean> {
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

    const beforeSnapshot = vdev.toJSON<Record<string, unknown>>();
    await this.sequelize.transaction(async (transaction) => {
      await this.vdevEventModel.create(
        {
          logicalVdevId: vdev.id,
          storagePoolId: vdev.storagePoolId,
          action: VdevConfigAction.DELETE,
          beforeSnapshot,
          afterSnapshot: null,
          performedByUserId: performedByUserId ?? null,
        } as Partial<LogicalVdevEvent>,
        { transaction },
      );
      await vdev.destroy({ transaction });
    });
    return true;
  }

  async getConfigHistory(id: string): Promise<LogicalVdevEvent[]> {
    await this.assertVdevExists(id);
    return this.vdevEventModel.findAll({
      where: { logicalVdevId: id },
      order: [
        ['eventTimestamp', 'DESC'],
        ['displayKey', 'DESC'],
      ],
    });
  }

  private async assertVdevExists(id: string): Promise<void> {
    const exists = await this.logicalVdevModel.findByPk(id, {
      attributes: ['id'],
    });
    if (!exists) {
      throw new NotFoundException(`LogicalVdev with ID ${id} not found`);
    }
  }

  async getPoolMemberDriveIds(
    storagePoolId: string,
    transaction?: Transaction,
  ): Promise<string[]> {
    const vdevs = await this.logicalVdevModel.findAll({
      where: { storagePoolId },
      attributes: ['id'],
      transaction,
    });
    if (vdevs.length === 0) return [];
    const members = await this.logicalDiskModel.findAll({
      where: { logicalVdevId: { [Op.in]: vdevs.map((vdev) => vdev.id) } },
      attributes: ['physicalDriveId'],
      transaction,
    });
    return [...new Set(members.map((member) => member.physicalDriveId))];
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

  private async assertProfileCompatible(
    storagePoolId: string,
    profile: VdevProfile,
  ): Promise<void> {
    const pool = await this.storagePoolModel.findByPk(storagePoolId);
    if (!pool) {
      throw new NotFoundException(
        `StoragePool with ID ${storagePoolId} not found`,
      );
    }
    const poolType = await this.poolTypeModel.findByPk(pool.poolTypeId);
    if (!poolType) {
      throw new NotFoundException(
        `PoolType with ID ${pool.poolTypeId} not found`,
      );
    }
    const allowedByType: Record<string, string[]> = {
      ZFS: ['ZFS', 'GENERIC'],
      BTRFS: ['BTRFS', 'GENERIC'],
      CEPH_OSD_POOL: ['CEPH', 'GENERIC'],
      MDRAID: ['MDRAID', 'GENERIC'],
      RAW_JBOD: ['GENERIC'],
    };
    const allowed = allowedByType[poolType.name] ?? ['GENERIC'];
    if (!allowed.includes(profile.technology)) {
      throw new ConflictException(
        `Vdev profile ${profile.code} (${profile.technology}) is not compatible with pool type ${poolType.name}`,
      );
    }
  }

  private async assertProfileExists(id: string): Promise<VdevProfile> {
    const profile = await this.vdevProfileModel.findByPk(id);
    if (!profile) {
      throw new NotFoundException(`VdevProfile with ID ${id} not found`);
    }
    return profile;
  }

  private async assertUniqueName(
    storagePoolId: string,
    vdevName: string,
    exceptId?: string,
  ): Promise<void> {
    const existing = await this.logicalVdevModel.findOne({
      where: { storagePoolId, vdevName: { [Op.iLike]: vdevName } },
    });
    if (existing && existing.id !== exceptId) {
      throw new ConflictException(
        `LogicalVdev with name "${vdevName}" already exists in storage pool ${storagePoolId}`,
      );
    }
  }
}
