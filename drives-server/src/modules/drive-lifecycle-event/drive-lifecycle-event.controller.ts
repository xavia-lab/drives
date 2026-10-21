import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
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
import { QueryDriveLifecycleEventDto } from './dto/query-drive-lifecycle-event.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { DriveLifecycleEventResponseDto } from './dto/response/drive-lifecycle-event-response.dto';
import { PaginatedResponse } from '../pagination/interfaces/paginated-response';

// Append-only ledger: events are created through the nested
// `POST /physical-drives/:id/lifecycle-events` endpoint, never updated or
// deleted here.
import { CheckPolicy } from '../../common/decorators/check-policy.decorator';
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
  @CheckPolicy('list', 'drive-lifecycle-events')
  @ApiOperation({ summary: 'Get all drive lifecycle events with pagination' })
  @ApiQuery({ type: QueryDriveLifecycleEventDto })
  @ApiResponse({
    status: 200,
    description: 'Drive lifecycle events retrieved successfully',
  })
  async findAll(
    @Query() query: QueryDriveLifecycleEventDto,
  ): Promise<PaginatedResponse<DriveLifecycleEvent>> {
    return this.driveLifecycleEventService.findAll(query);
  }

  @Get(':id')
  @CheckPolicy('show', 'drive-lifecycle-events')
  @ApiOperation({ summary: 'Get a drive lifecycle event by ID' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Drive lifecycle event retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Drive lifecycle event not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<DriveLifecycleEvent> {
    return this.driveLifecycleEventService.findOne(id);
  }
}
