import {
  Injectable,
  ConflictException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Country } from './entities/country.entity';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { QueryCountryDto } from './dto/query-country.dto';
import { PaginationService } from '../common/pagination/pagination.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response';

@Injectable()
export class CountryService implements OnModuleInit {
  constructor(
    @InjectModel(Country)
    private readonly countryModel: typeof Country,
    private readonly paginationService: PaginationService, // 🌟 Clean composition injection
  ) {}

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

  async findAll(
    query?: QueryCountryDto,
  ): Promise<PaginatedResponse<Country & { itemNumber: number }>> {
    // 🌟 Clean delegation to the standalone service
    return this.paginationService.paginate<Country>(this.countryModel, query);
  }

  async findOne(id: string): Promise<Country | null> {
    return this.countryModel.findByPk(id);
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

    return this.countryModel.create(createCountryDto as any);
  }

  async updateCountry(
    id: string,
    updateCountryDto: UpdateCountryDto,
  ): Promise<Country> {
    const country = await this.countryModel.findByPk(id);

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

    // Filter down to only passed payload items to keep the query clean
    const updateData: Partial<Country> = {};
    if (updateCountryDto.name !== undefined)
      updateData.name = updateCountryDto.name;
    if (updateCountryDto.code !== undefined)
      updateData.code = updateCountryDto.code;
    if (updateCountryDto.managed !== undefined)
      updateData.managed = updateCountryDto.managed;

    return country.update(updateData);
  }

  async deleteCountry(id: string): Promise<boolean> {
    const country = await this.countryModel.findByPk(id);

    if (!country) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }

    if (country.managed) {
      throw new ConflictException('System-managed countries cannot be deleted');
    }

    const deletedCount = await this.countryModel.destroy({ where: { id } });
    return deletedCount > 0;
  }
}
