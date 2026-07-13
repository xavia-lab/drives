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
import { LogicalDiskService } from './logical-disk.service';
import { LogicalDisk } from './entities/logical-disk.entity';
import { CreateLogicalDiskDto } from './dto/create-logical-disk.dto';
import { UpdateLogicalDiskDto } from './dto/update-logical-disk.dto';
import { QueryLogicalDiskDto } from './dto/query-logical-disk.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { LogicalDiskResponseDto } from './dto/response/logical-disk-response.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('logical-disks')
@Controller('logical-disks')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(LogicalDiskResponseDto)
export class LogicalDiskController {
  constructor(private readonly logicalDiskService: LogicalDiskService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all Logical Disks with pagination' })
  @ApiQuery({ type: QueryLogicalDiskDto })
  @ApiResponse({
    status: 200,
    description: 'Logical Disks retrieved successfully',
  })
  async findAll(
    @Query() query: QueryLogicalDiskDto,
  ): Promise<PaginatedResponse<LogicalDisk>> {
    return await this.logicalDiskService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get Logical Disk mapping by ID' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier of the logical disk record',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Logical Disk retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Logical Disk not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<LogicalDisk> {
    const diskObject = await this.logicalDiskService.findOne(id);
    if (!diskObject) {
      throw new NotFoundException(`LogicalDisk with ID ${id} not found`);
    }
    return diskObject;
  }

  @Post()
  @Public()
  @ApiOperation({
    summary: 'Map a physical hardware drive into a logical vdev configuration',
  })
  @ApiResponse({
    status: 201,
    description: 'Logical Disk mapped and logged successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Referenced logicalVdevId or physicalDriveId not found',
  })
  @ApiResponse({
    status: 409,
    description:
      'Physical drive asset is already allocated to an active logical virtual device',
  })
  async create(@Body() createDto: CreateLogicalDiskDto): Promise<LogicalDisk> {
    return this.logicalDiskService.create(createDto);
  }

  @Put(':id')
  @Public()
  @ApiOperation({ summary: 'Update logical disk mapping configurations' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Logical Disk mapping updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Logical Disk or related validation dependencies not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Physical drive asset assignment conflict error',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() updateDto: UpdateLogicalDiskDto,
  ): Promise<LogicalDisk> {
    const result = await this.logicalDiskService.update(id, updateDto);
    if (!result) {
      throw new NotFoundException(`LogicalDisk with ID ${id} not found`);
    }
    return result;
  }

  @Delete(':id')
  @Public()
  @ApiOperation({
    summary: 'Unmap or delete a logical disk from asset registry',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Logical Disk allocation broken successfully',
  })
  @ApiResponse({ status: 404, description: 'Logical Disk not found' })
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<{ message: string }> {
    const deleted = await this.logicalDiskService.delete(id);
    if (!deleted) {
      throw new NotFoundException(`LogicalDisk with ID ${id} not found`);
    } else {
      return {
        message: `LogicalDisk with ID ${id} deleted successfully`,
      };
    }
  }
}
