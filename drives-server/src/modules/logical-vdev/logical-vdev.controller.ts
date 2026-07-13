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
import { LogicalVdevService } from './logical-vdev.service';
import { LogicalVdev } from './entities/logical-vdev.entity';
import { CreateLogicalVdevDto } from './dto/create-logical-vdev.dto';
import { UpdateLogicalVdevDto } from './dto/update-logical-vdev.dto';
import { QueryLogicalVdevDto } from './dto/query-logical-vdev.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { LogicalVdevResponseDto } from './dto/response/logical-vdev-response.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('logical-vdevs')
@Controller('logical-vdevs')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(LogicalVdevResponseDto)
export class LogicalVdevController {
  constructor(private readonly logicalVdevService: LogicalVdevService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all Logical Vdevs with pagination' })
  @ApiQuery({ type: QueryLogicalVdevDto })
  @ApiResponse({
    status: 200,
    description: 'Logical Vdevs retrieved successfully',
  })
  async findAll(
    @Query() query: QueryLogicalVdevDto,
  ): Promise<PaginatedResponse<LogicalVdev>> {
    return await this.logicalVdevService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get Logical Vdev by ID' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier of the logical vdev row',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Logical Vdev retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Logical Vdev not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<LogicalVdev> {
    const vdevObject = await this.logicalVdevService.findOne(id);
    if (!vdevObject) {
      throw new NotFoundException(`LogicalVdev with ID ${id} not found`);
    }
    return vdevObject;
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new logical vdev redundancy setup' })
  @ApiResponse({
    status: 201,
    description: 'Logical Vdev initialized and loaded successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Referenced storagePoolId not found',
  })
  @ApiResponse({
    status: 409,
    description:
      'Vdev name collision error within the target storage pool context',
  })
  async create(@Body() createDto: CreateLogicalVdevDto): Promise<LogicalVdev> {
    return this.logicalVdevService.create(createDto);
  }

  @Put(':id')
  @Public()
  @ApiOperation({ summary: 'Update logical vdev array properties' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Logical Vdev updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Logical Vdev or related validation dependencies not found',
  })
  @ApiResponse({
    status: 409,
    description:
      'Vdev name collision error inside the parent storage pool scope',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() updateDto: UpdateLogicalVdevDto,
  ): Promise<LogicalVdev> {
    const result = await this.logicalVdevService.update(id, updateDto);
    if (!result) {
      throw new NotFoundException(`LogicalVdev with ID ${id} not found`);
    }
    return result;
  }

  @Delete(':id')
  @Public()
  @ApiOperation({
    summary: 'Purge a logical vdev from target inventory database indexes',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Logical Vdev layout dropped successfully',
  })
  @ApiResponse({ status: 404, description: 'Logical Vdev not found' })
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<{ message: string }> {
    const deleted = await this.logicalVdevService.delete(id);
    if (!deleted) {
      throw new NotFoundException(`LogicalVdev with ID ${id} not found`);
    } else {
      return {
        message: `LogicalVdev with ID ${id} deleted successfully`,
      };
    }
  }
}
