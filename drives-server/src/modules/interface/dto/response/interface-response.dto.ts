import { Expose } from 'class-transformer';

export class InterfaceResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  busProtocolId: string;

  @Expose()
  linkGeneration: number;

  @Expose()
  throughput: number;

  @Expose()
  managed: boolean;

  @Expose()
  title: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<InterfaceResponseDto>) {
    Object.assign(this, partial);
  }
}
