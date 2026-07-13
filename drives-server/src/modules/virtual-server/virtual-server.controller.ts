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
import { VirtualServerService } from './virtual-server.service';
import { VirtualServer } from './entities/virtual-server.entity';
import { CreateVirtualServerDto } from './dto/create-virtual-server.dto';
import { UpdateVirtualServerDto } from './dto/update-virtual-server.dto';
import { QueryVirtualServerDto } from './dto/query-virtual-server.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { VirtualServerResponseDto } from './dto/response/virtual-server-response.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('virtual-servers')
@Controller('virtual-servers')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(VirtualServerResponseDto)
export class VirtualServerController {
  constructor(private readonly virtualServerService: VirtualServerService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all Virtual Servers with pagination' })
  @ApiQuery({ type: QueryVirtualServerDto })
  @ApiResponse({
    status: 200,
    description: 'Virtual Servers retrieved successfully',
  })
  async findAll(
    @Query() query: QueryVirtualServerDto,
  ): Promise<PaginatedResponse<VirtualServer>> {
    return await this.virtualServerService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get Virtual Server by ID' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier of the virtual server instance',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Virtual Server retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Virtual Server not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<VirtualServer> {
    const virtualServerObject = await this.virtualServerService.findOne(id);
    if (!virtualServerObject) {
      throw new NotFoundException(`VirtualServer with ID ${id} not found`);
    }
    return virtualServerObject;
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new virtual server cluster instance' })
  @ApiResponse({
    status: 201,
    description: 'Virtual Server provisioned and logged successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Referenced hostServerId or operatingSystemId not found',
  })
  @ApiResponse({
    status: 409,
    description:
      'Hostname already exists or VMID cluster allocation collision error',
  })
  async create(
    @Body() createDto: CreateVirtualServerDto,
  ): Promise<VirtualServer> {
    return this.virtualServerService.create(createDto);
  }

  @Put(':id')
  @Public()
  @ApiOperation({
    summary: 'Update virtual server cluster resource parameters',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Virtual Server updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Virtual Server or missing validation dependencies not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Hostname conflict or partial VMID clustering collision error',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() updateDto: UpdateVirtualServerDto,
  ): Promise<VirtualServer> {
    const result = await this.virtualServerService.update(id, updateDto);
    if (!result) {
      throw new NotFoundException(`VirtualServer with ID ${id} not found`);
    }
    return result;
  }

  @Delete(':id')
  @Public()
  @ApiOperation({ summary: 'Delete a virtual server from inventory tracking' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Virtual Server record purged successfully',
  })
  @ApiResponse({ status: 404, description: 'Virtual Server not found' })
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<{ message: string }> {
    const deleted = await this.virtualServerService.delete(id);
    if (!deleted) {
      throw new NotFoundException(`VirtualServer with ID ${id} not found`);
    } else {
      return {
        message: `VirtualServer with ID ${id} deleted successfully`,
      };
    }
  }
}
