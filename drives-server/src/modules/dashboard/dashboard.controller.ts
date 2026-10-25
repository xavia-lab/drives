import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { DashboardService } from './dashboard.service';
import { StorageTopologyVisualizationService } from './storage-topology-visualization.service';
import { DashboardSummaryResponseDto } from './dto/response/dashboard-summary-response.dto';
import { QueryStorageTopologyDto } from './dto/query-storage-topology.dto';
import { StorageTopologyResponseDto } from './dto/response/storage-topology-response.dto';
import { Cacheable } from '../cache/cache.decorators';
import { CACHE_TAGS } from '../cache/cache.tags';

import { CheckPolicy } from '../../common/decorators/check-policy.decorator';
@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly topologyService: StorageTopologyVisualizationService,
  ) {}

  @Get('storage-topology')
  @CheckPolicy('show', 'dashboard')
  @Cacheable({ tags: [CACHE_TAGS.DASHBOARD], ttlMs: 30_000 })
  @Serialize(StorageTopologyResponseDto)
  @ApiOperation({
    summary:
      'Get the selected host backplane with drive, vdev and storage-pool mappings',
  })
  @ApiQuery({ type: QueryStorageTopologyDto })
  async getStorageTopology(@Query() query: QueryStorageTopologyDto) {
    return this.topologyService.getTopology(query);
  }

  @Get('summary')
  @CheckPolicy('show', 'dashboard')
  @Cacheable({ tags: [CACHE_TAGS.DASHBOARD], ttlMs: 30_000 })
  @Serialize(DashboardSummaryResponseDto)
  @ApiOperation({
    summary:
      'Get the aggregated inventory, warranty, capacity, finance and activity dashboard snapshot',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard summary retrieved successfully',
  })
  async getSummary(): Promise<DashboardSummaryResponseDto> {
    return this.dashboardService.getSummary();
  }
}
