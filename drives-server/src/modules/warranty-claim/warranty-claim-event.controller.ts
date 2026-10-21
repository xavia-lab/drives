import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { WarrantyClaimEventService } from './warranty-claim-event.service';
import { WarrantyClaimEvent } from './entities/warranty-claim-event.entity';
import { QueryWarrantyClaimEventDto } from './dto/query-warranty-claim-event.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { WarrantyClaimEventResponseDto } from './dto/response/warranty-claim-event-response.dto';
import { PaginatedResponse } from '../pagination/interfaces/paginated-response';

// Append-only ledger: events are created through the nested
// `POST /warranty-claims/:id/tracking` endpoint, never updated or deleted here.
import { CheckPolicy } from '../../common/decorators/check-policy.decorator';
@ApiTags('warranty-claim-events')
@Controller('warranty-claim-events')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(WarrantyClaimEventResponseDto)
export class WarrantyClaimEventController {
  constructor(
    private readonly warrantyClaimEventService: WarrantyClaimEventService,
  ) {}

  @Get()
  @CheckPolicy('list', 'warranty-claim-events')
  @ApiOperation({ summary: 'Get all warranty claim events with pagination' })
  @ApiQuery({ type: QueryWarrantyClaimEventDto })
  @ApiResponse({
    status: 200,
    description: 'Warranty claim events retrieved successfully',
  })
  async findAll(
    @Query() query: QueryWarrantyClaimEventDto,
  ): Promise<PaginatedResponse<WarrantyClaimEvent>> {
    return this.warrantyClaimEventService.findAll(query);
  }

  @Get(':id')
  @CheckPolicy('show', 'warranty-claim-events')
  @ApiOperation({ summary: 'Get a warranty claim event by ID' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Warranty claim event retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Warranty claim event not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<WarrantyClaimEvent> {
    return this.warrantyClaimEventService.findOne(id);
  }
}
