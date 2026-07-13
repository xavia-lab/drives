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
import { OperatingSystemService } from './operating-system.service';
import { OperatingSystem } from './entities/operating-system.entity';
import { CreateOperatingSystemDto } from './dto/create-operating-system.dto';
import { UpdateOperatingSystemDto } from './dto/update-operating-system.dto';
import { QueryOperatingSystemDto } from './dto/query-operating-system.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { OperatingSystemResponseDto } from './dto/response/operating-system-response.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('operating-systems')
@Controller('operating-systems')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(OperatingSystemResponseDto)
export class OperatingSystemController {
  constructor(private readonly osService: OperatingSystemService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all Operating Systems with pagination' })
  @ApiQuery({ type: QueryOperatingSystemDto })
  @ApiResponse({
    status: 200,
    description: 'Operating Systems retrieved successfully',
  })
  async findAll(
    @Query() query: QueryOperatingSystemDto,
  ): Promise<PaginatedResponse<OperatingSystem>> {
    return await this.osService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get Operating System by ID' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Operating System retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Operating System not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<OperatingSystem> {
    const os = await this.osService.findOne(id);
    if (!os)
      throw new NotFoundException(`OperatingSystem with ID ${id} not found`);
    return os;
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new Operating System lookup mapping' })
  @ApiResponse({
    status: 201,
    description: 'Operating System created successfully',
  })
  @ApiResponse({
    status: 409,
    description: 'Operating System name already exists',
  })
  async create(
    @Body() createDto: CreateOperatingSystemDto,
  ): Promise<OperatingSystem> {
    return this.osService.create(createDto);
  }

  @Put(':id')
  @Public()
  @ApiOperation({ summary: 'Update an Operating System definition' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Operating System updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Operating System not found' })
  @ApiResponse({ status: 409, description: 'Operating System name conflict' })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() updateDto: UpdateOperatingSystemDto,
  ): Promise<OperatingSystem> {
    return this.osService.update(id, updateDto);
  }

  @Delete(':id')
  @Public()
  @ApiOperation({ summary: 'Delete an Operating System mapping' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Operating System deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Operating System not found' })
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<{ message: string }> {
    await this.osService.delete(id);
    return { message: `OperatingSystem with ID ${id} deleted successfully` };
  }
}
