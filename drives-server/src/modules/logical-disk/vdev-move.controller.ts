import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { CheckPolicy } from '../../common/decorators/check-policy.decorator';
import { RequestUser } from '../../common/decorators/request-user.decorator';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';
import { VdevMembershipService } from './vdev-membership.service';
import { MoveVdevMembersDto } from './dto/move-vdev-members.dto';
import { LogicalDiskMemberResponseDto } from './dto/response/logical-disk-member-response.dto';

@ApiTags('vdev-memberships')
@Controller('vdev-memberships')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
export class VdevMoveController {
  constructor(private readonly membershipService: VdevMembershipService) {}

  @Post('move')
  @CheckPolicy('move', 'logical-disks')
  @Serialize(LogicalDiskMemberResponseDto)
  @ApiOperation({ summary: 'Atomically move member drives to other vdevs' })
  async move(
    @Body() dto: MoveVdevMembersDto,
    @RequestUser() user?: AuthenticatedUser,
  ) {
    const actorId = user?.dbUser?.id ?? user?.id ?? null;
    return this.membershipService.move(dto, actorId);
  }

  @Post('reconcile')
  @CheckPolicy('reconcile', 'logical-disks')
  @ApiOperation({
    summary: 'Rebuild the current vdev membership projection from events',
  })
  async reconcile() {
    return this.membershipService.reconcileProjection();
  }
}
