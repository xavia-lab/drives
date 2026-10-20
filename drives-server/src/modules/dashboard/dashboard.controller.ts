import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { Public } from '../../common/decorators/public.decorator';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { DashboardService } from './dashboard.service';
import { DashboardSummaryResponseDto } from './dto/response/dashboard-summary-response.dto';

@ApiTags('dashboard')
@Controller('dashboard')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('summary')
  @Public()
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
