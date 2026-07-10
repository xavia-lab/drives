import { IsString, IsNotEmpty, Length, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateInterfaceDto {
  @ApiProperty({
    description: 'Name of the Interface',
    maxLength: 32,
    example: 'SATA III',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 32)
  name: string;

  @ApiProperty({
    description: 'The link generation',
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  linkGeneration: number;

  @ApiProperty({
    description: 'Interface throughput in Gbps',
  })
  @IsNumber()
  @IsNotEmpty()
  throughput: number;

  @ApiProperty({
    description: 'The bus protocol id',
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  busProtocolId: number;
}
