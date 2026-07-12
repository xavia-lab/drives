import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { StoragePool } from './entities/storage-pool.entity';
import { Server } from '../server/entities/server.entity';
import { VirtualServer } from '../virtual-server/entities/virtual-server.entity';
import { CreateStoragePoolDto } from './dto/create-storage-pool.dto';
import { UpdateStoragePoolDto } from './dto/update-storage-pool.dto';
import { QueryStoragePoolDto } from './dto/query-storage-pool.dto';
import { PaginationService } from '../common/pagination/pagination.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response';

@Injectable()
export class StoragePoolService {
  constructor(
    @InjectModel(StoragePool)
    private readonly storagePoolModel: typeof StoragePool,
    @InjectModel(Server)
    private readonly serverModel: typeof Server,
    @InjectModel(VirtualServer)
    private readonly virtualServerModel: typeof VirtualServer,
    private readonly paginationService: PaginationService,
  ) {}

  // 🌟 Private helper to check foreign key constraints concurrently and aggregate errors
  private async validateForeignKeys(ids: {
    serverId?: string;
    virtualServerId?: string;
  }): Promise<void> {
    const checkPromises: Promise<string | null>[] = [];

    if (ids.serverId) {
      checkPromises.push(
        this.serverModel
          .findByPk(ids.serverId)
          .then((exists) =>
            exists ? null : `Server with ID ${ids.serverId} not found`,
          ),
      );
    }
    if (ids.virtualServerId) {
      checkPromises.push(
        this.virtualServerModel
          .findByPk(ids.virtualServerId)
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

  // Helper method enforcing target exclusivity logic checks (XOR)
  private verifyTargetExclusivity(
    serverId?: string,
    virtualServerId?: string,
  ): void {
    if (serverId && virtualServerId) {
      throw new BadRequestException(
        'A storage pool cannot be assigned to both a physical server and a virtual server simultaneously.',
      );
    }
    if (!serverId && !virtualServerId) {
      throw new BadRequestException(
        'A storage pool must be assigned to either a physical server or a virtual server.',
      );
    }
  }

  async findAll(
    query?: QueryStoragePoolDto,
  ): Promise<PaginatedResponse<StoragePool & { itemNumber: number }>> {
    return this.paginationService.paginate<StoragePool>(
      this.storagePoolModel,
      query,
      {
        include: [Server, VirtualServer],
      },
    );
  }

  async findOne(id: string): Promise<StoragePool | null> {
    const pool = await this.storagePoolModel.findByPk(id, {
      include: [Server, VirtualServer],
    });

    if (!pool) {
      throw new NotFoundException(`StoragePool with ID ${id} not found`);
    }

    return pool;
  }

  async create(createDto: CreateStoragePoolDto): Promise<StoragePool> {
    // 1. Enforce business rule check matching table exclusivity constraint (XOR)
    this.verifyTargetExclusivity(createDto.serverId, createDto.virtualServerId);

    // 2. Validate targeted foreign key references exist concurrently
    await this.validateForeignKeys(createDto);

    const pool = await this.storagePoolModel.create(createDto as any);
    return pool.reload({ include: [Server, VirtualServer] });
  }

  async update(
    id: string,
    updateDto: UpdateStoragePoolDto,
  ): Promise<StoragePool> {
    const poolObject = await this.storagePoolModel.findByPk(id);

    if (!poolObject) {
      throw new NotFoundException(`StoragePool with ID ${id} not found`);
    }

    // 1. Enforce business rule logic checks if reference shifts are executed
    if (
      updateDto.serverId !== undefined ||
      updateDto.virtualServerId !== undefined
    ) {
      const finalServerId =
        updateDto.serverId !== undefined
          ? updateDto.serverId
          : poolObject.serverId;
      const finalVirtualServerId =
        updateDto.virtualServerId !== undefined
          ? updateDto.virtualServerId
          : poolObject.virtualServerId;

      this.verifyTargetExclusivity(
        finalServerId || undefined,
        finalVirtualServerId || undefined,
      );
    }

    // 2. Validate parsed keys for existence concurrently
    await this.validateForeignKeys(updateDto);

    const updateData: Partial<StoragePool> = {};
    if (updateDto.poolName !== undefined)
      updateData.poolName = updateDto.poolName;
    if (updateDto.poolType !== undefined)
      updateData.poolType = updateDto.poolType;
    if (updateDto.encryptionEnabled !== undefined)
      updateData.encryptionEnabled = updateDto.encryptionEnabled;
    if (updateDto.serverId !== undefined)
      updateData.serverId = updateDto.serverId;
    if (updateDto.virtualServerId !== undefined)
      updateData.virtualServerId = updateDto.virtualServerId;

    await poolObject.update(updateData);
    return poolObject.reload({ include: [Server, VirtualServer] });
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
