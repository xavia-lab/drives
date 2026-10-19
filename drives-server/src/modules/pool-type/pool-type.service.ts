import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PoolType } from './entities/pool-type.entity';
import { CreatePoolTypeDto } from './dto/create-pool-type.dto';
import { UpdatePoolTypeDto } from './dto/update-pool-type.dto';
import { QueryPoolTypeDto } from './dto/query-pool-type.dto';
import { PaginationService } from '../pagination/pagination.service';
import { PaginatedResponse } from '../pagination/interfaces/paginated-response';

@Injectable()
export class PoolTypeService {
  constructor(
    @InjectModel(PoolType)
    private readonly poolTypeModel: typeof PoolType,
    private readonly paginationService: PaginationService,
  ) {}

  async findAll(
    query?: QueryPoolTypeDto,
  ): Promise<PaginatedResponse<PoolType>> {
    return this.paginationService.paginate<PoolType>(this.poolTypeModel, query);
  }

  async findOne(id: string): Promise<PoolType | null> {
    return this.poolTypeModel.findByPk(id);
  }

  async createPoolType(
    createPoolTypeDto: CreatePoolTypeDto,
  ): Promise<PoolType> {
    const existingByName = await this.poolTypeModel.findOne({
      where: { name: createPoolTypeDto.name },
    });

    if (existingByName) {
      throw new ConflictException(
        `PoolType with name "${createPoolTypeDto.name}" already exists`,
      );
    }

    return this.poolTypeModel.create(createPoolTypeDto as Partial<PoolType>);
  }

  async updatePoolType(
    id: string,
    updatePoolTypeDto: UpdatePoolTypeDto,
  ): Promise<PoolType> {
    const poolType = await this.poolTypeModel.findByPk(id);

    if (!poolType) {
      throw new NotFoundException(`PoolType with ID ${id} not found`);
    }

    if (poolType.managed) {
      throw new ConflictException('System-managed PoolTypes cannot be updated');
    }

    if (updatePoolTypeDto.name) {
      const existing = await this.poolTypeModel.findOne({
        where: { name: updatePoolTypeDto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `PoolType with name "${updatePoolTypeDto.name}" already exists`,
        );
      }
    }

    const updateData: Partial<PoolType> = {};
    if (updatePoolTypeDto.name !== undefined)
      updateData.name = updatePoolTypeDto.name;
    if (updatePoolTypeDto.managed !== undefined)
      updateData.managed = updatePoolTypeDto.managed;

    return poolType.update(updateData);
  }

  async deletePoolType(id: string): Promise<boolean> {
    const poolType = await this.poolTypeModel.findByPk(id);

    if (!poolType) {
      throw new NotFoundException(`PoolType with ID ${id} not found`);
    }

    if (poolType.managed) {
      throw new ConflictException('System-managed PoolTypes cannot be deleted');
    }

    const deletedCount = await this.poolTypeModel.destroy({ where: { id } });
    return deletedCount > 0;
  }
}
