import { IsEnum, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TopologyHostType {
  PHYSICAL = 'PHYSICAL',
  VIRTUAL = 'VIRTUAL',
}

export class QueryStorageTopologyDto {
  @ApiProperty()
  @IsUUID('7')
  datacenterId: string;

  @ApiProperty({ enum: TopologyHostType })
  @IsEnum(TopologyHostType)
  hostType: TopologyHostType;

  @ApiProperty()
  @IsUUID('7')
  hostId: string;
}
