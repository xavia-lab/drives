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
import { WarrantyClaimService } from './warranty-claim.service';
import { WarrantyClaim } from './entities/warranty-claim.entity';
import { CreateWarrantyClaimDto } from './dto/create-warranty-claim.dto';
import { UpdateWarrantyClaimDto } from './dto/update-warranty-claim.dto';
import { QueryWarrantyClaimDto } from './dto/query-warranty-claim.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { WarrantyClaimResponseDto } from './dto/response/warranty-claim-response.dto';
import { PaginatedResponse } from '../common/interfaces/paginated-response';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('warranty-claims')
@Controller('warranty-claims')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(WarrantyClaimResponseDto)
export class WarrantyClaimController {
  constructor(private readonly warrantyClaimService: WarrantyClaimService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all Warranty Claims with pagination' })
  @ApiQuery({ type: QueryWarrantyClaimDto })
  @ApiResponse({
    status: 200,
    description: 'Warranty Claims retrieved successfully',
  })
  async findAll(
    @Query() query: QueryWarrantyClaimDto,
  ): Promise<PaginatedResponse<WarrantyClaim>> {
    return await this.warrantyClaimService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get Warranty Claim by ID' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Warranty Claim retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Warranty Claim not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<WarrantyClaim> {
    const claimObject = await this.warrantyClaimService.findOne(id);
    if (!claimObject) {
      throw new NotFoundException(`WarrantyClaim with ID ${id} not found`);
    }
    return claimObject;
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new warranty claim' })
  @ApiResponse({
    status: 201,
    description: 'Warranty Claim created successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Referenced foreign key ID not found',
  })
  async create(
    @Body() createWarrantyClaimDto: CreateWarrantyClaimDto,
  ): Promise<WarrantyClaim> {
    return this.warrantyClaimService.create(createWarrantyClaimDto);
  }

  @Put(':id')
  @Public()
  @ApiOperation({ summary: 'Update a warranty claim' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Warranty Claim updated successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Warranty Claim or updated foreign key not found',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() updateWarrantyClaimDto: UpdateWarrantyClaimDto,
  ): Promise<WarrantyClaim> {
    const result = await this.warrantyClaimService.update(
      id,
      updateWarrantyClaimDto,
    );
    if (!result) {
      throw new NotFoundException(`WarrantyClaim with ID ${id} not found`);
    }
    return result;
  }

  @Delete(':id')
  @Public()
  @ApiOperation({ summary: 'Delete a warranty claim' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Warranty Claim deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Warranty Claim not found' })
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<{ message: string }> {
    const deleted = await this.warrantyClaimService.delete(id);
    if (!deleted) {
      throw new NotFoundException(`WarrantyClaim with ID ${id} not found`);
    } else {
      return {
        message: `WarrantyClaim with ID ${id} deleted successfully`,
      };
    }
  }
}
