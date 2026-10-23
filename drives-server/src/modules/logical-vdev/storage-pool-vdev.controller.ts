import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
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
import { LogicalVdevService } from './logical-vdev.service';
import { CreatePoolVdevDto } from './dto/create-pool-vdev.dto';
import { LogicalVdevResponseDto } from './dto/response/logical-vdev-response.dto';
import { StorageTopologyService } from '../storage-topology/storage-topology.service';
import { VdevMembershipService } from '../logical-disk/vdev-membership.service';
import { SaveVdevLayoutDto } from '../logical-disk/dto/save-vdev-layout.dto';
import { LogicalDiskMemberResponseDto } from '../logical-disk/dto/response/logical-disk-member-response.dto';

@ApiTags('storage-pool-vdevs')
@Controller('storage-pools')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
export class StoragePoolVdevController {
  constructor(
    private readonly logicalVdevService: LogicalVdevService,
    private readonly topology: StorageTopologyService,
    private readonly membershipService: VdevMembershipService,
  ) {}

  @Get(':poolId/vdevs')
  @CheckPolicy('list', 'logical-vdevs')
  @Serialize(LogicalVdevResponseDto)
  @ApiOperation({ summary: 'List vdevs for a storage pool' })
  @ApiParam({ name: 'poolId', description: 'Storage pool UUIDv7' })
  async list(
    @Param('poolId', new ParseUUIDPipe({ version: '7' })) poolId: string,
  ) {
    return this.logicalVdevService.findByPool(poolId);
  }

  @Post(':poolId/vdevs')
  @CheckPolicy('create', 'logical-vdevs')
  @Serialize(LogicalVdevResponseDto)
  @ApiOperation({ summary: 'Create a vdev in a storage pool' })
  async create(
    @Param('poolId', new ParseUUIDPipe({ version: '7' })) poolId: string,
    @Body() dto: CreatePoolVdevDto,
  ) {
    return this.logicalVdevService.create({
      ...dto,
      storagePoolId: poolId,
    });
  }

  @Get(':poolId/vdev-capacity')
  @CheckPolicy('show', 'logical-vdevs')
  @ApiOperation({ summary: 'Get aggregate vdev capacity for a pool' })
  async capacity(
    @Param('poolId', new ParseUUIDPipe({ version: '7' })) poolId: string,
  ) {
    return this.logicalVdevService.getPoolCapacity(poolId);
  }

  @Get(':poolId/available-drives')
  @CheckPolicy('show', 'logical-vdevs')
  @ApiOperation({
    summary: 'List drives accessible to the pool host for vdev allocation',
  })
  async availableDrives(
    @Param('poolId', new ParseUUIDPipe({ version: '7' })) poolId: string,
  ) {
    return this.topology.getAccessibleDrives(poolId);
  }

  @Put(':poolId/vdev-layout')
  @CheckPolicy('save', 'logical-disks')
  @Serialize(LogicalDiskMemberResponseDto)
  @ApiOperation({
    summary: 'Save the complete vdev member layout for a storage pool',
  })
  async saveLayout(
    @Param('poolId', new ParseUUIDPipe({ version: '7' })) poolId: string,
    @Body() dto: SaveVdevLayoutDto,
    @RequestUser() user?: AuthenticatedUser,
  ) {
    const actorId = user?.dbUser?.id ?? user?.id ?? null;
    return this.membershipService.saveLayout(poolId, dto, actorId);
  }
}
