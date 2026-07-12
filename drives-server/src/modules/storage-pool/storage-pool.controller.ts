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
import { StoragePoolService } from './storage-pool.service';
import { StoragePool } from './entities/storage-pool.entity';
import { CreateStoragePoolDto } from './dto/create-storage-pool.dto';
import { UpdateStoragePoolDto } from './dto/update-storage-pool.dto';
import { QueryStoragePoolDto } from './dto/query-storage-pool.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { StoragePoolResponseDto } from './dto/response/storage-pool-response.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('storage-pools')
@Controller('storage-pools')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(StoragePoolResponseDto)
export class StoragePoolController {
  constructor(private readonly storagePoolService: StoragePoolService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all Storage Pools with pagination' })
  @ApiQuery({ type: QueryStoragePoolDto })
  @ApiResponse({
    status: 200,
    description: 'Storage Pools retrieved successfully',
  })
  async findAll(
    @Query() query: QueryStoragePoolDto,
  ): Promise<PaginatedResponse<StoragePool>> {
    return await this.storagePoolService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get Storage Pool by ID' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier of the storage pool array',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Storage Pool retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Storage Pool not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<StoragePool> {
    const poolObject = await this.storagePoolService.findOne(id);
    if (!poolObject) {
      throw new NotFoundException(`StoragePool with ID ${id} not found`);
    }
    return poolObject;
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new storage pool footprint array' })
  @ApiResponse({
    status: 201,
    description: 'Storage Pool initialized and logged successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Target exclusivity check validation failure (XOR constraint violated)',
  })
  @ApiResponse({
    status: 404,
    description: 'Referenced serverId or virtualServerId not found',
  })
  async create(@Body() createDto: CreateStoragePoolDto): Promise<StoragePool> {
    return this.storagePoolService.create(createDto);
  }

  @Put(':id')
  @Public()
  @ApiOperation({ summary: 'Update storage pool array properties' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Storage Pool updated successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Target exclusivity check validation failure (XOR constraint violated)',
  })
  @ApiResponse({
    status: 404,
    description: 'Storage Pool or related validation dependencies not found',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() updateDto: UpdateStoragePoolDto,
  ): Promise<StoragePool> {
    const result = await this.storagePoolService.update(id, updateDto);
    if (!result) {
      throw new NotFoundException(`StoragePool with ID ${id} not found`);
    }
    return result;
  }

  @Delete(':id')
  @Public()
  @ApiOperation({ summary: 'Purge a storage pool from tracking index' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Storage Pool records dropped successfully',
  })
  @ApiResponse({ status: 404, description: 'Storage Pool not found' })
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<{ message: string }> {
    const deleted = await this.storagePoolService.delete(id);
    if (!deleted) {
      throw new NotFoundException(`StoragePool with ID ${id} not found`);
    } else {
      return {
        message: `StoragePool with ID ${id} deleted successfully`,
      };
    }
  }
}
