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
import { DriveLifecycleEventService } from './drive-lifecycle-event.service';
import { DriveLifecycleEvent } from './entities/drive-lifecycle-event.entity';
import { CreateDriveLifecycleEventDto } from './dto/create-drive-lifecycle-event.dto';
import { UpdateDriveLifecycleEventDto } from './dto/update-drive-lifecycle-event.dto';
import { QueryDriveLifecycleEventDto } from './dto/query-drive-lifecycle-event.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { NotFoundException } from '@nestjs/common';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { DriveLifecycleEventResponseDto } from './dto/response/drive-lifecycle-event-response.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('drive-lifecycle-events')
@Controller('drive-lifecycle-events')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(DriveLifecycleEventResponseDto)
export class DriveLifecycleEventController {
  constructor(
    private readonly driveLifecycleEventService: DriveLifecycleEventService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all Quantity Units with pagination' })
  @ApiQuery({ type: QueryDriveLifecycleEventDto })
  @ApiResponse({
    status: 200,
    description: 'Quantity Units retrieved successfully',
  })
  async findAll(
    @Query() query: QueryDriveLifecycleEventDto,
  ): Promise<PaginatedResponse<DriveLifecycleEvent>> {
    return await this.driveLifecycleEventService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get DriveLifecycleEvent by ID' })
  // 2. Updated Swagger documentation metadata type hint
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'DriveLifecycleEvent retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'DriveLifecycleEvent not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string, // 3. Set version '7' validation and changed type to string
  ): Promise<DriveLifecycleEvent> {
    const driveLifecycleEventObject =
      await this.driveLifecycleEventService.findOne(id);
    if (!driveLifecycleEventObject) {
      throw new NotFoundException(
        `DriveLifecycleEvent with ID ${id} not found`,
      );
    }
    return driveLifecycleEventObject;
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new drive-lifecycle-event' })
  @ApiResponse({
    status: 201,
    description: 'DriveLifecycleEvent created successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'DriveLifecycleEvent already exists',
  })
  async create(
    @Body() createDriveLifecycleEventDto: CreateDriveLifecycleEventDto,
  ): Promise<DriveLifecycleEvent> {
    return this.driveLifecycleEventService.create(createDriveLifecycleEventDto);
  }

  @Put(':id')
  @Public()
  @ApiOperation({ summary: 'Update a drive-lifecycle-event' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'DriveLifecycleEvent updated successfully',
  })
  @ApiResponse({ status: 404, description: 'DriveLifecycleEvent not found' })
  @ApiResponse({
    status: 409,
    description: 'System-managed drive-lifecycle-event cannot be updated',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string, // 4. Updated validation pipe and parameter typing
    @Body() updateDriveLifecycleEventDto: UpdateDriveLifecycleEventDto,
  ): Promise<DriveLifecycleEvent> {
    const result = await this.driveLifecycleEventService.update(
      id,
      updateDriveLifecycleEventDto,
    );
    if (!result) {
      throw new NotFoundException(
        `DriveLifecycleEvent with ID ${id} not found`,
      );
    }
    return result;
  }

  @Delete(':id')
  @Public()
  @ApiOperation({ summary: 'Delete a drive-lifecycle-event' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: 'DriveLifecycleEvent deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'DriveLifecycleEvent not found' })
  @ApiResponse({
    status: 409,
    description: 'System-managed drive-lifecycle-event cannot be deleted',
  })
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string, // 5. Updated validation pipe and parameter typing
  ): Promise<{ message: string }> {
    const deleted = await this.driveLifecycleEventService.delete(id);
    if (!deleted) {
      throw new NotFoundException(
        `DriveLifecycleEvent with ID ${id} not found`,
      );
    } else {
      return {
        message: `DriveLifecycleEvent with ID ${id} deleted successfully`,
      };
    }
  }
}
