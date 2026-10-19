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
import { PhysicalServerService } from '../services/physical-server.service';
import { PhysicalServer } from '../entities/physical-server.entity';
import { CreatePhysicalServerDto } from '../dto/create-physical-server.dto';
import { UpdatePhysicalServerDto } from '../dto/update-physical-server.dto';
import { QueryPhysicalServerDto } from '../dto/query-physical-server.dto';
import { KeycloakAuthGuard } from '../../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../../common/guards/cerbos.guard';
import { Serialize } from '../../../common/interceptors/serialize.interceptor';
import { PhysicalServerResponseDto } from '../dto/response/physical-server-response.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response';
import { Public } from '../../../common/decorators/public.decorator';

@ApiTags('physical-servers')
@Controller('physical-servers')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(PhysicalServerResponseDto)
export class PhysicalServerController {
  constructor(private readonly physicalServerService: PhysicalServerService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all Physical Servers with pagination' })
  @ApiQuery({ type: QueryPhysicalServerDto })
  @ApiResponse({
    status: 200,
    description: 'Physical Servers retrieved successfully',
  })
  async findAll(
    @Query() query: QueryPhysicalServerDto,
  ): Promise<PaginatedResponse<PhysicalServer>> {
    return await this.physicalServerService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get Physical Server by ID' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Physical Server retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Physical Server not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<PhysicalServer> {
    const physicalServer = await this.physicalServerService.findOne(id);
    if (!physicalServer) {
      throw new NotFoundException(`PhysicalServer with ID ${id} not found`);
    }
    return physicalServer;
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new Physical Server node' })
  @ApiResponse({
    status: 201,
    description: 'Physical Server created successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Referenced operatingSystemId, rackId or cpuIds not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Physical Server hostname already exists',
  })
  async create(
    @Body() createDto: CreatePhysicalServerDto,
  ): Promise<PhysicalServer> {
    return this.physicalServerService.create(createDto);
  }

  @Put(':id')
  @Public()
  @ApiOperation({ summary: 'Update Physical Server details' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Physical Server updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Physical Server or related relational identifier not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Physical Server hostname conflict error',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() updateDto: UpdatePhysicalServerDto,
  ): Promise<PhysicalServer> {
    const result = await this.physicalServerService.update(id, updateDto);
    if (!result) {
      throw new NotFoundException(`PhysicalServer with ID ${id} not found`);
    }
    return result;
  }

  @Delete(':id')
  @Public()
  @ApiOperation({ summary: 'Delete a Physical Server' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Physical Server deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Physical Server not found' })
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<{ message: string }> {
    const deleted = await this.physicalServerService.delete(id);
    if (!deleted) {
      throw new NotFoundException(`PhysicalServer with ID ${id} not found`);
    } else {
      return {
        message: `PhysicalServer with ID ${id} deleted successfully`,
      };
    }
  }
}
