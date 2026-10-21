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
import { CpuModelService } from './cpu-model.service';
import { CpuModel } from './entities/cpu-model.entity';
import { CreateCpuModelDto } from './dto/create-cpu-model.dto';
import { UpdateCpuModelDto } from './dto/update-cpu-model.dto';
import { QueryCpuModelDto } from './dto/query-cpu-model.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { CpuModelResponseDto } from './dto/response/cpu-model-response.dto';
import { PaginatedResponse } from '../pagination/interfaces/paginated-response';

import { Cacheable, InvalidateCache } from '../cache/cache.decorators';
import { CheckPolicy } from '../../common/decorators/check-policy.decorator';
@ApiTags('cpu-models')
@Controller('cpu-models')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(CpuModelResponseDto)
export class CpuModelController {
  constructor(private readonly cpuModelService: CpuModelService) {}

  @Get()
  @CheckPolicy('list', 'cpu-models')
  @Cacheable({ tags: ['cpu-models'] })
  @ApiOperation({ summary: 'Get all CPU Models with pagination' })
  @ApiQuery({ type: QueryCpuModelDto })
  @ApiResponse({
    status: 200,
    description: 'CPU Models retrieved successfully',
  })
  async findAll(
    @Query() query: QueryCpuModelDto,
  ): Promise<PaginatedResponse<CpuModel>> {
    return await this.cpuModelService.findAll(query);
  }

  @Get(':id')
  @CheckPolicy('show', 'cpu-models')
  @Cacheable({ tags: ['cpu-models'] })
  @ApiOperation({ summary: 'Get CPU Model by ID' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'CPU Model retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'CPU Model not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<CpuModel> {
    const cpuModelObject = await this.cpuModelService.findOne(id);
    if (!cpuModelObject) {
      throw new NotFoundException(`CpuModel with ID ${id} not found`);
    }
    return cpuModelObject;
  }

  @Post()
  @CheckPolicy('create', 'cpu-models')
  @InvalidateCache('cpu-models')
  @ApiOperation({ summary: 'Create a new CPU model' })
  @ApiResponse({
    status: 201,
    description: 'CPU Model created successfully',
  })
  @ApiResponse({ status: 409, description: 'CPU Model name already exists' })
  async create(
    @Body() createCpuModelDto: CreateCpuModelDto,
  ): Promise<CpuModel> {
    return this.cpuModelService.create(createCpuModelDto);
  }

  @Put(':id')
  @CheckPolicy('edit', 'cpu-models')
  @InvalidateCache('cpu-models')
  @ApiOperation({ summary: 'Update a CPU model' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'CPU Model updated successfully',
  })
  @ApiResponse({ status: 404, description: 'CPU Model not found' })
  @ApiResponse({ status: 409, description: 'CPU Model name conflict error' })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() updateCpuModelDto: UpdateCpuModelDto,
  ): Promise<CpuModel> {
    const result = await this.cpuModelService.update(id, updateCpuModelDto);
    if (!result) {
      throw new NotFoundException(`CpuModel with ID ${id} not found`);
    }
    return result;
  }

  @Delete(':id')
  @CheckPolicy('delete', 'cpu-models')
  @InvalidateCache('cpu-models')
  @ApiOperation({ summary: 'Delete a CPU model' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'CPU Model deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'CPU Model not found' })
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<{ message: string }> {
    const deleted = await this.cpuModelService.delete(id);
    if (!deleted) {
      throw new NotFoundException(`CpuModel with ID ${id} not found`);
    } else {
      return {
        message: `CpuModel with ID ${id} deleted successfully`,
      };
    }
  }
}
