import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class BoardServerDto {
  @Expose() @ApiProperty() id: string;
  @Expose() @ApiProperty() hostname: string;
  @Expose() @ApiProperty() rackId: string;
  @Expose() @ApiProperty({ nullable: true }) rackName: string | null;
  @Expose() @ApiProperty() datacenterId: string;
  @Expose() @ApiProperty() datacenterCode: string;
  @Expose() @ApiProperty() datacenterName: string;
}

class BoardOccupantDto {
  @Expose() @ApiProperty() allocationId: string;
  @Expose() @ApiProperty() physicalDriveId: string;
  @Expose() @ApiProperty() driveLabel: string;
  @Expose() @ApiProperty() serialNumber: string;
  @Expose() @ApiProperty() driveModelId: string;
  @Expose() @ApiProperty({ nullable: true }) driveModelName: string | null;
  @Expose() @ApiProperty() assignedAt: Date;
}

class BoardSlotDto {
  @Expose() @ApiProperty() id: string;
  @Expose() @ApiProperty() slotLabel: string;
  @Expose() @ApiProperty({ nullable: true }) pcieBusAddress: string | null;
  @Expose() @ApiProperty() supportedInterfaceId: string;

  @Expose()
  @Type(() => BoardOccupantDto)
  @ApiProperty({ type: BoardOccupantDto, nullable: true })
  occupancy: BoardOccupantDto | null;
}

class BoardDriveDto {
  @Expose() @ApiProperty() id: string;
  @Expose() @ApiProperty() label: string;
  @Expose() @ApiProperty() serialNumber: string;
  @Expose() @ApiProperty() driveModelId: string;
  @Expose() @ApiProperty({ nullable: true }) driveModelName: string | null;
}

class BoardSummaryDto {
  @Expose() @ApiProperty() totalSlots: number;
  @Expose() @ApiProperty() occupiedSlots: number;
  @Expose() @ApiProperty() emptySlots: number;
  @Expose() @ApiProperty() freeDrives: number;
}

export class SlotAssignmentBoardResponseDto {
  @Expose()
  @Type(() => BoardServerDto)
  @ApiProperty({ type: BoardServerDto })
  server: BoardServerDto;

  @Expose()
  @Type(() => BoardSlotDto)
  @ApiProperty({ type: [BoardSlotDto] })
  slots: BoardSlotDto[];

  @Expose()
  @Type(() => BoardDriveDto)
  @ApiProperty({ type: [BoardDriveDto] })
  freeDrives: BoardDriveDto[];

  @Expose()
  @Type(() => BoardSummaryDto)
  @ApiProperty({ type: BoardSummaryDto })
  summary: BoardSummaryDto;
}
