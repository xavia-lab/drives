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
import { FormFactorService } from './form-factor.service';
import { FormFactor } from './entities/form-factor.entity';
import { CreateFormFactorDto } from './dto/create-form-factor.dto';
import { UpdateFormFactorDto } from './dto/update-form-factor.dto';
import { QueryFormFactorDto } from './dto/query-form-factor.dto';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { NotFoundException } from '@nestjs/common';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { FormFactorResponseDto } from './dto/response/form-factor-response.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('form-factors')
@Controller('form-factors')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(FormFactorResponseDto)
export class FormFactorController {
  constructor(private readonly FormFactorService: FormFactorService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all Storage Types with pagination' })
  @ApiQuery({ type: QueryFormFactorDto })
  @ApiResponse({
    status: 200,
    description: 'Storage Types retrieved successfully',
  })
  async findAll(
    @Query() query: QueryFormFactorDto,
  ): Promise<PaginatedResponse<FormFactor>> {
    return await this.FormFactorService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get FormFactor by ID' })
  // 2. Updated Swagger documentation metadata type hint
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'FormFactor retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'FormFactor not found' })
  async findOne(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<FormFactor> {
    // 3. Set version '7' validation and changed type to string
    const FormFactor = await this.FormFactorService.findOne(id);
    if (!FormFactor) {
      throw new NotFoundException(`FormFactor with ID ${id} not found`);
    }
    return FormFactor;
  }

  @Post()
  @Public()
  @ApiOperation({ summary: 'Create a new FormFactor' })
  @ApiResponse({
    status: 201,
    description: 'FormFactor created successfully',
  })
  @ApiResponse({ status: 409, description: 'FormFactor already exists' })
  async create(
    @Body() createFormFactorDto: CreateFormFactorDto,
  ): Promise<FormFactor> {
    return this.FormFactorService.createFormFactor(createFormFactorDto);
  }

  @Put(':id')
  @Public()
  @ApiOperation({ summary: 'Update a FormFactor' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'FormFactor updated successfully',
  })
  @ApiResponse({ status: 404, description: 'FormFactor not found' })
  @ApiResponse({
    status: 409,
    description: 'System-managed FormFactor cannot be updated',
  })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string, // 4. Updated validation pipe and parameter typing
    @Body() updateFormFactorDto: UpdateFormFactorDto,
  ): Promise<FormFactor> {
    const result = await this.FormFactorService.updateFormFactor(
      id,
      updateFormFactorDto,
    );
    if (!result) {
      throw new NotFoundException(`FormFactor with ID ${id} not found`);
    }
    return result;
  }

  @Delete(':id')
  @Public()
  @ApiOperation({ summary: 'Delete a FormFactor' })
  @ApiParam({
    name: 'id',
    description: 'The unique UUIDv7 identifier',
    type: String,
  })
  @ApiResponse({
    status: 204,
    description: 'FormFactor deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'FormFactor not found' })
  @ApiResponse({
    status: 409,
    description: 'System-managed FormFactor cannot be deleted',
  })
  async delete(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string, // 5. Updated validation pipe and parameter typing
  ): Promise<{ message: string }> {
    const deleted = await this.FormFactorService.deleteFormFactor(id);
    if (!deleted) {
      throw new NotFoundException(`FormFactor with ID ${id} not found`);
    } else {
      return {
        message: `FormFactor with ID ${id} deleted successfully`,
      };
    }
  }
}
