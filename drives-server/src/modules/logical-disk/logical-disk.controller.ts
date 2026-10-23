import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LogicalDiskService } from './logical-disk.service';
import { QueryLogicalDiskDto } from './dto/query-logical-disk.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { CheckPolicy } from '../../common/decorators/check-policy.decorator';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { LogicalDiskResponseDto } from './dto/response/logical-disk-response.dto';

@ApiTags('logical-disks')
@Controller('logical-disks')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(LogicalDiskResponseDto)
export class LogicalDiskController {
  constructor(private readonly logicalDiskService: LogicalDiskService) {}

  @Get()
  @CheckPolicy('list', 'logical-disks')
  @ApiOperation({ summary: 'Get current vdev memberships' })
  @ApiQuery({ type: QueryLogicalDiskDto })
  async findAll(@Query() query: QueryLogicalDiskDto) {
    return this.logicalDiskService.findAll(query);
  }

  @Get(':id')
  @CheckPolicy('show', 'logical-disks')
  @ApiOperation({ summary: 'Get a vdev membership by ID' })
  @ApiParam({ name: 'id', description: 'Logical disk UUIDv7' })
  @ApiResponse({ status: 200, description: 'Membership retrieved' })
  @ApiResponse({ status: 404, description: 'Membership not found' })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string) {
    return this.logicalDiskService.ensureExists(id);
  }
}
