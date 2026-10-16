import { IsOptional, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';

export class QueryUserDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Sortable fields: id, displayKey, email, username, name, firstName, lastName, createdAt, updatedAt',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to support fast sequence-based sorting
    'email',
    'username',
    'name',
    'firstName',
    'lastName',
    'createdAt',
    'updatedAt',
  ])
  declare sortField?: string;

  @ApiPropertyOptional({
    example: 'displayKey',
    description:
      'Filterable fields: id, displayKey, email, username, name, firstName, lastName, isActive, realm, clientId',
  })
  @IsOptional()
  @IsIn([
    'id',
    'displayKey', // 🌟 Added to allow quick integer lookups from your UI grid filters
    'email',
    'username',
    'name',
    'firstName',
    'lastName',
    'isActive',
    'realm',
    'clientId',
  ])
  declare filterField?: string;
}
