import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { CpuModel } from './entities/cpu-model.entity';
import { CreateCpuModelDto } from './dto/create-cpu-model.dto';
import { UpdateCpuModelDto } from './dto/update-cpu-model.dto';
import { QueryCpuModelDto } from './dto/query-cpu-model.dto';
import { PaginationService } from '../common/pagination/pagination.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response';

@Injectable()
export class CpuModelService {
  constructor(
    @InjectModel(CpuModel)
    private readonly cpuModelModel: typeof CpuModel,
    private readonly paginationService: PaginationService,
  ) {}

  async findAll(
    query?: QueryCpuModelDto,
  ): Promise<PaginatedResponse<CpuModel & { itemNumber: number }>> {
    // Clean delegation to the standalone pagination service
    return this.paginationService.paginate<CpuModel>(this.cpuModelModel, query);
  }

  async findOne(id: string): Promise<CpuModel | null> {
    const cpuModel = await this.cpuModelModel.findByPk(id);

    if (!cpuModel) {
      throw new NotFoundException(`CpuModel with ID ${id} not found`);
    }

    return cpuModel;
  }

  async create(createCpuModelDto: CreateCpuModelDto): Promise<CpuModel> {
    const existingByName = await this.cpuModelModel.findOne({
      where: { name: createCpuModelDto.name },
    });

    if (existingByName) {
      throw new ConflictException(
        `CpuModel with name "${createCpuModelDto.name}" already exists`,
      );
    }

    return this.cpuModelModel.create(createCpuModelDto as any);
  }

  async update(
    id: string,
    updateCpuModelDto: UpdateCpuModelDto,
  ): Promise<CpuModel> {
    const cpuModel = await this.cpuModelModel.findByPk(id);

    if (!cpuModel) {
      throw new NotFoundException(`CpuModel with ID ${id} not found`);
    }

    if (updateCpuModelDto.name) {
      const existing = await this.cpuModelModel.findOne({
        where: { name: updateCpuModelDto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `CpuModel with name "${updateCpuModelDto.name}" already exists`,
        );
      }
    }

    const updateData: Partial<CpuModel> = {};
    if (updateCpuModelDto.vendor !== undefined)
      updateData.vendor = updateCpuModelDto.vendor;
    if (updateCpuModelDto.name !== undefined)
      updateData.name = updateCpuModelDto.name;
    if (updateCpuModelDto.physicalCores !== undefined)
      updateData.physicalCores = updateCpuModelDto.physicalCores;
    if (updateCpuModelDto.threads !== undefined)
      updateData.threads = updateCpuModelDto.threads;
    if (updateCpuModelDto.tdpWatts !== undefined)
      updateData.tdpWatts = updateCpuModelDto.tdpWatts;

    return cpuModel.update(updateData);
  }

  async delete(id: string): Promise<boolean> {
    const cpuModel = await this.cpuModelModel.findByPk(id);

    if (!cpuModel) {
      throw new NotFoundException(`CpuModel with ID ${id} not found`);
    }

    const deletedCount = await this.cpuModelModel.destroy({ where: { id } });
    return deletedCount > 0;
  }
}
