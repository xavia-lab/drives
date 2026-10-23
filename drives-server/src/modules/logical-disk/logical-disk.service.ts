import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { LogicalDisk } from './entities/logical-disk.entity';
import { LogicalVdev } from '../logical-vdev/entities/logical-vdev.entity';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { QueryLogicalDiskDto } from './dto/query-logical-disk.dto';
import { PaginationService } from '../pagination/pagination.service';
import { PaginatedResponse } from '../pagination/interfaces/paginated-response';

@Injectable()
export class LogicalDiskService {
  constructor(
    @InjectModel(LogicalDisk)
    private readonly logicalDiskModel: typeof LogicalDisk,
    private readonly paginationService: PaginationService,
  ) {}

  async findAll(
    query?: QueryLogicalDiskDto,
  ): Promise<PaginatedResponse<LogicalDisk>> {
    return this.paginationService.paginate<LogicalDisk>(
      this.logicalDiskModel,
      query,
      { include: [LogicalVdev, PhysicalDrive] },
    );
  }

  async findOne(id: string): Promise<LogicalDisk | null> {
    return this.logicalDiskModel.findByPk(id, {
      include: [LogicalVdev, PhysicalDrive],
    });
  }

  async findByVdev(vdevId: string): Promise<LogicalDisk[]> {
    return this.logicalDiskModel.findAll({
      where: { logicalVdevId: vdevId },
      include: [PhysicalDrive],
      order: [
        ['memberRole', 'ASC'],
        ['displayKey', 'ASC'],
      ],
    });
  }

  async ensureExists(id: string): Promise<LogicalDisk> {
    const disk = await this.findOne(id);
    if (!disk) {
      throw new NotFoundException(`LogicalDisk with ID ${id} not found`);
    }
    return disk;
  }
}
