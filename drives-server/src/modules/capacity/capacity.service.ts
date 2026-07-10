import {
  Injectable,
  ConflictException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Capacity } from './entities/capacity.entity';
import { BaseCrudService } from '../base/base-crud.service';
import { CreateCapacityDto } from './dto/create-capacity.dto';
import { UpdateCapacityDto } from './dto/update-capacity.dto';
import { QueryCapacityDto } from './dto/query-capacity.dto';
import { QueryBuilderService } from '../../common/services/query-builder/query-builder.service';
import { PaginatedResponse } from '../../common/interfaces/paginated-response';

@Injectable()
export class CapacityService
  extends BaseCrudService<Capacity>
  implements OnModuleInit
{
  constructor(
    @InjectModel(Capacity)
    private capacityModel: typeof Capacity,
    protected queryBuilder: QueryBuilderService,
  ) {
    super(capacityModel, queryBuilder);
  }

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

    return super.create(createCapacityDto);
  }

  async updateCapacity(
    id: number,
    updateCapacityDto: UpdateCapacityDto,
  ): Promise<Capacity> {
    const capacity = await super.findOne(id);

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

    const updateData: Partial<Capacity> = {};
    if (updateCapacityDto.name !== undefined)
      updateData.name = updateCapacityDto.name;
    if (updateCapacityDto.value !== undefined)
      updateData.value = updateCapacityDto.value;
    if (updateCapacityDto.unit !== undefined)
      updateData.unit = updateCapacityDto.unit;
    if (updateCapacityDto.managed !== undefined)
      updateData.managed = updateCapacityDto.managed;

    const result = await super.update(id, updateData);
    if (!result) {
      throw new NotFoundException(`Capacity with ID ${id} not found`);
    }
    return result;
  }

  async deleteCapacity(id: number): Promise<boolean> {
    const capacity = await super.findOne(id);

    if (!capacity) {
      throw new NotFoundException(`Capacity with ID ${id} not found`);
    }

    if (capacity.managed) {
      throw new ConflictException(
        'System-managed capacities cannot be deleted',
      );
    }

    return super.delete(id);
  }

  async findAllCurrencies(
    query?: QueryCapacityDto,
  ): Promise<PaginatedResponse<Capacity>> {
    return super.findAll(query);
  }
}
