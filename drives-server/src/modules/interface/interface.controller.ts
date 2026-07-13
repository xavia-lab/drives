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
import { InterfaceService } from './interface.service';
import { Interface } from './entities/interface.entity';
import { CreateInterfaceDto } from './dto/create-interface.dto';
import { UpdateInterfaceDto } from './dto/update-interface.dto';
import { QueryInterfaceDto } from './dto/query-interface.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { NotFoundException } from '@nestjs/common';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { InterfaceResponseDto } from './dto/response/interface-response.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('interfaces')
@Controller('interfaces')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(InterfaceResponseDto)
export class InterfaceController {
  constructor(private readonly interfaceService: InterfaceService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all Quantity Units with pagination' })
  @ApiQuery({ type: QueryInterfaceDto })
  @ApiResponse({
    status: 200,
    description: 'Quantity Units retrieved successfully',
  })
  async findAll(
    @Query() query: QueryInterfaceDto,
  ): Promise<PaginatedResponse<Interface>> {
    return await this.interfaceService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get Interface by ID' })
  // 2. Updated Swagger documentation metadata type hint
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Interface retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Interface not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<Interface> {
    // 3. Set version '7' validation and changed type to string
    const interfaceObject = await this.interfaceService.findOne(id);
    if (!interfaceObject) {
      throw new NotFoundException(`Interface with ID ${id} not found`);
    }
    return interfaceObject;
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new interface' })
  @ApiResponse({
    status: 201,
    description: 'Interface created successfully',
  })
  @ApiResponse({ status: 409, description: 'Interface already exists' })
  async create(
    @Body() createInterfaceDto: CreateInterfaceDto,
  ): Promise<Interface> {
    return this.interfaceService.create(createInterfaceDto);
  }

  @Put(':id')
  @Public()
  @ApiOperation({ summary: 'Update a interface' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Interface updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Interface not found' })
  @ApiResponse({
    status: 409,
    description: 'System-managed interface cannot be updated',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string, // 4. Updated validation pipe and parameter typing
    @Body() updateInterfaceDto: UpdateInterfaceDto,
  ): Promise<Interface> {
    const result = await this.interfaceService.update(id, updateInterfaceDto);
    if (!result) {
      throw new NotFoundException(`Interface with ID ${id} not found`);
    }
    return result;
  }

  @Delete(':id')
  @Public()
  @ApiOperation({ summary: 'Delete a interface' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: 'Interface deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Interface not found' })
  @ApiResponse({
    status: 409,
    description: 'System-managed interface cannot be deleted',
  })
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string, // 5. Updated validation pipe and parameter typing
  ): Promise<{ message: string }> {
    const deleted = await this.interfaceService.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Interface with ID ${id} not found`);
    } else {
      return {
        message: `Interface with ID ${id} deleted successfully`,
      };
    }
  }
}
