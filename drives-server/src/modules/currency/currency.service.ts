import {
  Injectable,
  ConflictException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Currency } from './entities/currency.entity';
import { BaseCrudService } from '../base/base-crud.service';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { QueryCurrencyDto } from './dto/query-currency.dto';
import { QueryBuilderService } from '../../common/services/query-builder/query-builder.service';
import { PaginatedResponse } from '../../common/interfaces/paginated-response';

@Injectable()
export class CurrencyService
  extends BaseCrudService<Currency>
  implements OnModuleInit
{
  constructor(
    @InjectModel(Currency)
    private currencyModel: typeof Currency,
    protected queryBuilder: QueryBuilderService,
  ) {
    super(currencyModel, queryBuilder);
  }

  async onModuleInit() {
    await this.seedDefaultCurrencies();
  }

  private async seedDefaultCurrencies(): Promise<void> {
    const defaultCurrencies: {
      name: string;
      code: string;
      symbol: string;
    }[] = [];

    for (const currencyData of defaultCurrencies) {
      const existing = await this.currencyModel.findOne({
        where: { code: currencyData.code },
      });

      if (!existing) {
        await this.currencyModel.create({
          ...currencyData,
          managed: true,
        });
        console.log(`Seeded default currency: ${currencyData.code}`);
      }
    }
  }

  async createCurrency(
    createCurrencyDto: CreateCurrencyDto,
  ): Promise<Currency> {
    const existingByName = await this.currencyModel.findOne({
      where: { name: createCurrencyDto.name },
    });

    const existingByCode = await this.currencyModel.findOne({
      where: { code: createCurrencyDto.code },
    });

    if (existingByName) {
      throw new ConflictException(
        `Currency with name "${createCurrencyDto.name}" already exists`,
      );
    }

    if (existingByCode) {
      throw new ConflictException(
        `Currency with code "${createCurrencyDto.code}" already exists`,
      );
    }

    return super.create(createCurrencyDto);
  }

  async updateCurrency(
    id: string,
    updateCurrencyDto: UpdateCurrencyDto,
  ): Promise<Currency> {
    const currency = await super.findOne(id);

    if (!currency) {
      throw new NotFoundException(`Currency with ID ${id} not found`);
    }

    if (currency.managed) {
      throw new ConflictException(
        'System-managed currencies cannot be updated',
      );
    }

    if (updateCurrencyDto.name) {
      const existing = await this.currencyModel.findOne({
        where: { name: updateCurrencyDto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Currency with name "${updateCurrencyDto.name}" already exists`,
        );
      }
    }

    if (updateCurrencyDto.code) {
      const existing = await this.currencyModel.findOne({
        where: { code: updateCurrencyDto.code },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Currency with code "${updateCurrencyDto.code}" already exists`,
        );
      }
    }

    const updateData: Partial<Currency> = {};
    if (updateCurrencyDto.name !== undefined)
      updateData.name = updateCurrencyDto.name;
    if (updateCurrencyDto.code !== undefined)
      updateData.code = updateCurrencyDto.code;
    if (updateCurrencyDto.symbol !== undefined)
      updateData.symbol = updateCurrencyDto.symbol;
    if (updateCurrencyDto.managed !== undefined)
      updateData.managed = updateCurrencyDto.managed;

    const result = await super.update(id, updateData);
    if (!result) {
      throw new NotFoundException(`Currency with ID ${id} not found`);
    }
    return result;
  }

  async deleteCurrency(id: string): Promise<boolean> {
    const currency = await super.findOne(id);

    if (!currency) {
      throw new NotFoundException(`Currency with ID ${id} not found`);
    }

    if (currency.managed) {
      throw new ConflictException(
        'System-managed currencies cannot be deleted',
      );
    }

    return super.delete(id);
  }

  async findAllCurrencies(
    query?: QueryCurrencyDto,
  ): Promise<PaginatedResponse<Currency>> {
    return super.findAll(query);
  }
}
