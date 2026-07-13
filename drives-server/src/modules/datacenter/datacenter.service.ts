import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Datacenter } from './entities/datacenter.entity';
import { Country } from '../country/entities/country.entity';
import { CreateDatacenterDto } from './dto/create-datacenter.dto';
import { UpdateDatacenterDto } from './dto/update-datacenter.dto';
import { QueryDatacenterDto } from './dto/query-datacenter.dto';
import { PaginationService } from '../common/pagination/pagination.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response';

@Injectable()
export class DatacenterService {
  constructor(
    @InjectModel(Datacenter)
    private readonly datacenterModel: typeof Datacenter,
    @InjectModel(Country)
    private readonly countryModel: typeof Country,
    private readonly paginationService: PaginationService,
  ) {}

  // 🌟 Optimized private helper to check foreign key constraints concurrently and aggregate errors
  private async validateForeignKeys(ids: {
    countryId?: string;
  }): Promise<void> {
    const checkPromises: Promise<string | null>[] = [];

    if (ids.countryId) {
      checkPromises.push(
        this.countryModel
          .findByPk(ids.countryId)
          .then((exists) =>
            exists ? null : `Country with ID ${ids.countryId} not found`,
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
    query?: QueryDatacenterDto,
  ): Promise<PaginatedResponse<Datacenter & { itemNumber: number }>> {
    // 🌟 Clean delegation to the standalone pagination service with relational inclusion
    return this.paginationService.paginate<Datacenter>(
      this.datacenterModel,
      query,
      {
        include: [Country],
      },
    );
  }

  async findOne(id: string): Promise<Datacenter | null> {
    const datacenter = await this.datacenterModel.findByPk(id, {
      include: [Country],
    });

    if (!datacenter) {
      throw new NotFoundException(`Datacenter with ID ${id} not found`);
    }

    return datacenter;
  }

  async create(createDatacenterDto: CreateDatacenterDto): Promise<Datacenter> {
    const existingByCode = await this.datacenterModel.findOne({
      where: { code: createDatacenterDto.code },
    });

    if (existingByCode) {
      throw new ConflictException(
        `Datacenter with facility code "${createDatacenterDto.code}" already exists`,
      );
    }

    // 🌟 Validate that the countryId exists concurrently before creating the record
    await this.validateForeignKeys(createDatacenterDto);

    const datacenter = await this.datacenterModel.create(
      createDatacenterDto as any,
    );
    return datacenter.reload({ include: [Country] });
  }

  async update(
    id: string,
    updateDatacenterDto: UpdateDatacenterDto,
  ): Promise<Datacenter> {
    const datacenter = await this.datacenterModel.findByPk(id);

    if (!datacenter) {
      throw new NotFoundException(`Datacenter with ID ${id} not found`);
    }

    if (updateDatacenterDto.code) {
      const existing = await this.datacenterModel.findOne({
        where: { code: updateDatacenterDto.code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Datacenter with facility code "${updateDatacenterDto.code}" already exists`,
        );
      }
    }

    // 🌟 Validate countryId exists if passed down as a modification parameter
    await this.validateForeignKeys(updateDatacenterDto);

    const updateData: Partial<Datacenter> = {};
    if (updateDatacenterDto.code !== undefined)
      updateData.code = updateDatacenterDto.code;
    if (updateDatacenterDto.name !== undefined)
      updateData.name = updateDatacenterDto.name;
    if (updateDatacenterDto.city !== undefined)
      updateData.city = updateDatacenterDto.city;
    if (updateDatacenterDto.countryId !== undefined)
      updateData.countryId = updateDatacenterDto.countryId;

    await datacenter.update(updateData);
    return datacenter.reload({ include: [Country] });
  }

  async delete(id: string): Promise<boolean> {
    const datacenter = await this.datacenterModel.findByPk(id);

    if (!datacenter) {
      throw new NotFoundException(`Datacenter with ID ${id} not found`);
    }

    const deletedCount = await this.datacenterModel.destroy({ where: { id } });
    return deletedCount > 0;
  }
}
