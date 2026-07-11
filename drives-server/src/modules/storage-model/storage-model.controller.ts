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
import { StorageModelService } from './storage-model.service';
import { StorageModel } from './entities/storage-model.entity';
import { CreateStorageModelDto } from './dto/create-storage-model.dto';
import { UpdateStorageModelDto } from './dto/update-storage-model.dto';
import { QueryStorageModelDto } from './dto/query-storage-model.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { NotFoundException } from '@nestjs/common';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { StorageModelResponseDto } from './dto/response/storage-model-response.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('storage-models')
@Controller('storage-models')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(StorageModelResponseDto)
export class StorageModelController {
  constructor(private readonly storageModelService: StorageModelService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all Quantity Units with pagination' })
  @ApiQuery({ type: QueryStorageModelDto })
  @ApiResponse({
    status: 200,
    description: 'Quantity Units retrieved successfully',
  })
  async findAll(
    @Query() query: QueryStorageModelDto,
  ): Promise<PaginatedResponse<StorageModel>> {
    return await this.storageModelService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get StorageModel by ID' })
  // 2. Updated Swagger documentation metadata type hint
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'StorageModel retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'StorageModel not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<StorageModel> {
    // 3. Set version '7' validation and changed type to string
    const storageModelObject = await this.storageModelService.findOne(id);
    if (!storageModelObject) {
      throw new NotFoundException(`StorageModel with ID ${id} not found`);
    }
    return storageModelObject;
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new storage-model' })
  @ApiResponse({
    status: 201,
    description: 'StorageModel created successfully',
  })
  @ApiResponse({ status: 409, description: 'StorageModel already exists' })
  async create(
    @Body() createStorageModelDto: CreateStorageModelDto,
  ): Promise<StorageModel> {
    return this.storageModelService.createStorageModel(createStorageModelDto);
  }

  @Put(':id')
  @Public()
  @ApiOperation({ summary: 'Update a storage-model' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'StorageModel updated successfully',
  })
  @ApiResponse({ status: 404, description: 'StorageModel not found' })
  @ApiResponse({
    status: 409,
    description: 'System-managed storage-model cannot be updated',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string, // 4. Updated validation pipe and parameter typing
    @Body() updateStorageModelDto: UpdateStorageModelDto,
  ): Promise<StorageModel> {
    const result = await this.storageModelService.updateStorageModel(
      id,
      updateStorageModelDto,
    );
    if (!result) {
      throw new NotFoundException(`StorageModel with ID ${id} not found`);
    }
    return result;
  }

  @Delete(':id')
  @Public()
  @ApiOperation({ summary: 'Delete a storage-model' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: 'StorageModel deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'StorageModel not found' })
  @ApiResponse({
    status: 409,
    description: 'System-managed storage-model cannot be deleted',
  })
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string, // 5. Updated validation pipe and parameter typing
  ): Promise<{ message: string }> {
    const deleted = await this.storageModelService.deleteStorageModel(id);
    if (!deleted) {
      throw new NotFoundException(`StorageModel with ID ${id} not found`);
    } else {
      return {
        message: `StorageModel with ID ${id} deleted successfully`,
      };
    }
  }
}
