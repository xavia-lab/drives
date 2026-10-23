import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { CheckPolicy } from '../../common/decorators/check-policy.decorator';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { VdevProfileService } from './vdev-profile.service';
import { VdevProfileResponseDto } from './dto/response/vdev-profile-response.dto';

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
  async findAll() {
    return this.vdevProfileService.findAll();
  }

  @Get(':id')
  @CheckPolicy('show', 'vdev-profiles')
  @ApiOperation({ summary: 'Get a vdev topology profile by ID' })
  async findOne(@Param('id', new ParseUUIDPipe({ version: '7' })) id: string) {
    return this.vdevProfileService.findOne(id);
  }
}
