import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { SERVER_VERSION } from '../../common/utils/version.util';
import { Public } from '../../common/decorators/public.decorator';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DatabaseService } from '../../database/database.service';
import { ConfigService } from '@nestjs/config';

@Controller({
  path: 'system',
  version: VERSION_NEUTRAL, // Ensures it's not /v1/status
})
export class SystemController {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Get('/version')
  @ApiOperation({ summary: 'Provides current system version' })
  @ApiResponse({ status: 200, description: 'System version' })
  getVersion() {
    return {
      version: SERVER_VERSION,
    };
  }

  @Public()
  @Get('/status')
  @ApiOperation({ summary: 'System Health check endpoint' })
  @ApiResponse({ status: 200, description: 'System is healthy' })
  async checkStatus() {
    const dbHealth = await this.databaseService.healthCheck();

    return {
      status: dbHealth ? 'ok' : 'unhealthy',
      timestamp: new Date().toISOString(),
      // Fixed: Pass explicit generic string argument to clean up any cascade
      environment: this.configService.get<string>('app.nodeEnv', 'development'),
      database: dbHealth ? 'connected' : 'disconnected',
      service: 'Drives API Server',
    };
  }
}
