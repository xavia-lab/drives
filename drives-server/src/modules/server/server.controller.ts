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
import { ServerService } from './server.service';
import { Server } from './entities/server.entity';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { QueryServerDto } from './dto/query-server.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { ServerResponseDto } from './dto/response/server-response.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('servers')
@Controller('servers')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(ServerResponseDto)
export class ServerController {
  constructor(private readonly serverService: ServerService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all Servers with pagination' })
  @ApiQuery({ type: QueryServerDto })
  @ApiResponse({
    status: 200,
    description: 'Servers retrieved successfully',
  })
  async findAll(
    @Query() query: QueryServerDto,
  ): Promise<PaginatedResponse<Server>> {
    return await this.serverService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get Server by ID' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Server retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Server not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<Server> {
    const serverObject = await this.serverService.findOne(id);
    if (!serverObject) {
      throw new NotFoundException(`Server with ID ${id} not found`);
    }
    return serverObject;
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new server node' })
  @ApiResponse({
    status: 201,
    description: 'Server created successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Referenced cpuModelId or datacenterId not found',
  })
  @ApiResponse({ status: 409, description: 'Server hostname already exists' })
  async create(@Body() createServerDto: CreateServerDto): Promise<Server> {
    return this.serverService.create(createServerDto);
  }

  @Put(':id')
  @Public()
  @ApiOperation({ summary: 'Update a server details' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Server updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Server or related relational identifier not found',
  })
  @ApiResponse({ status: 409, description: 'Server hostname conflict error' })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() updateServerDto: UpdateServerDto,
  ): Promise<Server> {
    const result = await this.serverService.update(id, updateServerDto);
    if (!result) {
      throw new NotFoundException(`Server with ID ${id} not found`);
    }
    return result;
  }

  @Delete(':id')
  @Public()
  @ApiOperation({ summary: 'Delete a server' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Server deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Server not found' })
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<{ message: string }> {
    const deleted = await this.serverService.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Server with ID ${id} not found`);
    } else {
      return {
        message: `Server with ID ${id} deleted successfully`,
      };
    }
  }
}
