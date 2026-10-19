import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import { Order, Includeable } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { StoragePool } from './entities/storage-pool.entity';
import {
  StoragePoolHost,
  StoragePoolHostEventType,
} from './entities/storage-pool-host.entity';
import { PhysicalServer } from '../physical-server/entities/physical-server.entity';
import { VirtualServer } from '../virtual-server/entities/virtual-server.entity';
import { PoolType } from '../pool-type/entities/pool-type.entity';
import { CreateStoragePoolDto } from './dto/create-storage-pool.dto';
import { UpdateStoragePoolDto } from './dto/update-storage-pool.dto';
import { QueryStoragePoolDto } from './dto/query-storage-pool.dto';
import { ImportStoragePoolDto } from './dto/import-storage-pool.dto';
import { ExportStoragePoolDto } from './dto/export-storage-pool.dto';
import { PaginationService } from '../pagination/pagination.service';
import { PaginatedResponse } from '../pagination/interfaces/paginated-response';

interface CurrentPoolHost {
  type: 'PHYSICAL' | 'VIRTUAL';
  serverId: string;
  hostname: string;
}

const EVENT_ORDER_DESC: Order = [
  ['eventTimestamp', 'DESC'],
  ['displayKey', 'DESC'],
];
const CURRENT_HOST_MAP_ORDER: Order = [
  ['storagePoolId', 'ASC'],
  ['eventTimestamp', 'DESC'],
  ['displayKey', 'DESC'],
];

