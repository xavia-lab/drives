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
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { CountryService } from './country.service';
import { Country } from './entities/country.entity';
import { CreateCountryDto } from './dto/create-country.dto';
import { UpdateCountryDto } from './dto/update-country.dto';
import { QueryCountryDto } from './dto/query-country.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { NotFoundException } from '@nestjs/common';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { CountryResponseDto } from './dto/response/country-response.dto';
import { CheckPolicy } from '../../common/decorators/check-policy.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('countries')
@Controller('countries')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(CountryResponseDto)
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  @Get()
  @Public()
  // @CheckPolicy('list', 'countries')
  @ApiOperation({ summary: 'Get all countries with pagination' })
  @ApiQuery({ type: QueryCountryDto })
  @ApiResponse({
    status: 200,
    description: 'Currencies retrieved successfully',
  })
  async findAll(@Query() query: QueryCountryDto) {
    return await this.countryService.findAll(query);
  }

  @Get(':id')
  @Public()
  // @CheckPolicy('show', 'countries')
  @ApiOperation({ summary: 'Get country by ID' })
  @ApiParam({ name: 'id', description: 'The unique identifier' })
  @ApiResponse({ status: 200, description: 'Country retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Country not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<Country> {
    const country = await this.countryService.findOne(id);
    if (!country) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }
    return country;
  }

  @Post()
  @Public()
  // @CheckPolicy('create', 'countries')
  @ApiOperation({ summary: 'Create a new country' })
  @ApiResponse({ status: 201, description: 'Country created successfully' })
  @ApiResponse({ status: 409, description: 'Country already exists' })
  async create(@Body() createCountryDto: CreateCountryDto): Promise<Country> {
    return this.countryService.createCountry(createCountryDto);
  }

  @Put(':id')
  @Public()
  // @CheckPolicy('edit', 'countries')
  @ApiOperation({ summary: 'Update a country' })
  @ApiParam({ name: 'id', description: 'The unique identifier' })
  @ApiResponse({ status: 200, description: 'Country updated successfully' })
  @ApiResponse({ status: 404, description: 'Country not found' })
  @ApiResponse({
    status: 409,
    description: 'System-managed country cannot be updated',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCountryDto: UpdateCountryDto,
  ): Promise<Country> {
    const result = await this.countryService.updateCountry(
      id,
      updateCountryDto,
    );
    if (!result) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    }
    return result;
  }

  @Delete(':id')
  @Public()
  // @CheckPolicy('delete', 'countries')
  @ApiOperation({ summary: 'Delete a country' })
  @ApiParam({ name: 'id', description: 'The unique identifier' })
  @ApiResponse({ status: 204, description: 'Country deleted successfully' })
  @ApiResponse({ status: 404, description: 'Country not found' })
  @ApiResponse({
    status: 409,
    description: 'System-managed country cannot be deleted',
  })
  async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    const deleted = await this.countryService.deleteCountry(id);
    if (!deleted) {
      throw new NotFoundException(`Country with ID ${id} not found`);
    } else {
      return {
        message: `Country with ID ${id} deleted successfully`,
      };
    }
  }
}
