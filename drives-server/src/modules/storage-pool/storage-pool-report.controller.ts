import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { CheckPolicy } from '../../common/decorators/check-policy.decorator';
import { StoragePoolService } from './storage-pool.service';
import { LogicalVdevService } from '../logical-vdev/logical-vdev.service';

@ApiTags('storage-pools')
@Controller('storage-pools')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
export class StoragePoolReportController {
  constructor(
    private readonly storagePoolService: StoragePoolService,
    private readonly logicalVdevService: LogicalVdevService,
  ) {}

  @Get('capacity-report')
  @CheckPolicy('list', 'storage-pools')
  @ApiOperation({
    summary: 'Get storage pool vdev capacity totals for reporting',
  })
  async capacityReport() {
    const result = await this.storagePoolService.findAll({
      pageNumber: 1,
      pageSize: 250,
    });

    const pools = await Promise.all(
      result.data.map(async (pool) => ({
        id: pool.id,
        poolName: pool.poolName,
        currentHost: pool.get('currentHost') ?? null,
        ...(await this.logicalVdevService.getPoolCapacity(pool.id)),
      })),
    );

    const known = pools.filter((pool) => pool.capacityKnown);
    const healthCounts = pools.reduce<Record<string, number>>((acc, pool) => {
      for (const [health, count] of Object.entries(pool.healthCounts)) {
        acc[health] = (acc[health] ?? 0) + count;
      }
      return acc;
    }, {});
    const attentionPoolCount = pools.filter((pool) =>
      ['INCOMPLETE', 'DEGRADED', 'FAILED', 'UNKNOWN'].includes(pool.health),
    ).length;

    return {
      pools,
      totals: {
        poolCount: pools.length,
        vdevCount: pools.reduce((sum, pool) => sum + pool.vdevCount, 0),
        dataVdevCount: pools.reduce((sum, pool) => sum + pool.dataVdevCount, 0),
        rawBytes: known.reduce((sum, pool) => sum + (pool.rawBytes ?? 0), 0),
        usableBytes: known.reduce(
          (sum, pool) => sum + (pool.usableBytes ?? 0),
          0,
        ),
        capacityKnown: known.length === pools.length,
        estimated: pools.some((pool) => pool.estimated),
        spareVdevCount: pools.reduce(
          (sum, pool) => sum + pool.spareVdevCount,
          0,
        ),
        spareMemberCount: pools.reduce(
          (sum, pool) => sum + pool.spareMemberCount,
          0,
        ),
        attentionPoolCount,
        healthCounts,
      },
    };
  }
}