@Injectable()
export class StoragePoolService {
  constructor(
    @InjectModel(StoragePool)
    private readonly storagePoolModel: typeof StoragePool,
    @InjectModel(StoragePoolHost)
    private readonly storagePoolHostModel: typeof StoragePoolHost,
    @InjectModel(PhysicalServer)
    private readonly physicalServerModel: typeof PhysicalServer,
    @InjectModel(VirtualServer)
    private readonly virtualServerModel: typeof VirtualServer,
    @InjectModel(PoolType)
    private readonly poolTypeModel: typeof PoolType,
    private readonly paginationService: PaginationService,
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  // Relations eagerly loaded for reads: the full IMPORT/EXPORT log plus the
  // resolved host of each event. The timeline order is applied in JS (see
  // `sortEvents`) because Sequelize ignores `order` on an `include`.
  private get readIncludes(): Includeable[] {
    return [
      {
        model: StoragePoolHost,
        as: 'hosts',
        include: [PhysicalServer, VirtualServer],
      },
    ];
  }

  // Ascending chronology: oldest first, `displayKey` breaking ties.
  private sortEvents(events: StoragePoolHost[]): StoragePoolHost[] {
    return [...events].sort((a, b) => {
      const delta =
        new Date(a.eventTimestamp).getTime() -
        new Date(b.eventTimestamp).getTime();
      if (delta !== 0) return delta;
      return (a.displayKey ?? 0) - (b.displayKey ?? 0);
    });
  }

  // Private helper to check foreign key constraints concurrently and aggregate errors
  private async validateForeignKeys(
    ids: {
      poolTypeId?: string;
      serverId?: string;
      virtualServerId?: string;
    },
    transaction?: Transaction,
  ): Promise<void> {
    const checkPromises: Promise<string | null>[] = [];

    if (ids.poolTypeId) {
      checkPromises.push(
        this.poolTypeModel
          .findByPk(ids.poolTypeId, { transaction })
          .then((exists) =>
            exists ? null : `PoolType with ID ${ids.poolTypeId} not found`,
          ),
      );
    }
    if (ids.serverId) {
      checkPromises.push(
        this.physicalServerModel
          .findByPk(ids.serverId, { transaction })
          .then((exists) =>
            exists ? null : `PhysicalServer with ID ${ids.serverId} not found`,
          ),
      );
    }
    if (ids.virtualServerId) {
      checkPromises.push(
        this.virtualServerModel
          .findByPk(ids.virtualServerId, { transaction })
          .then((exists) =>
            exists
              ? null
              : `VirtualServer with ID ${ids.virtualServerId} not found`,
          ),
      );
    }

    const results = await Promise.all(checkPromises);
    const errors = results.filter((error): error is string => error !== null);

    if (errors.length > 0) {
      throw new NotFoundException(errors.join('\n'));
    }
  }

  // Enforces the polymorphic host XOR: at most one host kind per event, and —
  // when `required` — exactly one (used by IMPORT).
  private verifyHostExclusivity(
    serverId?: string | null,
    virtualServerId?: string | null,
    required = false,
  ): void {
    if (serverId && virtualServerId) {
      throw new BadRequestException(
        'A storage pool cannot be assigned to both a physical server and a virtual server simultaneously.',
      );
    }
    if (required && !serverId && !virtualServerId) {
      throw new BadRequestException(
        'An IMPORT event must target either a physical server or a virtual server.',
      );
    }
  }

  // Derives the current host from a single (latest) event. EXPORT events and no
  // event at all mean the pool is detached.
  private mapCurrentHost(
    event?: StoragePoolHost | null,
  ): CurrentPoolHost | null {
    if (!event || event.eventType !== StoragePoolHostEventType.IMPORT) {
      return null;
    }

    if (event.physicalServerId) {
      return {
        type: 'PHYSICAL',
        serverId: event.physicalServerId,
        hostname: event.physicalServer?.hostname ?? '',
      };
    }

    return {
      type: 'VIRTUAL',
      serverId: event.virtualServerId as string,
      hostname: event.virtualServer?.hostname ?? '',
    };
  }

  // Loads a single pool with its full event timeline and a derived `currentHost`.
  private async loadWithHosts(
    id: string,
    transaction?: Transaction,
  ): Promise<StoragePool> {
    const pool = await this.storagePoolModel.findByPk(id, {
      include: this.readIncludes,
      transaction,
    });

    if (!pool) {
      throw new NotFoundException(`StoragePool with ID ${id} not found`);
    }

    const hosts = this.sortEvents(pool.hosts ?? []);
    pool.setDataValue('hosts', hosts);
    const latest = hosts.length > 0 ? hosts[hosts.length - 1] : null;
    pool.setDataValue('currentHost', this.mapCurrentHost(latest));

    return pool;
  }

  // Returns the latest event for a single pool (or null when there is no history).
  private async getLatestEvent(
    storagePoolId: string,
    transaction?: Transaction,
  ): Promise<StoragePoolHost | null> {
    return this.storagePoolHostModel.findOne({
      where: { storagePoolId },
      order: EVENT_ORDER_DESC,
      transaction,
    });
  }

  // Batched "current host" derivation for a set of pools: one query, reduce to
  // the latest event per pool in memory.
  private async getCurrentHostMap(
    poolIds: string[],
  ): Promise<Map<string, CurrentPoolHost | null>> {
    const map = new Map<string, CurrentPoolHost | null>();
    if (poolIds.length === 0) {
      return map;
    }

    const events = await this.storagePoolHostModel.findAll({
      where: { storagePoolId: { [Op.in]: poolIds } },
      include: [PhysicalServer, VirtualServer],
      order: CURRENT_HOST_MAP_ORDER,
    });

    for (const event of events) {
      if (!map.has(event.storagePoolId)) {
        map.set(event.storagePoolId, this.mapCurrentHost(event));
      }
    }
    for (const id of poolIds) {
      if (!map.has(id)) {
        map.set(id, null);
      }
    }

    return map;
  }

  async findAll(
    query?: QueryStoragePoolDto,
  ): Promise<PaginatedResponse<StoragePool>> {
    const result = await this.paginationService.paginate<StoragePool>(
      this.storagePoolModel,
      query,
      {},
    );

    const poolIds = result.data.map((pool) => pool.id);
    const currentHostMap = await this.getCurrentHostMap(poolIds);
    for (const pool of result.data) {
      pool.setDataValue('currentHost', currentHostMap.get(pool.id) ?? null);
    }

    return result;
  }

  async findOne(id: string): Promise<StoragePool | null> {
    return this.loadWithHosts(id);
  }

  async create(createDto: CreateStoragePoolDto): Promise<StoragePool> {
    return this.sequelize.transaction(async (transaction) => {
      // 1. Enforce polymorphic host exclusivity (at most one initial host)
      this.verifyHostExclusivity(createDto.serverId, createDto.virtualServerId);

      // 2. Validate targeted foreign key references exist concurrently
      await this.validateForeignKeys(createDto, transaction);

      // 3. Persist the pool row itself (no host columns any more)
      const pool = await this.storagePoolModel.create(
        {
          ...(createDto.id ? { id: createDto.id } : {}),
          poolName: createDto.poolName,
          poolTypeId: createDto.poolTypeId,
          encryptionEnabled: createDto.encryptionEnabled ?? false,
        } as Partial<StoragePool>,
        { transaction },
      );

      // 4. Optionally record the initial IMPORT so the pool is attached
      if (createDto.serverId || createDto.virtualServerId) {
        await this.storagePoolHostModel.create(
          {
            storagePoolId: pool.id,
            physicalServerId: createDto.serverId ?? null,
            virtualServerId: createDto.virtualServerId ?? null,
            eventType: StoragePoolHostEventType.IMPORT,
            eventTimestamp: new Date(),
          } as Partial<StoragePoolHost>,
          { transaction },
        );
      }

      return this.loadWithHosts(pool.id, transaction);
    });
  }

  async update(
    id: string,
    updateDto: UpdateStoragePoolDto,
  ): Promise<StoragePool> {
    const poolObject = await this.storagePoolModel.findByPk(id);

    if (!poolObject) {
      throw new NotFoundException(`StoragePool with ID ${id} not found`);
    }

    await this.validateForeignKeys({ poolTypeId: updateDto.poolTypeId });

    const updateData: Partial<StoragePool> = {};
    if (updateDto.poolName !== undefined)
      updateData.poolName = updateDto.poolName;
    if (updateDto.poolTypeId !== undefined)
      updateData.poolTypeId = updateDto.poolTypeId;
    if (updateDto.encryptionEnabled !== undefined)
      updateData.encryptionEnabled = updateDto.encryptionEnabled;

    await poolObject.update(updateData);

    return this.loadWithHosts(id);
  }

  // Attaches a detached pool to a host by appending an IMPORT event. The pool
  // row is locked so concurrent imports on the same pool serialize.
  async importPool(
    id: string,
    importDto: ImportStoragePoolDto,
  ): Promise<StoragePool> {
    return this.sequelize.transaction(async (transaction) => {
      const pool = await this.storagePoolModel.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!pool) {
        throw new NotFoundException(`StoragePool with ID ${id} not found`);
      }

      this.verifyHostExclusivity(
        importDto.serverId,
        importDto.virtualServerId,
        true,
      );

      const latest = await this.getLatestEvent(id, transaction);
      if (latest && latest.eventType === StoragePoolHostEventType.IMPORT) {
        throw new ConflictException(
          `StoragePool with ID ${id} is already attached to a host; export it before importing again.`,
        );
      }

      await this.validateForeignKeys(
        {
          serverId: importDto.serverId,
          virtualServerId: importDto.virtualServerId,
        },
        transaction,
      );

      await this.storagePoolHostModel.create(
        {
          storagePoolId: id,
          physicalServerId: importDto.serverId ?? null,
          virtualServerId: importDto.virtualServerId ?? null,
          eventType: StoragePoolHostEventType.IMPORT,
          eventTimestamp: importDto.eventTimestamp
            ? new Date(importDto.eventTimestamp)
            : new Date(),
          notes: importDto.notes ?? null,
        } as Partial<StoragePoolHost>,
        { transaction },
      );

      return this.loadWithHosts(id, transaction);
    });
  }

