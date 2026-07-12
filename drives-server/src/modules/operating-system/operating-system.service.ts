import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { OperatingSystem } from './entities/operating-system.entity';
import { CreateOperatingSystemDto } from './dto/create-operating-system.dto';
import { UpdateOperatingSystemDto } from './dto/update-operating-system.dto';
import { QueryOperatingSystemDto } from './dto/query-operating-system.dto';
import { PaginationService } from '../common/pagination/pagination.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response';

@Injectable()
export class OperatingSystemService {
  constructor(
    @InjectModel(OperatingSystem)
    private readonly osModel: typeof OperatingSystem,
    private readonly paginationService: PaginationService,
  ) {}

  async findAll(
    query?: QueryOperatingSystemDto,
  ): Promise<PaginatedResponse<OperatingSystem & { itemNumber: number }>> {
    return this.paginationService.paginate<OperatingSystem>(
      this.osModel,
      query,
    );
  }

  async findOne(id: string): Promise<OperatingSystem | null> {
    const os = await this.osModel.findByPk(id);
    if (!os)
      throw new NotFoundException(`OperatingSystem with ID ${id} not found`);
    return os;
  }

  async create(createDto: CreateOperatingSystemDto): Promise<OperatingSystem> {
    const existing = await this.osModel.findOne({
      where: { name: createDto.name },
    });
    if (existing)
      throw new ConflictException(
        `OperatingSystem with name "${createDto.name}" already exists`,
      );
    return this.osModel.create(createDto as any);
  }

  async update(
    id: string,
    updateDto: UpdateOperatingSystemDto,
  ): Promise<OperatingSystem> {
    const os = await this.osModel.findByPk(id);
    if (!os)
      throw new NotFoundException(`OperatingSystem with ID ${id} not found`);

    if (updateDto.name) {
      const existing = await this.osModel.findOne({
        where: { name: updateDto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `OperatingSystem with name "${updateDto.name}" already exists`,
        );
      }
    }

    const updateData: Partial<OperatingSystem> = {};
    if (updateDto.name !== undefined) updateData.name = updateDto.name;
    if (updateDto.vendor !== undefined) updateData.vendor = updateDto.vendor;

    return os.update(updateData);
  }

  async delete(id: string): Promise<boolean> {
    const os = await this.osModel.findByPk(id);
    if (!os)
      throw new NotFoundException(`OperatingSystem with ID ${id} not found`);
    const count = await this.osModel.destroy({ where: { id } });
    return count > 0;
  }
}
