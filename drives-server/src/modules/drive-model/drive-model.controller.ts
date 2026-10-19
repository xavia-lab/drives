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
import { DriveModelService } from './drive-model.service';
import { DriveModel } from './entities/drive-model.entity';
import { CreateDriveModelDto } from './dto/create-drive-model.dto';
import { UpdateDriveModelDto } from './dto/update-drive-model.dto';
import { QueryDriveModelDto } from './dto/query-drive-model.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { NotFoundException } from '@nestjs/common';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { DriveModelResponseDto } from './dto/response/drive-model-response.dto';
import { PaginatedResponse } from '../pagination/interfaces/paginated-response';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('drive-models')
@Controller('drive-models')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(DriveModelResponseDto)
export class DriveModelController {
  constructor(private readonly driveModelService: DriveModelService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all Quantity Units with pagination' })
  @ApiQuery({ type: QueryDriveModelDto })
  @ApiResponse({
    status: 200,
    description: 'Quantity Units retrieved successfully',
  })
  async findAll(
    @Query() query: QueryDriveModelDto,
  ): Promise<PaginatedResponse<DriveModel>> {
    return await this.driveModelService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get DriveModel by ID' })
  // 2. Updated Swagger documentation metadata type hint
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'DriveModel retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'DriveModel not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<DriveModel> {
    // 3. Set version '7' validation and changed type to string
    const driveModelObject = await this.driveModelService.findOne(id);
    if (!driveModelObject) {
      throw new NotFoundException(`DriveModel with ID ${id} not found`);
    }
    return driveModelObject;
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new drive-model' })
  @ApiResponse({
    status: 201,
    description: 'DriveModel created successfully',
  })
  @ApiResponse({ status: 409, description: 'DriveModel already exists' })
  async create(
    @Body() createDriveModelDto: CreateDriveModelDto,
  ): Promise<DriveModel> {
    return this.driveModelService.create(createDriveModelDto);
  }

  @Put(':id')
  @Public()
  @ApiOperation({ summary: 'Update a drive-model' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'DriveModel updated successfully',
  })
  @ApiResponse({ status: 404, description: 'DriveModel not found' })
  @ApiResponse({
    status: 409,
    description: 'System-managed drive-model cannot be updated',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string, // 4. Updated validation pipe and parameter typing
    @Body() updateDriveModelDto: UpdateDriveModelDto,
  ): Promise<DriveModel> {
    const result = await this.driveModelService.update(id, updateDriveModelDto);
    if (!result) {
      throw new NotFoundException(`DriveModel with ID ${id} not found`);
    }
    return result;
  }

  @Delete(':id')
  @Public()
  @ApiOperation({ summary: 'Delete a drive-model' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: 'DriveModel deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'DriveModel not found' })
  @ApiResponse({
    status: 409,
    description: 'System-managed drive-model cannot be deleted',
  })
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string, // 5. Updated validation pipe and parameter typing
  ): Promise<{ message: string }> {
    const deleted = await this.driveModelService.delete(id);
    if (!deleted) {
      throw new NotFoundException(`DriveModel with ID ${id} not found`);
    } else {
      return {
        message: `DriveModel with ID ${id} deleted successfully`,
      };
    }
  }
}
