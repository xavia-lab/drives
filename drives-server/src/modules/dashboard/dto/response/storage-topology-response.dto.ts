import { Expose, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class TopologyDatacenterDto {
  @Expose() @ApiProperty() id: string;
  @Expose() @ApiProperty() code: string;
  @Expose() @ApiProperty() name: string;
}

class TopologyHostDto {
  @Expose() @ApiProperty() type: string;
  @Expose() @ApiProperty() id: string;
  @Expose() @ApiProperty() hostname: string;
  @Expose() @ApiProperty({ nullable: true }) hostServerId: string | null;
  @Expose() @ApiProperty({ nullable: true }) hostServerHostname: string | null;
  @Expose() @ApiProperty({ nullable: true }) rackName: string | null;
}

class TopologyPassThroughDto {
  @Expose() @ApiProperty() virtualServerId: string;
  @Expose() @ApiProperty() hostname: string;
  @Expose() @ApiProperty() isSelectedHost: boolean;
}

class TopologyMappingDto {
  @Expose() @ApiProperty() poolId: string;
  @Expose() @ApiProperty() poolName: string;
  @Expose() @ApiProperty() poolTypeName: string;
  @Expose() @ApiProperty() poolOwnerType: string;
  @Expose() @ApiProperty() poolOwnerName: string;
  @Expose() @ApiProperty() vdevId: string;
  @Expose() @ApiProperty() vdevName: string;
  @Expose() @ApiProperty() vdevClass: string;
  @Expose() @ApiProperty({ nullable: true }) vdevHealth: string | null;
  @Expose() @ApiProperty() memberRole: string;
  @Expose() @ApiProperty() memberIndex: number;
  @Expose() @ApiProperty({ nullable: true }) groupIndex: number | null;
}

class TopologyOccupancyDto {
  @Expose() @ApiProperty() allocationId: string;
  @Expose() @ApiProperty() physicalDriveId: string;
  @Expose() @ApiProperty() label: string;
  @Expose() @ApiProperty() serialNumber: string;
  @Expose() @ApiProperty() driveModelId: string;
  @Expose() @ApiProperty({ nullable: true }) driveModelName: string | null;
  @Expose()
  @Type(() => TopologyMappingDto)
  @ApiProperty({ type: TopologyMappingDto, nullable: true })
  mapping: TopologyMappingDto | null;
}

class TopologySlotDto {
  @Expose() @ApiProperty() id: string;
  @Expose() @ApiProperty() slotLabel: string;
  @Expose() @ApiProperty({ nullable: true }) pcieBusAddress: string | null;
  @Expose() @ApiProperty() interfaceId: string;
  @Expose() @ApiProperty() interfaceName: string;
  @Expose()
  @Type(() => TopologyOccupancyDto)
  @ApiProperty({ type: TopologyOccupancyDto, nullable: true })
  occupancy: TopologyOccupancyDto | null;
  @Expose()
  @Type(() => TopologyPassThroughDto)
  @ApiProperty({ type: TopologyPassThroughDto, nullable: true })
  passthrough: TopologyPassThroughDto | null;
}

class TopologyPoolMemberDto {
  @Expose() @ApiProperty() physicalDriveId: string;
  @Expose() @ApiProperty() label: string;
  @Expose() @ApiProperty() serialNumber: string;
  @Expose() @ApiProperty({ nullable: true }) slotLabel: string | null;
}

class TopologyVdevDto {
  @Expose() @ApiProperty() id: string;
  @Expose() @ApiProperty() vdevName: string;
  @Expose() @ApiProperty() vdevClass: string;
  @Expose() @ApiProperty({ nullable: true }) health: string | null;
  @Expose() @ApiProperty() memberCount: number;
  @Expose()
  @Type(() => TopologyPoolMemberDto)
  @ApiProperty({ type: [TopologyPoolMemberDto] })
  members: TopologyPoolMemberDto[];
}

class TopologyPoolDto {
  @Expose() @ApiProperty() id: string;
  @Expose() @ApiProperty() poolName: string;
  @Expose() @ApiProperty() poolTypeName: string;
  @Expose() @ApiProperty() ownerType: string;
  @Expose() @ApiProperty() ownerName: string;
  @Expose()
  @Type(() => TopologyVdevDto)
  @ApiProperty({ type: [TopologyVdevDto] })
  vdevs: TopologyVdevDto[];
}

class TopologySummaryDto {
  @Expose() @ApiProperty() totalSlots: number;
  @Expose() @ApiProperty() occupiedSlots: number;
  @Expose() @ApiProperty() emptySlots: number;
  @Expose() @ApiProperty() mappedDrives: number;
  @Expose() @ApiProperty() unmappedDrives: number;
  @Expose() @ApiProperty() passthroughSlots: number;
  @Expose() @ApiProperty() poolCount: number;
  @Expose() @ApiProperty() vdevCount: number;
}

export class StorageTopologyResponseDto {
  @Expose()
  @Type(() => TopologyDatacenterDto)
  @ApiProperty({ type: TopologyDatacenterDto })
  datacenter: TopologyDatacenterDto;

  @Expose()
  @Type(() => TopologyHostDto)
  @ApiProperty({ type: TopologyHostDto })
  host: TopologyHostDto;

  @Expose()
  @Type(() => TopologySlotDto)
  @ApiProperty({ type: [TopologySlotDto] })
  slots: TopologySlotDto[];

  @Expose()
  @Type(() => TopologyPoolDto)
  @ApiProperty({ type: [TopologyPoolDto] })
  pools: TopologyPoolDto[];

  @Expose()
  @Type(() => TopologySummaryDto)
  @ApiProperty({ type: TopologySummaryDto })
  summary: TopologySummaryDto;
}
