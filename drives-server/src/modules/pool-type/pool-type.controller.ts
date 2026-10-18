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
import { PoolTypeService } from './pool-type.service';
import { PoolType } from './entities/pool-type.entity';
import { CreatePoolTypeDto } from './dto/create-pool-type.dto';
import { UpdatePoolTypeDto } from './dto/update-pool-type.dto';
import { QueryPoolTypeDto } from './dto/query-pool-type.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { PoolTypeResponseDto } from './dto/response/pool-type-response.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('pool-types')
@Controller('pool-types')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(PoolTypeResponseDto)
export class PoolTypeController {
  constructor(private readonly poolTypeService: PoolTypeService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all Pool Types with pagination' })
  @ApiQuery({ type: QueryPoolTypeDto })
  @ApiResponse({
    status: 200,
    description: 'Pool Types retrieved successfully',
  })
  async findAll(
    @Query() query: QueryPoolTypeDto,
  ): Promise<PaginatedResponse<PoolType>> {
    return await this.poolTypeService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get Pool Type by ID' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Pool Type retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Pool Type not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<PoolType> {
    const poolType = await this.poolTypeService.findOne(id);
    if (!poolType) {
      throw new NotFoundException(`PoolType with ID ${id} not found`);
    }
    return poolType;
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new Pool Type' })
  @ApiResponse({
    status: 201,
    description: 'Pool Type created successfully',
  })
  @ApiResponse({ status: 409, description: 'Pool Type already exists' })
  async create(
    @Body() createPoolTypeDto: CreatePoolTypeDto,
  ): Promise<PoolType> {
    return this.poolTypeService.createPoolType(createPoolTypeDto);
  }

  @Put(':id')
  @Public()
  @ApiOperation({ summary: 'Update a Pool Type' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Pool Type updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Pool Type not found' })
  @ApiResponse({
    status: 409,
    description: 'System-managed Pool Type cannot be updated',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() updatePoolTypeDto: UpdatePoolTypeDto,
  ): Promise<PoolType> {
    const result = await this.poolTypeService.updatePoolType(
      id,
      updatePoolTypeDto,
    );
    if (!result) {
      throw new NotFoundException(`PoolType with ID ${id} not found`);
    }
    return result;
  }

  @Delete(':id')
  @Public()
  @ApiOperation({ summary: 'Delete a Pool Type' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Pool Type deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Pool Type not found' })
  @ApiResponse({
    status: 409,
    description: 'System-managed Pool Type cannot be deleted',
  })
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<{ message: string }> {
    const deleted = await this.poolTypeService.deletePoolType(id);
    if (!deleted) {
      throw new NotFoundException(`PoolType with ID ${id} not found`);
    } else {
      return {
        message: `PoolType with ID ${id} deleted successfully`,
      };
    }
  }
}
