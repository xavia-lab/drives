import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuditLogService } from './audit-log.service';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';
import { QueryAuditLogDto } from './dto/query-audit-log.dto';
import { AuditLogResponseDto } from './dto/response/audit-log-response.dto';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Audit System Infrastructure Logs')
@Controller('audit-logs')
@UseInterceptors(ClassSerializerInterceptor) // Evaluates class-transformer @Expose properties
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  @Public()
  @Post()
  @ApiOperation({
    summary:
      'Append a new change log state record into the compliance history grid',
  })
  @ApiResponse({
    status: 201,
    type: AuditLogResponseDto,
    description: 'Log safely recorded',
  })
  async create(
    @Body() createAuditLogDto: CreateAuditLogDto,
  ): Promise<AuditLogResponseDto> {
    return this.auditLogService.create(createAuditLogDto);
  }

  @Public()
  @Get()
  @ApiOperation({
    summary:
      'Paginated lookups optimized for Refine data table lists and resource audit trails',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns matching logs grid alongside overall count',
  })
  async findAll(@Query() queryDto: QueryAuditLogDto) {
    // Custom response wrapper explicitly tailored for standard Refine.dev data providers
    const { data, total } = await this.auditLogService.findAll(queryDto);
    return {
      data,
      total,
    };
  }
}
