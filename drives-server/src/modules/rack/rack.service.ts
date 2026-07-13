import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Rack } from './entities/rack.entity';
import { Datacenter } from '../datacenter/entities/datacenter.entity';
import { CreateRackDto } from './dto/create-rack.dto';
import { UpdateRackDto } from './dto/update-rack.dto';
import { QueryRackDto } from './dto/query-rack.dto';
import { PaginationService } from '../common/pagination/pagination.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response';

@Injectable()
export class RackService {
  constructor(
    @InjectModel(Rack)
    private readonly rackModel: typeof Rack,
    @InjectModel(Datacenter)
    private readonly dcModel: typeof Datacenter,
    private readonly paginationService: PaginationService,
  ) {}

  private async validateForeignKeys(ids: {
    datacenterId?: string;
  }): Promise<void> {
    const checkPromises: Promise<string | null>[] = [];
    if (ids.datacenterId) {
      checkPromises.push(
        this.dcModel
          .findByPk(ids.datacenterId)
          .then((exists) =>
            exists ? null : `Datacenter with ID ${ids.datacenterId} not found`,
          ),
      );
    }
    const results = await Promise.all(checkPromises);
    const errors = results.filter((error): error is string => error !== null);
    if (errors.length > 0) throw new NotFoundException(errors.join('\n'));
  }

  async findAll(
    query?: QueryRackDto,
  ): Promise<PaginatedResponse<Rack & { itemNumber: number }>> {
    return this.paginationService.paginate<Rack>(this.rackModel, query, {
      include: [Datacenter],
    });
  }

  async findOne(id: string): Promise<Rack | null> {
    const rack = await this.rackModel.findByPk(id, { include: [Datacenter] });
    if (!rack) throw new NotFoundException(`Rack with ID ${id} not found`);
    return rack;
  }

  async create(createDto: CreateRackDto): Promise<Rack> {
    // 1. Facility Scope Check: Enforce uniqueness constraints across shared buildings context
    const existing = await this.rackModel.findOne({
      where: { datacenterId: createDto.datacenterId, name: createDto.name },
    });
    if (existing) {
      throw new ConflictException(
        `Rack with tag name "${createDto.name}" already exists inside this facility building profile.`,
      );
    }

    await this.validateForeignKeys(createDto);
    const rack = await this.rackModel.create(createDto as any);
    return rack.reload({ include: [Datacenter] });
  }

  async update(id: string, updateDto: UpdateRackDto): Promise<Rack> {
    const rack = await this.rackModel.findByPk(id);
    if (!rack) throw new NotFoundException(`Rack with ID ${id} not found`);

    if (updateDto.name || updateDto.datacenterId) {
      const targetDc = updateDto.datacenterId ?? rack.datacenterId;
      const targetName = updateDto.name ?? rack.name;

      const existing = await this.rackModel.findOne({
        where: { datacenterId: targetDc, name: targetName },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Rack with tag name "${targetName}" already exists inside this facility building profile.`,
        );
      }
    }

    await this.validateForeignKeys(updateDto);

    const updateData: Partial<Rack> = {};
    if (updateDto.name !== undefined) updateData.name = updateDto.name;
    if (updateDto.datacenterId !== undefined)
      updateData.datacenterId = updateDto.datacenterId;
    if (updateDto.totalRackUnits !== undefined)
      updateData.totalRackUnits = updateDto.totalRackUnits;

    await rack.update(updateData);
    return rack.reload({ include: [Datacenter] });
  }

  async delete(id: string): Promise<boolean> {
    const rack = await this.rackModel.findByPk(id);
    if (!rack) throw new NotFoundException(`Rack with ID ${id} not found`);
    const count = await this.rackModel.destroy({ where: { id } });
    return count > 0;
  }
}
