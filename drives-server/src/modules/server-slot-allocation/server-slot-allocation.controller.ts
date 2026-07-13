import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
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
import { CreateServerSlotAllocationDto } from './dto/create-server-slot-allocation.dto';
import { UpdateServerSlotAllocationDto } from './dto/update-server-slot-allocation.dto';
import { QueryServerSlotAllocationDto } from './dto/query-server-slot-allocation.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { ServerSlotAllocationResponseDto } from './dto/response/server-slot-allocation-response.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response';
import { Public } from '../../common/decorators/public.decorator';

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
  @ApiOperation({ summary: 'Get all Server Slot Allocations with pagination' })
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

  @Post()
  @Public()
  @ApiOperation({
    summary: 'Create a new server slot allocation append-only entry',
  })
  @ApiResponse({
    status: 201,
    description: 'Server Slot Allocation ledger item logged successfully',
  })
  @ApiResponse({
    status: 404,
    description:
      'Referenced serverSlotId, physicalDriveId, or userId not found',
  })
  async create(
    @Body() createDto: CreateServerSlotAllocationDto,
  ): Promise<ServerSlotAllocation> {
    return this.allocationService.create(createDto);
  }

  @Put(':id')
  @Public()
  @ApiOperation({ summary: 'Update server slot allocation ledger properties' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Server Slot Allocation updated successfully',
  })
  @ApiResponse({
    status: 404,
    description:
      'Server Slot Allocation or related missing validation dependencies not found',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() updateDto: UpdateServerSlotAllocationDto,
  ): Promise<ServerSlotAllocation> {
    const result = await this.allocationService.update(id, updateDto);
    if (!result) {
      throw new NotFoundException(
        `ServerSlotAllocation with ID ${id} not found`,
      );
    }
    return result;
  }

  @Delete(':id')
  @Public()
  @ApiOperation({ summary: 'Delete a server slot allocation ledger item' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Server Slot Allocation record deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Server Slot Allocation not found' })
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<{ message: string }> {
    const deleted = await this.allocationService.delete(id);
    if (!deleted) {
      throw new NotFoundException(
        `ServerSlotAllocation with ID ${id} not found`,
      );
    } else {
      return {
        message: `ServerSlotAllocation with ID ${id} deleted successfully`,
      };
    }
  }
}
