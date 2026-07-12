import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// Shallow relationship serialization context for Country
class CountryShallowDto {
  @Expose()
  @ApiProperty({ example: '019f4fa1-57db-72d7-b037-2f35d54f2794' })
  id: string;

  @Expose()
  @ApiProperty({ example: 'United States' })
  name: string;

  @Expose()
  @ApiProperty({ example: 'US' })
  code: string;
}

export class DatacenterResponseDto {
  @Expose()
  @ApiProperty({
    example: 1,
    description: 'The consistent global sequential index number across pages',
  })
  itemNumber: number;

  @Expose()
  @ApiProperty({
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    description: 'The unique UUIDv7 primary identifier of this datacenter',
  })
  id: string;

  @Expose()
  @ApiProperty({
    example: 'VA-ASH-1',
    description: 'Unique facility naming key code identifier',
  })
  code: string;

  @Expose()
  @ApiProperty({
    example: 'Ashburn Corporate Center 1',
    description: 'User friendly name description of the datacenter facility',
  })
  name: string;

  @Expose()
  @ApiProperty({
    example: 'Ashburn',
    description: 'The city where the facility is physically located',
  })
  city: string;

  @Expose()
  @ApiProperty({
    example: '019f4fa1-57db-72d7-b037-2f35d54f2794',
    description: 'The foreign key ID linking to the parent country entity',
  })
  countryId: string;

  @Expose()
  @ApiProperty({ example: '2026-07-12T05:23:21.690Z' })
  createdAt: Date;

  @Expose()
  @ApiProperty({ example: '2026-07-12T05:23:21.690Z' })
  updatedAt: Date;

  // --- Populated Relation Properties ---

  @Expose()
  @Type(() => CountryShallowDto)
  @ApiProperty({ type: CountryShallowDto })
  country: CountryShallowDto;
}
