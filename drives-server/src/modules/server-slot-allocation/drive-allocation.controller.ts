import {
  Body,
  Controller,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import {
  ServerSlotAllocationService,
  type DriveAllocationResult,
} from './server-slot-allocation.service';
import { AllocateDrivesDto } from './dto/allocate-drives.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { CheckPolicy } from '../../common/decorators/check-policy.decorator';
import { RequestUser } from '../../common/decorators/request-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';

import { InvalidateCache } from '../cache/cache.decorators';
import { CACHE_TAGS } from '../cache/cache.tags';
@ApiTags('drive-allocation')
@Controller('physical-servers')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
export class DriveAllocationController {
  constructor(
    private readonly allocationService: ServerSlotAllocationService,
  ) {}

  @Post('allocations')
  @InvalidateCache(CACHE_TAGS.PHYSICAL_DRIVES, CACHE_TAGS.DASHBOARD)
  @CheckPolicy('save', 'server-slot-allocations')
  @ApiOperation({
    summary:
      'Drive Allocation workflow: detach drives from a source server and/or seat drives in a target server in one transaction',
  })
  @ApiResponse({
    status: 201,
    description: 'Allocation applied successfully',
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid payload, slot not owned by the target, or duplicate slot/drive',
  })
  @ApiResponse({
    status: 404,
    description: 'Server, slot, drive or datacenter not found',
  })
  @ApiResponse({
    status: 409,
    description:
      'A server/drive is outside the datacenter, a drive is not detached from the source, or a slot is occupied',
  })
  async allocate(
    @Body() dto: AllocateDrivesDto,
    @RequestUser() user?: AuthenticatedUser,
  ): Promise<DriveAllocationResult> {
    return this.allocationService.allocateDrives(
      dto,
      this.resolveActorId(user),
    );
  }

  private resolveActorId(user?: AuthenticatedUser): string {
    const actorId = user?.dbUser?.id ?? user?.id;
    if (!actorId) {
      throw new UnauthorizedException(
        'An authenticated operator is required to allocate drives',
      );
    }
    return actorId;
  }
}
