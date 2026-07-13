import { IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateDriveLifecycleEventDto } from './create-drive-lifecycle-event.dto';

export class UpdateDriveLifecycleEventDto extends PartialType(
  CreateDriveLifecycleEventDto,
) {
  @ApiPropertyOptional({
    description:
      'Append or update metadata tags, notes, or resolution details inside the flexible telemetry block',
    example: {
      technician_notes: 'Drive reseated, serial verification matches labels.',
      root_cause: 'Loose backplane SAS lane connector',
    },
    // type: 'object',
  })
  @IsOptional()
  @IsObject()
  contextMetadata?: Record<string, any>;
}
