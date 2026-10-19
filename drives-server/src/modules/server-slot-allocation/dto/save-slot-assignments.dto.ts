import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsUUID, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SlotAssignmentEntryDto {
  @ApiProperty({
    description: 'The server slot to seat a drive into',
    example: '019f4fa1-57db-77ba-9bd0-9620bc414e31',
    required: true,
  })
  @IsUUID('7', { message: 'The slotId must be a valid UUIDv7 string' })
  @IsNotEmpty()
  slotId: string;

  @ApiProperty({
    description:
      'The physical drive occupying the slot (must be located in the same datacenter as the server)',
    example: '019f4fa1-57db-77ba-9bd0-9620bc414e32',
    required: true,
  })
  @IsUUID('7', { message: 'The physicalDriveId must be a valid UUIDv7 string' })
  @IsNotEmpty()
  physicalDriveId: string;
}

export class SaveSlotAssignmentsDto {
  @ApiProperty({
    type: [SlotAssignmentEntryDto],
    description:
      'The complete desired seating for the server. Slots omitted from the list are emptied.',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SlotAssignmentEntryDto)
  assignments: SlotAssignmentEntryDto[];
}
