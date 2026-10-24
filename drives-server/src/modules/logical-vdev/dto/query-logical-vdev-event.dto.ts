import { IsEnum, IsIn, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../pagination/dto/pagination-query.dto';
import { VdevConfigAction } from '../entities/logical-vdev-event.entity';

export class QueryLogicalVdevEventDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'eventTimestamp',
    description:
      'Sortable fields: id, displayKey, action, eventTimestamp, createdAt',
  })
  @IsOptional()
  @IsIn(['id', 'displayKey', 'action', 'eventTimestamp', 'createdAt'])
  declare sortField?: string;

  @ApiPropertyOptional({ enum: VdevConfigAction })
  @IsOptional()
  @IsEnum(VdevConfigAction)
  action?: VdevConfigAction;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('7')
  logicalVdevId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('7')
  storagePoolId?: string;
}
