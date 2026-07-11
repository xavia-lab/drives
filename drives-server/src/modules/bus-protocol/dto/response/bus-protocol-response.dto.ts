import { Expose } from 'class-transformer';

export class BusProtocolResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

  @Expose()
  commandSet: string;

  @Expose()
  supportsHotPlug: boolean;

  @Expose()
  managed: boolean;

  @Expose()
  title: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  constructor(partial: Partial<BusProtocolResponseDto>) {
    Object.assign(this, partial);
  }
}
