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
import { ServerSlotService } from './server-slot.service';
import { ServerSlot } from './entities/server-slot.entity';
import { CreateServerSlotDto } from './dto/create-server-slot.dto';
import { UpdateServerSlotDto } from './dto/update-server-slot.dto';
import { QueryServerSlotDto } from './dto/query-server-slot.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { ServerSlotResponseDto } from './dto/response/server-slot-response.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('server-slots')
@Controller('server-slots')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(ServerSlotResponseDto)
export class ServerSlotController {
  constructor(private readonly serverSlotService: ServerSlotService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all Server Slots with pagination' })
  @ApiQuery({ type: QueryServerSlotDto })
  @ApiResponse({
    status: 200,
    description: 'Server Slots retrieved successfully',
  })
  async findAll(
    @Query() query: QueryServerSlotDto,
  ): Promise<PaginatedResponse<ServerSlot>> {
    return await this.serverSlotService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get Server Slot by ID' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier of the slot',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Server Slot retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Server Slot not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<ServerSlot> {
    const slotObject = await this.serverSlotService.findOne(id);
    if (!slotObject) {
      throw new NotFoundException(`ServerSlot with ID ${id} not found`);
    }
    return slotObject;
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new server slot mapping' })
  @ApiResponse({
    status: 201,
    description: 'Server Slot created successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Referenced serverId or supportedInterfaceId not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Server Slot label already exists on this server chassis',
  })
  async create(
    @Body() createServerSlotDto: CreateServerSlotDto,
  ): Promise<ServerSlot> {
    return this.serverSlotService.create(createServerSlotDto);
  }

  @Put(':id')
  @Public()
  @ApiOperation({ summary: 'Update server slot details' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Server Slot updated successfully',
  })
  @ApiResponse({
    status: 404,
    description:
      'Server Slot or related relational entity identifier not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Chassis slot label collision error on target node',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() updateServerSlotDto: UpdateServerSlotDto,
  ): Promise<ServerSlot> {
    const result = await this.serverSlotService.update(id, updateServerSlotDto);
    if (!result) {
      throw new NotFoundException(`ServerSlot with ID ${id} not found`);
    }
    return result;
  }

  @Delete(':id')
  @Public()
  @ApiOperation({ summary: 'Delete a server slot mapping' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Server Slot deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Server Slot not found' })
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<{ message: string }> {
    const deleted = await this.serverSlotService.delete(id);
    if (!deleted) {
      throw new NotFoundException(`ServerSlot with ID ${id} not found`);
    } else {
      return {
        message: `ServerSlot with ID ${id} deleted successfully`,
      };
    }
  }
}
