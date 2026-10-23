import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { CheckPolicy } from '../../common/decorators/check-policy.decorator';
import { RequestUser } from '../../common/decorators/request-user.decorator';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';
import { VdevMembershipService } from './vdev-membership.service';
import { AttachVdevMembersDto } from './dto/attach-vdev-members.dto';
import { LogicalDiskMemberResponseDto } from './dto/response/logical-disk-member-response.dto';
import { LogicalDiskEventResponseDto } from './dto/response/logical-disk-event-response.dto';

@ApiTags('vdev-memberships')
@Controller('logical-vdevs')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
export class VdevMembershipController {
  constructor(private readonly membershipService: VdevMembershipService) {}

  @Get(':id/members')
  @CheckPolicy('show', 'logical-disks')
  @Serialize(LogicalDiskMemberResponseDto)
  @ApiOperation({ summary: 'List current member drives of a vdev' })
  @ApiParam({ name: 'id', description: 'Logical vdev UUIDv7' })
  async members(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string) {
    return this.membershipService.getMembers(id);
  }

  @Get(':id/capacity')
  @CheckPolicy('show', 'logical-vdevs')
  @ApiOperation({ summary: 'Get raw and usable capacity for a vdev' })
  async capacity(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string) {
    return this.membershipService.getCapacity(id);
  }

  @Get(':id/member-history')
  @CheckPolicy('show', 'logical-disks')
  @Serialize(LogicalDiskEventResponseDto)
  @ApiOperation({ summary: 'Get the append-only vdev membership history' })
  async history(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string) {
    return this.membershipService.getHistory(id);
  }

  @Post(':id/members')
  @CheckPolicy('attach', 'logical-disks')
  @Serialize(LogicalDiskMemberResponseDto)
  @ApiOperation({ summary: 'Attach one or more physical drives to a vdev' })
  async attach(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() dto: AttachVdevMembersDto,
    @RequestUser() user?: AuthenticatedUser,
  ) {
    const actorId = user?.dbUser?.id ?? user?.id ?? null;
    await this.membershipService.attach(id, dto, actorId);
    return this.membershipService.getMembers(id);
  }

  @Delete(':id/members/:physicalDriveId')
  @CheckPolicy('detach', 'logical-disks')
  @Serialize(LogicalDiskMemberResponseDto)
  @ApiOperation({ summary: 'Detach a physical drive from a vdev' })
  async detach(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Param('physicalDriveId', new ParseUUIDPipe({ version: '7' }))
    physicalDriveId: string,
    @Query('notes') notes?: string,
    @RequestUser() user?: AuthenticatedUser,
  ) {
    const actorId = user?.dbUser?.id ?? user?.id ?? null;
    return this.membershipService.detach(id, physicalDriveId, actorId, notes);
  }
}
