import {
  Injectable,
  ConflictException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Country } from './entities/country.entity';
import { BaseCrudService } from '../base/base-crud.service';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { QueryCountryDto } from './dto/query-country.dto';
import { QueryBuilderService } from '../../common/services/query-builder/query-builder.service';
import { PaginatedResponse } from '../../common/interfaces/paginated-response';

@Injectable()
export class CountryService
  extends BaseCrudService<Country>
  implements OnModuleInit
{
  constructor(
    @InjectModel(Country)
    private countryModel: typeof Country,
    protected queryBuilder: QueryBuilderService,
  ) {
    super(countryModel, queryBuilder);
  }

  async onModuleInit() {
    await this.seedDefaultCountries();
  }

  private async seedDefaultCountries(): Promise<void> {
    const defaultCountries: {
      name: string;
      code: string;
    }[] = [];

    for (const countryData of defaultCountries) {
      const existing = await this.countryModel.findOne({
        where: { code: countryData.code },
      });

      if (!existing) {
        await this.countryModel.create({
          ...countryData,
          managed: true,
        });
        console.log(`Seeded default country: ${countryData.code}`);
      }
    }
  }

  async createCountry(createCountryDto: CreateCountryDto): Promise<Country> {
    const existingByName = await this.countryModel.findOne({
      where: { name: createCountryDto.name },
    });

    const existingByCode = await this.countryModel.findOne({
      where: { code: createCountryDto.code },
    });

    if (existingByName) {
      throw new ConflictException(
        `Country with name "${createCountryDto.name}" already exists`,
      );
    }

    if (existingByCode) {
      throw new ConflictException(
        `Country with code "${createCountryDto.code}" already exists`,
      );
    }

    return super.create(createCountryDto);
  }

  async updateCountry(
    id: number,
    updateCountryDto: UpdateCountryDto,
  ): Promise<Country> {
    const country = await super.findOne(id);

    if (!country) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }

    if (country.managed) {
      throw new ConflictException('System-managed countries cannot be updated');
    }

    if (updateCountryDto.name) {
      const existing = await this.countryModel.findOne({
        where: { name: updateCountryDto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Country with name "${updateCountryDto.name}" already exists`,
        );
      }
    }

    if (updateCountryDto.code) {
      const existing = await this.countryModel.findOne({
        where: { code: updateCountryDto.code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Country with code "${updateCountryDto.code}" already exists`,
        );
      }
    }

    const updateData: Partial<Country> = {};
    if (updateCountryDto.name !== undefined)
      updateData.name = updateCountryDto.name;
    if (updateCountryDto.code !== undefined)
      updateData.code = updateCountryDto.code;
    if (updateCountryDto.managed !== undefined)
      updateData.managed = updateCountryDto.managed;

    const result = await super.update(id, updateData);
    if (!result) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }
    return result;
  }

  async deleteCountry(id: number): Promise<boolean> {
    const country = await super.findOne(id);

    if (!country) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }

    if (country.managed) {
      throw new ConflictException('System-managed countries cannot be deleted');
    }

    return super.delete(id);
  }

  async findAllCurrencies(
    query?: QueryCountryDto,
  ): Promise<PaginatedResponse<Country>> {
    return super.findAll(query);
  }
}
