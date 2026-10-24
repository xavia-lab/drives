import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { CheckPolicy } from '../../common/decorators/check-policy.decorator';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { VdevProfileService } from './vdev-profile.service';
import { VdevProfileResponseDto } from './dto/response/vdev-profile-response.dto';
import { CreateVdevProfileDto } from './dto/create-vdev-profile.dto';
import { UpdateVdevProfileDto } from './dto/update-vdev-profile.dto';
import { QueryVdevProfileDto } from './dto/query-vdev-profile.dto';

@ApiTags('vdev-profiles')
@Controller('vdev-profiles')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
@Serialize(VdevProfileResponseDto)
export class VdevProfileController {
  constructor(private readonly vdevProfileService: VdevProfileService) {}

  @Get()
  @CheckPolicy('list', 'vdev-profiles')
  @ApiOperation({ summary: 'List available vdev topology profiles' })
  @ApiQuery({ type: QueryVdevProfileDto })
  async findAll(@Query() query: QueryVdevProfileDto) {
    return this.vdevProfileService.findAll(query);
  }

  @Post()
  @CheckPolicy('create', 'vdev-profiles')
  @ApiOperation({ summary: 'Create a vdev topology profile' })
  async create(@Body() dto: CreateVdevProfileDto) {
    return this.vdevProfileService.create(dto);
  }

  @Get(':id')
  @CheckPolicy('show', 'vdev-profiles')
  @ApiOperation({ summary: 'Get a vdev topology profile by ID' })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string) {
    return this.vdevProfileService.findOne(id);
  }

  @Put(':id')
  @CheckPolicy('edit', 'vdev-profiles')
  @ApiOperation({ summary: 'Update a vdev topology profile' })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Body() dto: UpdateVdevProfileDto,
  ) {
    return this.vdevProfileService.update(id, dto);
  }

  @Delete(':id')
  @CheckPolicy('delete', 'vdev-profiles')
  @ApiOperation({ summary: 'Delete an unused vdev topology profile' })
  async delete(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string) {
    await this.vdevProfileService.delete(id);
    return { message: `VdevProfile with ID ${id} deleted successfully` };
  }
}
