import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ServerSlotAllocationService } from './server-slot-allocation.service';
import { ServerSlotAllocation } from './entities/server-slot-allocation.entity';
import { QueryServerSlotAllocationDto } from './dto/query-server-slot-allocation.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { ServerSlotAllocationResponseDto } from './dto/response/server-slot-allocation-response.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response';
import { Public } from '../../common/decorators/public.decorator';

// Read-only projection of the append-only drive <-> slot allocation ledger.
// Writes are performed exclusively through the slot-assignment board endpoints
// (`POST /physical-servers/:id/slots/:slotId/mount|unmount`), which enforce the
// occupancy and datacenter invariants.
@ApiTags('server-slot-allocations')
@Controller('server-slot-allocations')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(ServerSlotAllocationResponseDto)
export class ServerSlotAllocationController {
  constructor(
    private readonly allocationService: ServerSlotAllocationService,
  ) {}

  @Get()
  @Public()
  @ApiOperation({
    summary: 'Get all Server Slot Allocations with pagination',
  })
  @ApiQuery({ type: QueryServerSlotAllocationDto })
  @ApiResponse({
    status: 200,
    description: 'Server Slot Allocations retrieved successfully',
  })
  async findAll(
    @Query() query: QueryServerSlotAllocationDto,
  ): Promise<PaginatedResponse<ServerSlotAllocation>> {
    return await this.allocationService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get Server Slot Allocation ledger record by ID' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier of the allocation ledger row',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Server Slot Allocation retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Server Slot Allocation not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<ServerSlotAllocation> {
    const allocationObject = await this.allocationService.findOne(id);
    if (!allocationObject) {
      throw new NotFoundException(
        `ServerSlotAllocation with ID ${id} not found`,
      );
    }
    return allocationObject;
  }
}
