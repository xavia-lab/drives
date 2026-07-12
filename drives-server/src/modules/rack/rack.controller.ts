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
import { RackService } from './rack.service';
import { Rack } from './entities/rack.entity';
import { CreateRackDto } from './dto/create-rack.dto';
import { UpdateRackDto } from './dto/update-rack.dto';
import { QueryRackDto } from './dto/query-rack.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { RackResponseDto } from './dto/response/rack-response.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('racks')
@Controller('racks')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(RackResponseDto)
export class RackController {
  constructor(private readonly rackService: RackService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all Rack Cabinet Enclosures with pagination' })
  @ApiQuery({ type: QueryRackDto })
  @ApiResponse({ status: 200, description: 'Racks retrieved successfully' })
  async findAll(
    @Query() query: QueryRackDto,
  ): Promise<PaginatedResponse<Rack>> {
    return await this.rackService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get Rack by ID' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Rack retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Rack not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<Rack> {
    const rack = await this.rackService.findOne(id);
    if (!rack) throw new NotFoundException(`Rack with ID ${id} not found`);
    return rack;
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new Rack cabinet frame' })
  @ApiResponse({ status: 201, description: 'Rack created successfully' })
  @ApiResponse({
    status: 404,
    description: 'Referenced datacenterId not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Rack name conflict within target datacenter scope',
  })
  async create(@Body() createDto: CreateRackDto): Promise<Rack> {
    return this.rackService.create(createDto);
  }

  @Put(':id')
  @Public()
  @ApiOperation({ summary: 'Update Rack asset configurations' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Rack updated successfully' })
  @ApiResponse({
    status: 404,
    description: 'Rack or referenced datacenterId not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Rack name conflict inside target facility',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() updateDto: UpdateRackDto,
  ): Promise<Rack> {
    return this.rackService.update(id, updateDto);
  }

  @Delete(':id')
  @Public()
  @ApiOperation({ summary: 'Delete a Rack asset record' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'Rack deleted successfully' })
  @ApiResponse({ status: 404, description: 'Rack not found' })
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<{ message: string }> {
    await this.rackService.delete(id);
    return { message: `Rack with ID ${id} deleted successfully` };
  }
}
