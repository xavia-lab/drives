import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { DriveLifecycleEventService } from './drive-lifecycle-event.service';
import { CreateDriveLifecycleEventDto } from './dto/create-drive-lifecycle-event.dto';
import { DriveLifecycleTimelineResponseDto } from './dto/response/drive-lifecycle-timeline-response.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { Public } from '../../common/decorators/public.decorator';
import { CheckPolicy } from '../../common/decorators/check-policy.decorator';
import { RequestUser } from '../../common/decorators/request-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';

@ApiTags('drive-lifecycle')
@Controller('physical-drives')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
export class DriveLifecycleController {
  constructor(
    private readonly driveLifecycleEventService: DriveLifecycleEventService,
  ) {}

  @Get(':id/lifecycle')
  @Public()
  @Serialize(DriveLifecycleTimelineResponseDto)
  @ApiOperation({
    summary:
      'Get the lifecycle timeline and derived current state for a physical drive',
  })
  @ApiParam({ name: 'id', description: 'The physical drive UUIDv7 id' })
  @ApiResponse({ status: 200, type: DriveLifecycleTimelineResponseDto })
  @ApiResponse({ status: 404, description: 'Physical drive not found' })
  async getTimeline(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<DriveLifecycleTimelineResponseDto> {
    return this.driveLifecycleEventService.getTimeline(id);
  }

  @Post(':id/lifecycle-events')
  @CheckPolicy('create', 'drive-lifecycle-events')
  @Serialize(DriveLifecycleTimelineResponseDto)
  @ApiOperation({
    summary:
      'Append a lifecycle event to a physical drive (append-only, transition-validated)',
  })
  @ApiParam({ name: 'id', description: 'The physical drive UUIDv7 id' })
  @ApiResponse({ status: 201, type: DriveLifecycleTimelineResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid event payload' })
  @ApiResponse({ status: 404, description: 'Physical drive or user not found' })
  @ApiResponse({
    status: 409,
    description:
      'Illegal lifecycle transition, terminal state, non-monotonic timestamp, or replacement already linked',
  })
  async recordEvent(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() dto: CreateDriveLifecycleEventDto,
    @RequestUser() user?: AuthenticatedUser,
  ): Promise<DriveLifecycleTimelineResponseDto> {
    const performedByUserId =
      user?.dbUser?.id ?? user?.id ?? dto.performedByUserId ?? null;
    const triggeredBy =
      dto.triggeredBy ??
      user?.username ??
      user?.email ??
      performedByUserId ??
      undefined;

    return this.driveLifecycleEventService.recordEvent(id, dto, {
      performedByUserId,
      triggeredBy,
    });
  }
}
