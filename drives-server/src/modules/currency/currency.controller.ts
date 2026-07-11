import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe, // 1. Swapped ParseIntPipe for ParseUUIDPipe
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { CurrencyService } from './currency.service';
import { Currency } from './entities/currency.entity';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';
import { QueryCurrencyDto } from './dto/query-currency.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { NotFoundException } from '@nestjs/common';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { CurrencyResponseDto } from './dto/response/currency-response.dto';
import { CheckPolicy } from '../../common/decorators/check-policy.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('currencies')
@Controller('currencies')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(CurrencyResponseDto)
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get()
  @Public()
  // @CheckPolicy('list', 'currencies')
  @ApiOperation({ summary: 'Get all currencies with pagination' })
  @ApiQuery({ type: QueryCurrencyDto })
  @ApiResponse({
    status: 200,
    description: 'Currencies retrieved successfully',
  })
  async findAll(@Query() query: QueryCurrencyDto) {
    return await this.currencyService.findAll(query);
  }

  @Get(':id')
  @Public()
  // @CheckPolicy('show', 'currencies')
  @ApiOperation({ summary: 'Get currency by ID' })
  // 2. Updated Swagger documentation metadata type hint
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Currency retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Currency not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<Currency> {
    // 3. Set version '7' validation and changed type to string
    const currency = await this.currencyService.findOne(id);
    if (!currency) {
      throw new NotFoundException(`Currency with ID ${id} not found`);
    }
    return currency;
  }

  @Post()
  @Public()
  // @CheckPolicy('create', 'currencies')
  @ApiOperation({ summary: 'Create a new currency' })
  @ApiResponse({ status: 201, description: 'Currency created successfully' })
  @ApiResponse({ status: 409, description: 'Currency already exists' })
  async create(
    @Body() createCurrencyDto: CreateCurrencyDto,
  ): Promise<Currency> {
    return this.currencyService.createCurrency(createCurrencyDto);
  }

  @Put(':id')
  @Public()
  // @CheckPolicy('edit', 'currencies')
  @ApiOperation({ summary: 'Update a currency' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Currency updated successfully' })
  @ApiResponse({ status: 404, description: 'Currency not found' })
  @ApiResponse({
    status: 409,
    description: 'System-managed currency cannot be updated',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string, // 4. Updated validation pipe and parameter typing
    @Body() updateCurrencyDto: UpdateCurrencyDto,
  ): Promise<Currency> {
    const result = await this.currencyService.updateCurrency(
      id,
      updateCurrencyDto,
    );
    if (!result) {
      throw new NotFoundException(`Currency with ID ${id} not found`);
    }
    return result;
  }

  @Delete(':id')
  @Public()
  // @CheckPolicy('delete', 'currencies')
  @ApiOperation({ summary: 'Delete a currency' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({ status: 204, description: 'Currency deleted successfully' })
  @ApiResponse({ status: 404, description: 'Currency not found' })
  @ApiResponse({
    status: 409,
    description: 'System-managed currency cannot be deleted',
  })
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string, // 5. Updated validation pipe and parameter typing
  ): Promise<{ message: string }> {
    const deleted = await this.currencyService.deleteCurrency(id);
    if (!deleted) {
      throw new NotFoundException(`Currency with ID ${id} not found`);
    } else {
      return {
        message: `Currency with ID ${id} deleted successfully`,
      };
    }
  }
}