  // Detaches an attached pool by appending an EXPORT event for its current host.
  async exportPool(
    id: string,
    exportDto: ExportStoragePoolDto,
  ): Promise<StoragePool> {
    return this.sequelize.transaction(async (transaction) => {
      const pool = await this.storagePoolModel.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!pool) {
        throw new NotFoundException(`StoragePool with ID ${id} not found`);
      }

      const latest = await this.getLatestEvent(id, transaction);
      if (!latest || latest.eventType !== StoragePoolHostEventType.IMPORT) {
        throw new ConflictException(
          `StoragePool with ID ${id} is not attached to a host; nothing to export.`,
        );
      }

      await this.storagePoolHostModel.create(
        {
          storagePoolId: id,
          physicalServerId: latest.physicalServerId ?? null,
          virtualServerId: latest.virtualServerId ?? null,
          eventType: StoragePoolHostEventType.EXPORT,
          eventTimestamp: exportDto.eventTimestamp
            ? new Date(exportDto.eventTimestamp)
            : new Date(),
          notes: exportDto.notes ?? null,
        } as Partial<StoragePoolHost>,
        { transaction },
      );

      return this.loadWithHosts(id, transaction);
    });
  }

  // Returns the pools currently attached to a given host (derived from the log).
  async findAttached(filter: {
    physicalServerId?: string;
    virtualServerId?: string;
  }): Promise<StoragePool[]> {
    const { physicalServerId, virtualServerId } = filter;

    if (!physicalServerId && !virtualServerId) {
      throw new BadRequestException(
        'Either physicalServerId or virtualServerId must be provided.',
      );
    }
    if (physicalServerId && virtualServerId) {
      throw new BadRequestException(
        'Provide either physicalServerId or virtualServerId, not both.',
      );
    }

    const events = await this.storagePoolHostModel.findAll({
      where: physicalServerId ? { physicalServerId } : { virtualServerId },
      attributes: ['storagePoolId'],
    });

    const candidateIds = Array.from(
      new Set(events.map((event) => event.storagePoolId)),
    );
    if (candidateIds.length === 0) {
      return [];
    }

    const currentHostMap = await this.getCurrentHostMap(candidateIds);
    const attachedIds = candidateIds.filter((poolId) => {
      const current = currentHostMap.get(poolId);
      if (!current) return false;
      return physicalServerId
        ? current.serverId === physicalServerId
        : current.serverId === virtualServerId;
    });

    if (attachedIds.length === 0) {
      return [];
    }

    const pools = await this.storagePoolModel.findAll({
      where: { id: { [Op.in]: attachedIds } },
      order: [['displayKey', 'ASC']],
    });
    for (const pool of pools) {
      pool.setDataValue('currentHost', currentHostMap.get(pool.id) ?? null);
    }

    return pools;
  }

  async delete(id: string): Promise<boolean> {
    const poolObject = await this.storagePoolModel.findByPk(id);

    if (!poolObject) {
      throw new NotFoundException(`StoragePool with ID ${id} not found`);
    }

    const deletedCount = await this.storagePoolModel.destroy({ where: { id } });
    return deletedCount > 0;
  }
}
