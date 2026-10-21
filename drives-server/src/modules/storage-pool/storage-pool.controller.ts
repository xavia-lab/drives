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
import { ImportStoragePoolDto } from './dto/import-storage-pool.dto';
import { ExportStoragePoolDto } from './dto/export-storage-pool.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { StoragePoolResponseDto } from './dto/response/storage-pool-response.dto';
import { PaginatedResponse } from '../pagination/interfaces/paginated-response';

import { CheckPolicy } from '../../common/decorators/check-policy.decorator';
@ApiTags('storage-pools')
@Controller('storage-pools')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(StoragePoolResponseDto)
export class StoragePoolController {
  constructor(private readonly storagePoolService: StoragePoolService) {}

  @Get()
  @CheckPolicy('list', 'storage-pools')
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

  @Get('attached')
  @CheckPolicy('list', 'storage-pools')
  @ApiOperation({
    summary: 'Get storage pools currently attached to a host',
  })
  @ApiQuery({
    name: 'physicalServerId',
    required: false,
    description: 'Filter by the physical server the pool is attached to',
  })
  @ApiQuery({
    name: 'virtualServerId',
    required: false,
    description: 'Filter by the virtual server the pool is attached to',
  })
  @ApiResponse({
    status: 200,
    description: 'Attached storage pools retrieved successfully',
  })
  async findAttached(
    @Query('physicalServerId') physicalServerId?: string,
    @Query('virtualServerId') virtualServerId?: string,
  ): Promise<StoragePool[]> {
    return await this.storagePoolService.findAttached({
      physicalServerId,
      virtualServerId,
    });
  }

  @Get(':id')
  @CheckPolicy('show', 'storage-pools')
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
  @CheckPolicy('create', 'storage-pools')
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
  @CheckPolicy('edit', 'storage-pools')
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

  @Post(':id/import')
  @CheckPolicy('import', 'storage-pools')
  @ApiOperation({
    summary: 'Attach a detached storage pool to a host (IMPORT event)',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 201,
    description: 'Storage Pool imported onto the host successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Storage Pool is already attached to a host',
  })
  async importPool(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() importDto: ImportStoragePoolDto,
  ): Promise<StoragePool> {
    return this.storagePoolService.importPool(id, importDto);
  }

  @Post(':id/export')
  @CheckPolicy('export', 'storage-pools')
  @ApiOperation({
    summary: 'Detach an attached storage pool from its host (EXPORT event)',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 201,
    description: 'Storage Pool exported from its host successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Storage Pool is not attached to any host',
  })
  async exportPool(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() exportDto: ExportStoragePoolDto,
  ): Promise<StoragePool> {
    return this.storagePoolService.exportPool(id, exportDto);
  }

  @Delete(':id')
  @CheckPolicy('delete', 'storage-pools')
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
