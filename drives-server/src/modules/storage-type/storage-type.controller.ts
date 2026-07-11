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
import { StorageTypeService } from './storage-type.service';
import { StorageType } from './entities/storage-type.entity';
import { CreateStorageTypeDto } from './dto/create-storage-type.dto';
import { UpdateStorageTypeDto } from './dto/update-storage-type.dto';
import { QueryStorageTypeDto } from './dto/query-storage-type.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { NotFoundException } from '@nestjs/common';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { StorageTypeResponseDto } from './dto/response/storage-type-response.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('storage-types')
@Controller('storage-types')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(StorageTypeResponseDto)
export class StorageTypeController {
  constructor(private readonly StorageTypeService: StorageTypeService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all Storage Types with pagination' })
  @ApiQuery({ type: QueryStorageTypeDto })
  @ApiResponse({
    status: 200,
    description: 'Storage Types retrieved successfully',
  })
  async findAll(
    @Query() query: QueryStorageTypeDto,
  ): Promise<PaginatedResponse<StorageType>> {
    return await this.StorageTypeService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get StorageType by ID' })
  // 2. Updated Swagger documentation metadata type hint
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'StorageType retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'StorageType not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<StorageType> {
    // 3. Tightened validation to version '7' and updated parameter type
    const StorageType = await this.StorageTypeService.findOne(id);
    if (!StorageType) {
      throw new NotFoundException(`StorageType with ID ${id} not found`);
    }
    return StorageType;
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new StorageType' })
  @ApiResponse({
    status: 201,
    description: 'StorageType created successfully',
  })
  @ApiResponse({ status: 409, description: 'StorageType already exists' })
  async create(
    @Body() createStorageTypeDto: CreateStorageTypeDto,
  ): Promise<StorageType> {
    return this.StorageTypeService.createStorageType(createStorageTypeDto);
  }

  @Put(':id')
  @Public()
  @ApiOperation({ summary: 'Update a StorageType' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'StorageType updated successfully',
  })
  @ApiResponse({ status: 404, description: 'StorageType not found' })
  @ApiResponse({
    status: 409,
    description: 'System-managed StorageType cannot be updated',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string, // 4. Enforced validation and changed type to string
    @Body() updateStorageTypeDto: UpdateStorageTypeDto,
  ): Promise<StorageType> {
    const result = await this.StorageTypeService.updateStorageType(
      id,
      updateStorageTypeDto,
    );
    if (!result) {
      throw new NotFoundException(`StorageType with ID ${id} not found`);
    }
    return result;
  }

  @Delete(':id')
  @Public()
  @ApiOperation({ summary: 'Delete a StorageType' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: 'StorageType deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'StorageType not found' })
  @ApiResponse({
    status: 409,
    description: 'System-managed StorageType cannot be deleted',
  })
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string, // 5. Enforced validation and changed type to string
  ): Promise<{ message: string }> {
    const deleted = await this.StorageTypeService.deleteStorageType(id);
    if (!deleted) {
      throw new NotFoundException(`StorageType with ID ${id} not found`);
    } else {
      return {
        message: `StorageType with ID ${id} deleted successfully`,
      };
    }
  }
}
