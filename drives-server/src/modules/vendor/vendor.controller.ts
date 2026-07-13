import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  ParseUUIDPipe, // 1. Swapped ParseIntPipe for ParseUUIDPipe
  Post,
  Put,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { QueryVendorDto } from './dto/query-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { Vendor } from './entities/vendor.entity';
import { VendorService } from './vendor.service';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { VendorResponseDto } from './dto/response/vendor-response.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response';
import { CheckPolicy } from '../../common/decorators/check-policy.decorator';

@ApiTags('vendors')
@Controller('vendors')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(VendorResponseDto)
export class VendorController {
  constructor(private readonly vendorService: VendorService) {}

  @Get()
  @Public()
  // @CheckPolicy('list', 'vendors')
  @ApiOperation({ summary: 'Get all vendors with pagination' })
  @ApiQuery({ type: QueryVendorDto })
  @ApiResponse({
    status: 200,
    description: 'Vendors retrieved successfully',
  })
  async findAll(
    @Query(ValidationPipe) query: PaginationQueryDto,
  ): Promise<PaginatedResponse<Vendor>> {
    return await this.vendorService.findAll(query);
  }

  @Get(':id')
  @Public()
  // @CheckPolicy('show', 'vendors')
  @ApiOperation({ summary: 'Get Vendor by ID' })
  // 2. Updated Swagger documentation metadata type hint
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Vendor retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<Vendor> {
    // 3. Set version '7' validation and changed type to string
    const vendor = await this.vendorService.findOne(id);
    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }
    return vendor;
  }

  @Post()
  @Public()
  // @CheckPolicy('create', 'vendors')
  @ApiOperation({ summary: 'Create a new vendor' })
  @ApiResponse({
    status: 201,
    description: 'Vendor created successfully',
  })
  @ApiResponse({ status: 409, description: 'Vendor already exists' })
  async create(@Body() createVendorDto: CreateVendorDto) {
    return this.vendorService.create(createVendorDto);
  }

  @Put(':id')
  @Public()
  // @CheckPolicy('edit', 'vendors')
  @ApiOperation({ summary: 'Update a vendor' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Vendor updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  @ApiResponse({
    status: 409,
    description: 'System-managed vendor cannot be updated',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string, // 4. Updated validation pipe and parameter typing
    @Body() updateVendorDto: UpdateVendorDto,
  ): Promise<Vendor> {
    const result = await this.vendorService.update(id, updateVendorDto);
    if (!result) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }
    return result;
  }

  @Delete(':id')
  @Public()
  // @CheckPolicy('delete', 'vendors')
  @ApiOperation({ summary: 'Delete a vendor' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: 'Vendor deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Vendor not found' })
  @ApiResponse({
    status: 409,
    description: 'System-managed vendor cannot be deleted',
  })
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string, // 5. Updated validation pipe and parameter typing
  ): Promise<{ message: string }> {
    const deleted = await this.vendorService.delete(id);
    if (!deleted) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    } else {
      return {
        message: `Vendor with ID ${id} deleted successfully`,
      };
    }
  }
}
