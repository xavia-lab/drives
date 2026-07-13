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
  ParseUUIDPipe, // 1. Swapped ParseIntPipe for ParseUUIDPipe
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { BusProtocolService } from './bus-protocol.service';
import { BusProtocol } from './entities/bus-protocol.entity';
import { CreateBusProtocolDto } from './dto/create-bus-protocol.dto';
import { UpdateBusProtocolDto } from './dto/update-bus-protocol.dto';
import { QueryBusProtocolDto } from './dto/query-bus-protocol.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { NotFoundException } from '@nestjs/common';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { BusProtocolResponseDto } from './dto/response/bus-protocol-response.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('bus-protocols')
@Controller('bus-protocols')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(BusProtocolResponseDto)
export class BusProtocolController {
  constructor(private readonly BusProtocolService: BusProtocolService) {}

  @Get()
  @Public()
  // @CheckPolicy('list', 'bus-protocols')
  @ApiOperation({ summary: 'Get all Storage Types with pagination' })
  @ApiQuery({ type: QueryBusProtocolDto })
  @ApiResponse({
    status: 200,
    description: 'Storage Types retrieved successfully',
  })
  async findAll(
    @Query() query: QueryBusProtocolDto,
  ): Promise<PaginatedResponse<BusProtocol>> {
    return await this.BusProtocolService.findAll(query);
  }

  @Get(':id')
  @Public()
  // @CheckPolicy('show', 'bus-protocols')
  @ApiOperation({ summary: 'Get BusProtocol by ID' })
  // 2. Updated Swagger documentation metadata type hint
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'BusProtocol retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'BusProtocol not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<BusProtocol> {
    // 3. Set version '7' validation and changed type to string
    const BusProtocol = await this.BusProtocolService.findOne(id);
    if (!BusProtocol) {
      throw new NotFoundException(`BusProtocol with ID ${id} not found`);
    }
    return BusProtocol;
  }

  @Post()
  @Public()
  // @CheckPolicy('create', 'bus-protocols')
  @ApiOperation({ summary: 'Create a new BusProtocol' })
  @ApiResponse({
    status: 201,
    description: 'BusProtocol created successfully',
  })
  @ApiResponse({ status: 409, description: 'BusProtocol already exists' })
  async create(
    @Body() createBusProtocolDto: CreateBusProtocolDto,
  ): Promise<BusProtocol> {
    return this.BusProtocolService.createBusProtocol(createBusProtocolDto);
  }

  @Put(':id')
  @Public()
  // @CheckPolicy('edit', 'bus-protocols')
  @ApiOperation({ summary: 'Update a BusProtocol' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'BusProtocol updated successfully',
  })
  @ApiResponse({ status: 404, description: 'BusProtocol not found' })
  @ApiResponse({
    status: 409,
    description: 'System-managed BusProtocol cannot be updated',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string, // 4. Updated validation pipe and parameter typing
    @Body() updateBusProtocolDto: UpdateBusProtocolDto,
  ): Promise<BusProtocol> {
    const result = await this.BusProtocolService.updateBusProtocol(
      id,
      updateBusProtocolDto,
    );
    if (!result) {
      throw new NotFoundException(`BusProtocol with ID ${id} not found`);
    }
    return result;
  }

  @Delete(':id')
  @Public()
  // @CheckPolicy('delete', 'bus-protocols')
  @ApiOperation({ summary: 'Delete a BusProtocol' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: 'BusProtocol deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'BusProtocol not found' })
  @ApiResponse({
    status: 409,
    description: 'System-managed BusProtocol cannot be deleted',
  })
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string, // 5. Updated validation pipe and parameter typing
  ): Promise<{ message: string }> {
    const deleted = await this.BusProtocolService.deleteBusProtocol(id);
    if (!deleted) {
      throw new NotFoundException(`BusProtocol with ID ${id} not found`);
    } else {
      return {
        message: `BusProtocol with ID ${id} deleted successfully`,
      };
    }
  }
}
