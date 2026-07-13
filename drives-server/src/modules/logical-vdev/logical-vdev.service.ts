import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { LogicalVdev } from './entities/logical-vdev.entity';
import { StoragePool } from '../storage-pool/entities/storage-pool.entity';
import { CreateLogicalVdevDto } from './dto/create-logical-vdev.dto';
import { UpdateLogicalVdevDto } from './dto/update-logical-vdev.dto';
import { QueryLogicalVdevDto } from './dto/query-logical-vdev.dto';
import { PaginationService } from '../common/pagination/pagination.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response';

@Injectable()
export class LogicalVdevService {
  constructor(
    @InjectModel(LogicalVdev)
    private readonly logicalVdevModel: typeof LogicalVdev,
    @InjectModel(StoragePool)
    private readonly storagePoolModel: typeof StoragePool,
    private readonly paginationService: PaginationService,
  ) {}

  // 🌟 Private helper to check foreign key constraints concurrently and aggregate errors
  private async validateForeignKeys(ids: {
    storagePoolId?: string;
  }): Promise<void> {
    const checkPromises: Promise<string | null>[] = [];

    if (ids.storagePoolId) {
      checkPromises.push(
        this.storagePoolModel
          .findByPk(ids.storagePoolId)
          .then((exists) =>
            exists
              ? null
              : `StoragePool with ID ${ids.storagePoolId} not found`,
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
    query?: QueryLogicalVdevDto,
  ): Promise<PaginatedResponse<LogicalVdev & { itemNumber: number }>> {
    // Clean delegation to the standalone pagination service with relational inclusion
    return this.paginationService.paginate<LogicalVdev>(
      this.logicalVdevModel,
      query,
      {
        include: [StoragePool],
      },
    );
  }

  async findOne(id: string): Promise<LogicalVdev | null> {
    const vdev = await this.logicalVdevModel.findByPk(id, {
      include: [StoragePool],
    });

    if (!vdev) {
      throw new NotFoundException(`LogicalVdev with ID ${id} not found`);
    }

    return vdev;
  }

  async create(createDto: CreateLogicalVdevDto): Promise<LogicalVdev> {
    // Enforce unique naming within the same pool boundary context
    const existingByName = await this.logicalVdevModel.findOne({
      where: {
        storagePoolId: createDto.storagePoolId,
        vdevName: createDto.vdevName,
      },
    });

    if (existingByName) {
      throw new ConflictException(
        `LogicalVdev with name "${createDto.vdevName}" already exists in storage pool ${createDto.storagePoolId}`,
      );
    }

    // 🌟 Validate that the parent storagePoolId exists concurrently before creating the record
    await this.validateForeignKeys(createDto);

    const vdev = await this.logicalVdevModel.create(createDto as any);
    return vdev.reload({ include: [StoragePool] });
  }

  async update(
    id: string,
    updateDto: UpdateLogicalVdevDto,
  ): Promise<LogicalVdev> {
    const vdevObject = await this.logicalVdevModel.findByPk(id);

    if (!vdevObject) {
      throw new NotFoundException(`LogicalVdev with ID ${id} not found`);
    }

    // Enforce unique naming boundaries if names or parent pool associations are updated
    if (updateDto.vdevName || updateDto.storagePoolId) {
      const targetPool = updateDto.storagePoolId ?? vdevObject.storagePoolId;
      const targetName = updateDto.vdevName ?? vdevObject.vdevName;

      const existing = await this.logicalVdevModel.findOne({
        where: { storagePoolId: targetPool, vdevName: targetName },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `LogicalVdev with name "${targetName}" already exists in storage pool ${targetPool}`,
        );
      }
    }

    // 🌟 Validate parent key reference existences concurrently
    await this.validateForeignKeys(updateDto);

    const updateData: Partial<LogicalVdev> = {};
    if (updateDto.vdevName !== undefined)
      updateData.vdevName = updateDto.vdevName;
    if (updateDto.vdevRedundancyProfile !== undefined)
      updateData.vdevRedundancyProfile = updateDto.vdevRedundancyProfile;
    if (updateDto.storagePoolId !== undefined)
      updateData.storagePoolId = updateDto.storagePoolId;

    await vdevObject.update(updateData);
    return vdevObject.reload({ include: [StoragePool] });
  }

  async delete(id: string): Promise<boolean> {
    const vdevObject = await this.logicalVdevModel.findByPk(id);

    if (!vdevObject) {
      throw new NotFoundException(`LogicalVdev with ID ${id} not found`);
    }

    const deletedCount = await this.logicalVdevModel.destroy({ where: { id } });
    return deletedCount > 0;
  }
}
