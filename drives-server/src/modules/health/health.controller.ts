import { Controller, Get, Injectable } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../../database/database.service';
import { Public } from '../../common/decorators/public.decorator';
import { SERVER_VERSION } from '../../common/utils/version.util';

@ApiTags('Health')
@Controller('health')
@Injectable()
export class HealthController {
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
  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async checkHealth() {
    const dbHealth = await this.databaseService.healthCheck();

    return {
      status: dbHealth ? 'ok' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: this.configService.get('app.nodeEnv'),
      database: dbHealth ? 'connected' : 'disconnected',
      service: 'Emerald API Server',
    };
  }

  @Get('/db')
  @ApiOperation({ summary: 'Database health check' })
  async checkDatabase() {
    const isHealthy = await this.databaseService.healthCheck();

    return {
      database: isHealthy ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };
  }
}
