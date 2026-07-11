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
import { CapacityService } from './capacity.service';
import { Capacity } from './entities/capacity.entity';
import { CreateCapacityDto } from './dto/create-capacity.dto';
import { UpdateCapacityDto } from './dto/update-capacity.dto';
import { QueryCapacityDto } from './dto/query-capacity.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { NotFoundException } from '@nestjs/common';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { CapacityResponseDto } from './dto/response/capacity-response.dto';
import { CheckPolicy } from '../../common/decorators/check-policy.decorator';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('capacities')
@Controller('capacities')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(CapacityResponseDto)
export class CapacityController {
  constructor(private readonly capacityService: CapacityService) {}

  @Get()
  @Public()
  // @CheckPolicy('list', 'capacities')
  @ApiOperation({ summary: 'Get all capacities with pagination' })
  @ApiQuery({ type: QueryCapacityDto })
  @ApiResponse({
    status: 200,
    description: 'Currencies retrieved successfully',
  })
  async findAll(@Query() query: QueryCapacityDto) {
    return await this.capacityService.findAll(query);
  }

  @Get(':id')
  @Public()
  // @CheckPolicy('show', 'capacities')
  @ApiOperation({ summary: 'Get capacity by ID' })
  // 2. Updated Swagger documentation metadata type hint
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Capacity retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Capacity not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<Capacity> {
    // 3. Set version '7' validation and changed type to string
    const capacity = await this.capacityService.findOne(id);
    if (!capacity) {
      throw new NotFoundException(`Capacity with ID ${id} not found`);
    }
    return capacity;
  }

  @Post()
  @Public()
  // @CheckPolicy('create', 'capacities')
  @ApiOperation({ summary: 'Create a new capacity' })
  @ApiResponse({ status: 201, description: 'Capacity created successfully' })
  @ApiResponse({ status: 409, description: 'Capacity already exists' })
  async create(
    @Body() createCapacityDto: CreateCapacityDto,
  ): Promise<Capacity> {
    return this.capacityService.createCapacity(createCapacityDto);
  }

  @Put(':id')
  @Public()
  // @CheckPolicy('edit', 'capacities')
  @ApiOperation({ summary: 'Update a capacity' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Capacity updated successfully' })
  @ApiResponse({ status: 404, description: 'Capacity not found' })
  @ApiResponse({
    status: 409,
    description: 'System-managed capacity cannot be updated',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string, // 4. Updated validation pipe and parameter typing
    @Body() updateCapacityDto: UpdateCapacityDto,
  ): Promise<Capacity> {
    const result = await this.capacityService.updateCapacity(
      id,
      updateCapacityDto,
    );
    if (!result) {
      throw new NotFoundException(`Capacity with ID ${id} not found`);
    }
    return result;
  }

  @Delete(':id')
  @Public()
  // @CheckPolicy('delete', 'capacities')
  @ApiOperation({ summary: 'Delete a capacity' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({ status: 204, description: 'Capacity deleted successfully' })
  @ApiResponse({ status: 404, description: 'Capacity not found' })
  @ApiResponse({
    status: 409,
    description: 'System-managed capacity cannot be deleted',
  })
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string, // 5. Updated validation pipe and parameter typing
  ): Promise<{ message: string }> {
    const deleted = await this.capacityService.deleteCapacity(id);
    if (!deleted) {
      throw new NotFoundException(`Capacity with ID ${id} not found`);
    } else {
      return {
        message: `Capacity with ID ${id} deleted successfully`,
      };
    }
  }
}
