import { IsOptional, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateDriveLifecycleEventDto {
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
