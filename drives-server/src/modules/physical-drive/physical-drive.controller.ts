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
import { PhysicalDriveService } from './physical-drive.service';
import { PhysicalDrive } from './entities/physical-drive.entity';
import { CreatePhysicalDriveDto } from './dto/create-physical-drive.dto';
import { CreateDriveAcquisitionDto } from './dto/create-drive-acquisition.dto';
import { RelocateDriveDto } from './dto/relocate-drive.dto';
import { UpdatePhysicalDriveDto } from './dto/update-physical-drive.dto';
import { QueryPhysicalDriveDto } from './dto/query-physical-drive.dto';
import { CreatePhysicalDriveLocationDto } from './dto/create-physical-drive-location.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { NotFoundException } from '@nestjs/common';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { PhysicalDriveResponseDto } from './dto/response/physical-drive-response.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response';
import { Public } from '../../common/decorators/public.decorator';
import { CheckPolicy } from '../../common/decorators/check-policy.decorator';
import { RequestUser } from '../../common/decorators/request-user.decorator';
import type { AuthenticatedUser } from '../../common/interfaces/authenticated-request.interface';

@ApiTags('physical-drives')
@Controller('physical-drives')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(PhysicalDriveResponseDto)
export class PhysicalDriveController {
  constructor(private readonly physicalDriveService: PhysicalDriveService) {}

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
    return await this.physicalDriveService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get PhysicalDrive by ID' })
  // 2. Updated Swagger documentation metadata type hint
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'PhysicalDrive retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'PhysicalDrive not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<PhysicalDrive> {
    // 3. Set version '7' validation and changed type to string
    const physicalDriveObject = await this.physicalDriveService.findOne(id);
    if (!physicalDriveObject) {
      throw new NotFoundException(`PhysicalDrive with ID ${id} not found`);
    }
    return physicalDriveObject;
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
    return this.physicalDriveService.create(createPhysicalDriveDto);
  }

  @Post('acquisitions')
  @CheckPolicy('create', 'physical-drives')
  @ApiOperation({
    summary:
      'Acquire a new drive: atomically create the physical drive, its initial location event and the ACQUIRE lifecycle event',
  })
  @ApiResponse({
    status: 201,
    description: 'PhysicalDrive acquired successfully',
  })
  @ApiResponse({
    status: 404,
    description:
      'Drive model, retailer, currency, datacenter or user not found',
  })
  @ApiResponse({
    status: 409,
    description: 'A drive with the same serial number already exists',
  })
  async acquire(
    @Body() createDriveAcquisitionDto: CreateDriveAcquisitionDto,
    @RequestUser() user?: AuthenticatedUser,
  ): Promise<PhysicalDrive> {
    const performedByUserId = user?.dbUser?.id ?? user?.id ?? null;
    const triggeredBy = user?.username ?? user?.email ?? null;

    return this.physicalDriveService.acquireDrive(createDriveAcquisitionDto, {
      performedByUserId,
      triggeredBy,
    });
  }

  @Post(':id/relocations')
  @CheckPolicy('locate', 'physical-drives')
  @ApiOperation({
    summary:
      'Relocate an unmounted drive to another datacenter (append-only location event)',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier of the physical drive',
    type: String,
  })
  @ApiResponse({
    status: 201,
    description: 'PhysicalDrive relocated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'PhysicalDrive or Datacenter not found',
  })
  @ApiResponse({
    status: 409,
    description:
      'Drive is mounted in a server or is already located in the target datacenter',
  })
  async relocate(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() relocateDriveDto: RelocateDriveDto,
  ): Promise<PhysicalDrive> {
    return this.physicalDriveService.relocateDrive(id, relocateDriveDto);
  }

  @Post(':id/locations')
  @Public()
  @ApiOperation({
    summary:
      'Record a location event for a physical drive (append-only move history)',
  })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier of the physical drive',
    type: String,
  })
  @ApiResponse({
    status: 201,
    description: 'Location event recorded successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'PhysicalDrive or Datacenter not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Drive is already located in the requested datacenter',
  })
  async recordLocation(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() createLocationDto: CreatePhysicalDriveLocationDto,
  ): Promise<PhysicalDrive> {
    return this.physicalDriveService.recordLocation(id, createLocationDto);
  }

  @Put(':id')
  @Public()
  @ApiOperation({ summary: 'Update a physical-drive' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
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
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string, // 4. Updated validation pipe and parameter typing
    @Body() updatePhysicalDriveDto: UpdatePhysicalDriveDto,
  ): Promise<PhysicalDrive> {
    const result = await this.physicalDriveService.update(
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
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
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
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string, // 5. Updated validation pipe and parameter typing
  ): Promise<{ message: string }> {
    const deleted = await this.physicalDriveService.delete(id);
    if (!deleted) {
      throw new NotFoundException(`PhysicalDrive with ID ${id} not found`);
    } else {
      return {
        message: `PhysicalDrive with ID ${id} deleted successfully`,
      };
    }
  }
}
