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
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { DatacenterService } from './datacenter.service';
import { Datacenter } from './entities/datacenter.entity';
import { CreateDatacenterDto } from './dto/create-datacenter.dto';
import { UpdateDatacenterDto } from './dto/update-datacenter.dto';
import { QueryDatacenterDto } from './dto/query-datacenter.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { DatacenterResponseDto } from './dto/response/datacenter-response.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('datacenters')
@Controller('datacenters')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(DatacenterResponseDto)
export class DatacenterController {
  constructor(private readonly datacenterService: DatacenterService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all Datacenters with pagination' })
  @ApiQuery({ type: QueryDatacenterDto })
  @ApiResponse({
    status: 200,
    description: 'Datacenters retrieved successfully',
  })
  async findAll(
    @Query() query: QueryDatacenterDto,
  ): Promise<PaginatedResponse<Datacenter>> {
    return await this.datacenterService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get Datacenter by ID' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Datacenter retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Datacenter not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<Datacenter> {
    const datacenterObject = await this.datacenterService.findOne(id);
    if (!datacenterObject) {
      throw new NotFoundException(`Datacenter with ID ${id} not found`);
    }
    return datacenterObject;
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new datacenter' })
  @ApiResponse({
    status: 201,
    description: 'Datacenter created successfully',
  })
  @ApiResponse({ status: 404, description: 'Referenced countryId not found' })
  @ApiResponse({ status: 409, description: 'Datacenter code already exists' })
  async create(
    @Body() createDatacenterDto: CreateDatacenterDto,
  ): Promise<Datacenter> {
    return this.datacenterService.create(createDatacenterDto);
  }

  @Put(':id')
  @Public()
  @ApiOperation({ summary: 'Update a datacenter' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Datacenter updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Datacenter or countryId not found',
  })
  @ApiResponse({
    status: 409,
    description: 'System-managed datacenter cannot be updated or code conflict',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() updateDatacenterDto: UpdateDatacenterDto,
  ): Promise<Datacenter> {
    const result = await this.datacenterService.update(id, updateDatacenterDto);
    if (!result) {
      throw new NotFoundException(`Datacenter with ID ${id} not found`);
    }
    return result;
  }

  @Delete(':id')
  @Public()
  @ApiOperation({ summary: 'Delete a datacenter' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Datacenter deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Datacenter not found' })
  @ApiResponse({
    status: 409,
    description: 'System-managed datacenter cannot be deleted',
  })
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<{ message: string }> {
    const deleted = await this.datacenterService.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Datacenter with ID ${id} not found`);
    } else {
      return {
        message: `Datacenter with ID ${id} deleted successfully`,
      };
    }
  }
}
