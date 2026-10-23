import { IsEnum, IsIn, IsOptional, IsUUID } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../pagination/dto/pagination-query.dto';
import { VdevClass } from '../entities/logical-vdev.entity';

export class QueryLogicalVdevDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Sortable fields: id, displayKey, storagePoolId, vdevName, vdevClass, redundancyProfileId, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey',
    'storagePoolId',
    'vdevName',
    'vdevClass',
    'redundancyProfileId',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('7')
  storagePoolId?: string;

  @ApiPropertyOptional({ enum: VdevClass })
  @IsOptional()
  @IsEnum(VdevClass)
  vdevClass?: VdevClass;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID('7')
  redundancyProfileId?: string;
}
