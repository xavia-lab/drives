import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { KeycloakAuthGuard } from '../../common/guards/keycloak.guard';
import { CerbosGuard } from '../../common/guards/cerbos.guard';
import { CheckPolicy } from '../../common/decorators/check-policy.decorator';
import { Serialize } from '../../common/interceptors/serialize.interceptor';
import { PhysicalDriveMediaService } from './physical-drive-media.service';
import { PhysicalDriveMediaResponseDto } from './dto/response/physical-drive-media-response.dto';
import {
  ManagePhysicalDriveMediaDto,
  UploadPhysicalDriveMediaDto,
} from './dto/physical-drive-media.dto';
import { UpdatePhysicalDriveMediaDto } from './dto/update-physical-drive-media.dto';

const MAX_FILES = 20;
const MAX_FILE_SIZE = 25 * 1024 * 1024;

@ApiTags('physical-drives')
@Controller('physical-drives')
@UseGuards(KeycloakAuthGuard, CerbosGuard)
@ApiBearerAuth()
export class PhysicalDriveMediaController {
  constructor(
    private readonly physicalDriveMediaService: PhysicalDriveMediaService,
  ) {}

  @Get(':id/media')
  @CheckPolicy('show', 'physical-drives')
  @Serialize(PhysicalDriveMediaResponseDto)
  @ApiOperation({ summary: 'List media attached to a physical drive' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Attachments retrieved successfully',
  })
  async findAll(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
  ): Promise<PhysicalDriveMediaResponseDto[]> {
    return this.physicalDriveMediaService.findForDrive(id);
  }

  @Post(':id/media')
  @CheckPolicy('manage-media', 'physical-drives')
  @Serialize(PhysicalDriveMediaResponseDto)
  @UseInterceptors(
    FilesInterceptor('files', MAX_FILES, {
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload and attach media to a physical drive' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 201, description: 'Attachments created successfully' })
  async attach(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @Body() dto: UploadPhysicalDriveMediaDto,
  ): Promise<PhysicalDriveMediaResponseDto[]> {
    return this.physicalDriveMediaService.attachFiles(
      id,
      files ?? [],
      dto.attachments,
    );
  }

  @Put(':id/media')
  @CheckPolicy('manage-media', 'physical-drives')
  @Serialize(PhysicalDriveMediaResponseDto)
  @UseInterceptors(
    FilesInterceptor('files', MAX_FILES, {
      limits: { fileSize: MAX_FILE_SIZE },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Apply staged media changes (add, update and remove attachments) in one transaction',
  })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({
    status: 200,
    description: 'Media changes applied successfully',
  })
  async manage(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @Body() dto: ManagePhysicalDriveMediaDto,
  ): Promise<PhysicalDriveMediaResponseDto[]> {
    return this.physicalDriveMediaService.manageMedia(id, {
      files: files ?? [],
      add: dto.add,
      update: dto.update,
      remove: dto.remove,
    });
  }

  @Patch(':id/media/:attachmentId')
  @CheckPolicy('manage-media', 'physical-drives')
  @Serialize(PhysicalDriveMediaResponseDto)
  @ApiOperation({ summary: 'Update attachment notes, type or primary flag' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'attachmentId', type: String })
  @ApiResponse({ status: 200, description: 'Attachment updated successfully' })
  async update(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Param('attachmentId', new ParseUUIDPipe({ version: '7' }))
    attachmentId: string,
    @Body() dto: UpdatePhysicalDriveMediaDto,
  ): Promise<PhysicalDriveMediaResponseDto> {
    return this.physicalDriveMediaService.updateAttachment(
      id,
      attachmentId,
      dto,
    );
  }

  @Delete(':id/media/:attachmentId')
  @CheckPolicy('manage-media', 'physical-drives')
  @ApiOperation({ summary: 'Detach media from a physical drive' })
  @ApiParam({ name: 'id', type: String })
  @ApiParam({ name: 'attachmentId', type: String })
  @ApiResponse({ status: 200, description: 'Attachment removed successfully' })
  async detach(
    @Param('id', new ParseUUIDPipe({ version: '7' })) id: string,
    @Param('attachmentId', new ParseUUIDPipe({ version: '7' }))
    attachmentId: string,
  ): Promise<{ message: string }> {
    await this.physicalDriveMediaService.detach(id, attachmentId);
    return { message: `Media attachment ${attachmentId} removed` };
  }
}
