import { IsNotEmpty, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MountDriveDto {
  @ApiProperty({
    description:
      'The physical drive to seat into the addressed server slot (must be located in the same datacenter as the server)',
    example: '019f4fa1-57db-77ba-9bd0-9620bc414e31',
    required: true,
  })
  @IsUUID('7', { message: 'The physicalDriveId must be a valid UUIDv7 string' })
  @IsNotEmpty()
  physicalDriveId: string;
}
