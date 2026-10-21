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
import { WarrantyClaimEventService } from './warranty-claim-event.service';
import { CreateWarrantyClaimEventDto } from './dto/create-warranty-claim-event.dto';
import { WarrantyClaimTimelineResponseDto } from './dto/response/warranty-claim-timeline-response.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { CheckPolicy } from '../../common/decorators/check-policy.decorator';
import { RequestUser } from '../../common/decorators/request-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';

import { InvalidateCache } from '../cache/cache.decorators';
import { CACHE_TAGS } from '../cache/cache.tags';
@ApiTags('warranty-claim-tracking')
@Controller('warranty-claims')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
export class WarrantyClaimTrackingController {
  constructor(
    private readonly warrantyClaimEventService: WarrantyClaimEventService,
  ) {}

  @Get(':id/tracking')
  @CheckPolicy('show', 'warranty-claim-events')
  @Serialize(WarrantyClaimTimelineResponseDto)
  @ApiOperation({
    summary:
      'Get the tracking timeline and derived current status for a warranty claim',
  })
  @ApiParam({ name: 'id', description: 'The warranty claim UUIDv7 id' })
  @ApiResponse({ status: 200, type: WarrantyClaimTimelineResponseDto })
  @ApiResponse({ status: 404, description: 'Warranty claim not found' })
  async getTimeline(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<WarrantyClaimTimelineResponseDto> {
    return this.warrantyClaimEventService.getTimeline(id);
  }

  @Post(':id/tracking')
  @InvalidateCache(CACHE_TAGS.DASHBOARD)
  @CheckPolicy('track', 'warranty-claim-events')
  @Serialize(WarrantyClaimTimelineResponseDto)
  @ApiOperation({
    summary:
      'Append a tracking event to a warranty claim (append-only, transition-validated)',
  })
  @ApiParam({ name: 'id', description: 'The warranty claim UUIDv7 id' })
  @ApiResponse({ status: 201, type: WarrantyClaimTimelineResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid event payload' })
  @ApiResponse({ status: 404, description: 'Warranty claim or user not found' })
  @ApiResponse({
    status: 409,
    description:
      'Illegal status transition, terminal status, or non-monotonic timestamp',
  })
  async recordEvent(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() dto: CreateWarrantyClaimEventDto,
    @RequestUser() user?: AuthenticatedUser,
  ): Promise<WarrantyClaimTimelineResponseDto> {
    const performedByUserId =
      user?.dbUser?.id ?? user?.id ?? dto.performedByUserId ?? null;

    return this.warrantyClaimEventService.recordEvent(id, dto, {
      performedByUserId,
    });
  }
}
