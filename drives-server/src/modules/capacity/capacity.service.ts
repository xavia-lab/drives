import {
  Injectable,
  ConflictException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Capacity } from './entities/capacity.entity';
import { CreateCapacityDto } from './dto/create-capacity.dto';
import { UpdateCapacityDto } from './dto/update-capacity.dto';
import { QueryCapacityDto } from './dto/query-capacity.dto';
import { PaginationService } from '../common/pagination/pagination.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response';

@Injectable()
export class CapacityService implements OnModuleInit {
  constructor(
    @InjectModel(Capacity)
    private readonly capacityModel: typeof Capacity,
    private readonly paginationService: PaginationService, // 🌟 Clean composition injection
  ) {}

  async onModuleInit() {
    await this.seedDefaultCapacities();
  }

  private async seedDefaultCapacities(): Promise<void> {
    const defaultCapacities: {
      name: string;
      value: number;
      unit: string;
    }[] = [];

    for (const capacityData of defaultCapacities) {
      const existing = await this.capacityModel.findOne({
        where: { name: capacityData.name },
      });

      if (!existing) {
        await this.capacityModel.create({
          ...capacityData,
          managed: true,
        });
        console.log(`Seeded default capacity: ${capacityData.name}`);
      }
    }
  }

  async findAll(
    query?: QueryCapacityDto,
  ): Promise<PaginatedResponse<Capacity & { itemNumber: number }>> {
    // 🌟 Clean delegation to the standalone service
    return this.paginationService.paginate<Capacity>(this.capacityModel, query);
  }

  async findOne(id: string): Promise<Capacity | null> {
    return this.capacityModel.findByPk(id);
  }

  async createCapacity(
    createCapacityDto: CreateCapacityDto,
  ): Promise<Capacity> {
    const existingByName = await this.capacityModel.findOne({
      where: { name: createCapacityDto.name },
    });

    if (existingByName) {
      throw new ConflictException(
        `Capacity with name "${createCapacityDto.name}" already exists`,
      );
    }

    return this.capacityModel.create(createCapacityDto as any);
  }

  async updateCapacity(
    id: string,
    updateCapacityDto: UpdateCapacityDto,
  ): Promise<Capacity> {
    const capacity = await this.capacityModel.findByPk(id);

    if (!capacity) {
      throw new NotFoundException(`Capacity with ID ${id} not found`);
    }

    if (capacity.managed) {
      throw new ConflictException(
        'System-managed capacities cannot be updated',
      );
    }

    if (updateCapacityDto.name) {
      const existing = await this.capacityModel.findOne({
        where: { name: updateCapacityDto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Capacity with name "${updateCapacityDto.name}" already exists`,
        );
      }
    }

    // Filter down to only passed payload items to keep the query clean
    const updateData: Partial<Capacity> = {};
    if (updateCapacityDto.name !== undefined)
      updateData.name = updateCapacityDto.name;
    if (updateCapacityDto.value !== undefined)
      updateData.value = updateCapacityDto.value;
    if (updateCapacityDto.unit !== undefined)
      updateData.unit = updateCapacityDto.unit;

    return capacity.update(updateData);
  }

  async deleteCapacity(id: string): Promise<boolean> {
    const capacity = await this.capacityModel.findByPk(id);

    if (!capacity) {
      throw new NotFoundException(`Capacity with ID ${id} not found`);
    }

    if (capacity.managed) {
      throw new ConflictException(
        'System-managed capacities cannot be deleted',
      );
    }

    const deletedCount = await this.capacityModel.destroy({ where: { id } });
    return deletedCount > 0;
  }
}
