import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { LogicalDisk } from './entities/logical-disk.entity';
import { LogicalVdev } from '../logical-vdev/entities/logical-vdev.entity';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { CreateLogicalDiskDto } from './dto/create-logical-disk.dto';
import { UpdateLogicalDiskDto } from './dto/update-logical-disk.dto';
import { QueryLogicalDiskDto } from './dto/query-logical-disk.dto';
import { PaginationService } from '../common/pagination/pagination.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response';

@Injectable()
export class LogicalDiskService {
  constructor(
    @InjectModel(LogicalDisk)
    private readonly logicalDiskModel: typeof LogicalDisk,
    @InjectModel(LogicalVdev)
    private readonly logicalVdevModel: typeof LogicalVdev,
    @InjectModel(PhysicalDrive)
    private readonly physicalDriveModel: typeof PhysicalDrive,
    private readonly paginationService: PaginationService,
  ) {}

  // Private helper to check foreign key constraints concurrently and aggregate errors
  private async validateForeignKeys(ids: {
    logicalVdevId?: string;
    physicalDriveId?: string;
  }): Promise<void> {
    const checkPromises: Promise<string | null>[] = [];

    if (ids.logicalVdevId) {
      checkPromises.push(
        this.logicalVdevModel
          .findByPk(ids.logicalVdevId)
          .then((exists) =>
            exists
              ? null
              : `LogicalVdev with ID ${ids.logicalVdevId} not found`,
          ),
      );
    }
    if (ids.physicalDriveId) {
      checkPromises.push(
        this.physicalDriveModel
          .findByPk(ids.physicalDriveId)
          .then((exists) =>
            exists
              ? null
              : `PhysicalDrive with ID ${ids.physicalDriveId} not found`,
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
    query?: QueryLogicalDiskDto,
  ): Promise<PaginatedResponse<LogicalDisk & { itemNumber: number }>> {
    return this.paginationService.paginate<LogicalDisk>(
      this.logicalDiskModel,
      query,
      {
        include: [LogicalVdev, PhysicalDrive],
      },
    );
  }

  async findOne(id: string): Promise<LogicalDisk | null> {
    const disk = await this.logicalDiskModel.findByPk(id, {
      include: [LogicalVdev, PhysicalDrive],
    });

    if (!disk) {
      throw new NotFoundException(`LogicalDisk with ID ${id} not found`);
    }

    return disk;
  }

  async create(createDto: CreateLogicalDiskDto): Promise<LogicalDisk> {
    // 1. Unique Constraint Check: Enforce uniqueness of physical drive allocation
    const existingByDrive = await this.logicalDiskModel.findOne({
      where: { physicalDriveId: createDto.physicalDriveId },
    });

    if (existingByDrive) {
      throw new ConflictException(
        `PhysicalDrive with ID "${createDto.physicalDriveId}" is already allocated to an active logical virtual device setup`,
      );
    }

    // 2. Validate all incoming foreign keys concurrently before creation
    await this.validateForeignKeys(createDto);

    const disk = await this.logicalDiskModel.create(createDto as any);
    return disk.reload({ include: [LogicalVdev, PhysicalDrive] });
  }

  async update(
    id: string,
    updateDto: UpdateLogicalDiskDto,
  ): Promise<LogicalDisk> {
    const diskObject = await this.logicalDiskModel.findByPk(id);

    if (!diskObject) {
      throw new NotFoundException(`LogicalDisk with ID ${id} not found`);
    }

    // Enforce unique drive mapping restrictions if modifications map to alternative hardware drives
    if (updateDto.physicalDriveId) {
      const existing = await this.logicalDiskModel.findOne({
        where: { physicalDriveId: updateDto.physicalDriveId },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `PhysicalDrive with ID "${updateDto.physicalDriveId}" is already allocated to an active logical virtual device setup`,
        );
      }
    }

    // Validate parent reference existences concurrently
    await this.validateForeignKeys(updateDto);

    const updateData: Partial<LogicalDisk> = {};
    if (updateDto.osDeviceNodePath !== undefined)
      updateData.osDeviceNodePath = updateDto.osDeviceNodePath;
    if (updateDto.isSpareDrive !== undefined)
      updateData.isSpareDrive = updateDto.isSpareDrive;
    if (updateDto.logicalVdevId !== undefined)
      updateData.logicalVdevId = updateDto.logicalVdevId;
    if (updateDto.physicalDriveId !== undefined)
      updateData.physicalDriveId = updateDto.physicalDriveId;

    await diskObject.update(updateData);
    return diskObject.reload({ include: [LogicalVdev, PhysicalDrive] });
  }

  async delete(id: string): Promise<boolean> {
    const diskObject = await this.logicalDiskModel.findByPk(id);

    if (!diskObject) {
      throw new NotFoundException(`LogicalDisk with ID ${id} not found`);
    }

    const deletedCount = await this.logicalDiskModel.destroy({ where: { id } });
    return deletedCount > 0;
  }
}
