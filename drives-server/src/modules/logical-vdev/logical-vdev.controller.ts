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
import { PaginatedResponse } from '../pagination/interfaces/paginated-response';

import { CheckPolicy } from '../../common/decorators/check-policy.decorator';
import { RequestUser } from '../../common/decorators/request-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';
import { LogicalVdevEventResponseDto } from './dto/response/logical-vdev-event-response.dto';
@ApiTags('logical-vdevs')
@Controller('logical-vdevs')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
export class LogicalVdevController {
  constructor(private readonly logicalVdevService: LogicalVdevService) {}

  @Get()
  @CheckPolicy('list', 'logical-vdevs')
  @Serialize(LogicalVdevResponseDto)
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
  @CheckPolicy('show', 'logical-vdevs')
  @Serialize(LogicalVdevResponseDto)
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

  @Get(':id/config-history')
  @CheckPolicy('show', 'logical-vdevs')
  @Serialize(LogicalVdevEventResponseDto)
  @ApiOperation({ summary: 'Get vdev configuration history' })
  async configHistory(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ) {
    return this.logicalVdevService.getConfigHistory(id);
  }

  @Post()
  @CheckPolicy('create', 'logical-vdevs')
  @Serialize(LogicalVdevResponseDto)
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
  async create(
    @Body() createDto: CreateLogicalVdevDto,
    @RequestUser() user?: AuthenticatedUser,
  ): Promise<LogicalVdev> {
    return this.logicalVdevService.create(
      createDto,
      user?.dbUser?.id ?? user?.id ?? null,
    );
  }

  @Put(':id')
  @CheckPolicy('edit', 'logical-vdevs')
  @Serialize(LogicalVdevResponseDto)
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
    @RequestUser() user?: AuthenticatedUser,
  ): Promise<LogicalVdev> {
    const result = await this.logicalVdevService.update(
      id,
      updateDto,
      user?.dbUser?.id ?? user?.id ?? null,
    );
    if (!result) {
      throw new NotFoundException(`LogicalVdev with ID ${id} not found`);
    }
    return result;
  }

  @Delete(':id')
  @CheckPolicy('delete', 'logical-vdevs')
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
    @RequestUser() user?: AuthenticatedUser,
  ): Promise<{ message: string }> {
    const deleted = await this.logicalVdevService.delete(
      id,
      user?.dbUser?.id ?? user?.id ?? null,
    );
    if (!deleted) {
      throw new NotFoundException(`LogicalVdev with ID ${id} not found`);
    } else {
      return {
        message: `LogicalVdev with ID ${id} deleted successfully`,
      };
    }
  }
}
