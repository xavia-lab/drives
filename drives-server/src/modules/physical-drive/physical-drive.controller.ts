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
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { PhysicalDriveService } from './physical-drive.service';
import { PhysicalDrive } from './entities/physical-drive.entity';
import { CreatePhysicalDriveDto } from './dto/create-physical-drive.dto';
import { UpdatePhysicalDriveDto } from './dto/update-physical-drive.dto';
import { QueryPhysicalDriveDto } from './dto/query-physical-drive.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { NotFoundException } from '@nestjs/common';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { PhysicalDriveResponseDto } from './dto/response/physical-drive-response.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('physical-drives')
@Controller('physical-drives')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(PhysicalDriveResponseDto)
export class PhysicalDriveController {
  constructor(private readonly storageModelService: PhysicalDriveService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all Quantity Units with pagination' })
  @ApiQuery({ type: QueryPhysicalDriveDto })
  @ApiResponse({
    status: 200,
    description: 'Quantity Units retrieved successfully',
  })
  async findAll(
    @Query() query: QueryPhysicalDriveDto,
  ): Promise<PaginatedResponse<PhysicalDrive>> {
    return await this.storageModelService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get PhysicalDrive by ID' })
  @ApiParam({ name: 'id', description: 'The unique identifier' })
  @ApiResponse({
    status: 200,
    description: 'PhysicalDrive retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'PhysicalDrive not found' })
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<PhysicalDrive> {
    const storageModelObject = await this.storageModelService.findOne(id);
    if (!storageModelObject) {
      throw new NotFoundException(`PhysicalDrive with ID ${id} not found`);
    }
    return storageModelObject;
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new physical-drive' })
  @ApiResponse({
    status: 201,
    description: 'PhysicalDrive created successfully',
  })
  @ApiResponse({ status: 409, description: 'PhysicalDrive already exists' })
  async create(
    @Body() createPhysicalDriveDto: CreatePhysicalDriveDto,
  ): Promise<PhysicalDrive> {
    return this.storageModelService.createPhysicalDrive(createPhysicalDriveDto);
  }

  @Put(':id')
  @Public()
  @ApiOperation({ summary: 'Update a physical-drive' })
  @ApiParam({ name: 'id', description: 'The unique identifier' })
  @ApiResponse({
    status: 200,
    description: 'PhysicalDrive updated successfully',
  })
  @ApiResponse({ status: 404, description: 'PhysicalDrive not found' })
  @ApiResponse({
    status: 409,
    description: 'System-managed physical-drive cannot be updated',
  })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePhysicalDriveDto: UpdatePhysicalDriveDto,
  ): Promise<PhysicalDrive> {
    const result = await this.storageModelService.updatePhysicalDrive(
      id,
      updatePhysicalDriveDto,
    );
    if (!result) {
      throw new NotFoundException(`PhysicalDrive with ID ${id} not found`);
    }
    return result;
  }

  @Delete(':id')
  @Public()
  @ApiOperation({ summary: 'Delete a physical-drive' })
  @ApiParam({ name: 'id', description: 'The unique identifier' })
  @ApiResponse({
    status: 204,
    description: 'PhysicalDrive deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'PhysicalDrive not found' })
  @ApiResponse({
    status: 409,
    description: 'System-managed physical-drive cannot be deleted',
  })
  async delete(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    const deleted = await this.storageModelService.deletePhysicalDrive(id);
    if (!deleted) {
      throw new NotFoundException(`PhysicalDrive with ID ${id} not found`);
    } else {
      return {
        message: `PhysicalDrive with ID ${id} deleted successfully`,
      };
    }
  }
}
