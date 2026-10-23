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
import { PhysicalCpuService } from './physical-cpu.service';
import { PhysicalCpu } from './entities/physical-cpu.entity';
import { CreatePhysicalCpuDto } from './dto/create-physical-cpu.dto';
import { UpdatePhysicalCpuDto } from './dto/update-physical-cpu.dto';
import { QueryPhysicalCpuDto } from './dto/query-physical-cpu.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { PhysicalCpuResponseDto } from './dto/response/physical-cpu-response.dto';
import { PaginatedResponse } from '../pagination/interfaces/paginated-response';

import { CheckPolicy } from '../../common/decorators/check-policy.decorator';
@ApiTags('physical-cpus')
@Controller('physical-cpus')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(PhysicalCpuResponseDto)
export class PhysicalCpuController {
  constructor(private readonly physicalCpuService: PhysicalCpuService) {}

  @Get()
  @CheckPolicy('list', 'physical-cpus')
  @ApiOperation({ summary: 'Get all physical CPUs with pagination' })
  @ApiQuery({ type: QueryPhysicalCpuDto })
  @ApiResponse({
    status: 200,
    description: 'Physical CPUs retrieved successfully',
  })
  async findAll(
    @Query() query: QueryPhysicalCpuDto,
  ): Promise<PaginatedResponse<PhysicalCpu>> {
    return await this.physicalCpuService.findAll(query);
  }

  @Get(':id')
  @CheckPolicy('show', 'physical-cpus')
  @ApiOperation({ summary: 'Get PhysicalCpu by ID' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'PhysicalCpu retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'PhysicalCpu not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<PhysicalCpu> {
    const physicalCpuObject = await this.physicalCpuService.findOne(id);
    if (!physicalCpuObject) {
      throw new NotFoundException(`PhysicalCpu with ID ${id} not found`);
    }
    return physicalCpuObject;
  }

  @Post()
  @CheckPolicy('create', 'physical-cpus')
  @ApiOperation({ summary: 'Create a new physical-cpu' })
  @ApiResponse({
    status: 201,
    description: 'PhysicalCpu created successfully',
  })
  @ApiResponse({ status: 409, description: 'PhysicalCpu already exists' })
  async create(
    @Body() createPhysicalCpuDto: CreatePhysicalCpuDto,
  ): Promise<PhysicalCpu> {
    return this.physicalCpuService.create(createPhysicalCpuDto);
  }

  @Post('acquisitions')
  @CheckPolicy('acquire', 'physical-cpus')
  @ApiOperation({ summary: 'Acquire a physical CPU from the guided workflow' })
  @ApiResponse({
    status: 201,
    description: 'PhysicalCpu acquired successfully',
  })
  @ApiResponse({ status: 409, description: 'PhysicalCpu already exists' })
  async acquire(
    @Body() createPhysicalCpuDto: CreatePhysicalCpuDto,
  ): Promise<PhysicalCpu> {
    return this.physicalCpuService.create(createPhysicalCpuDto);
  }

  @Put(':id')
  @CheckPolicy('edit', 'physical-cpus')
  @ApiOperation({ summary: 'Update a physical-cpu' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'PhysicalCpu updated successfully',
  })
  @ApiResponse({ status: 404, description: 'PhysicalCpu not found' })
  @ApiResponse({
    status: 409,
    description: 'System-managed physical-cpu cannot be updated',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() updatePhysicalCpuDto: UpdatePhysicalCpuDto,
  ): Promise<PhysicalCpu> {
    const result = await this.physicalCpuService.update(
      id,
      updatePhysicalCpuDto,
    );
    if (!result) {
      throw new NotFoundException(`PhysicalCpu with ID ${id} not found`);
    }
    return result;
  }

  @Delete(':id')
  @CheckPolicy('delete', 'physical-cpus')
  @ApiOperation({ summary: 'Delete a physical-cpu' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: 'PhysicalCpu deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'PhysicalCpu not found' })
  @ApiResponse({
    status: 409,
    description: 'System-managed physical-cpu cannot be deleted',
  })
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<{ message: string }> {
    const deleted = await this.physicalCpuService.delete(id);
    if (!deleted) {
      throw new NotFoundException(`PhysicalCpu with ID ${id} not found`);
    } else {
      return {
        message: `PhysicalCpu with ID ${id} deleted successfully`,
      };
    }
  }
}
