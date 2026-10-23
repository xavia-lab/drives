import { Expose, Transform } from 'class-transformer';
import {
  VdevCapacityMode,
  VdevTechnology,
} from '../../entities/vdev-profile.entity';

export class VdevProfileResponseDto {
  @Expose() id: string;
  @Expose() displayKey: number;
  @Expose() code: string;
  @Expose() displayName: string;
  @Expose() title: string;
  @Expose() technology: VdevTechnology;
  @Expose() minMembers: number;
  @Expose() maxMembers: number | null;
  @Expose() parityMembers: number;
  @Expose() mirrorCopies: number;
  @Expose() stripeWidth: number | null;
  @Expose() capacityMode: VdevCapacityMode;
  @Expose()
  @Transform(({ obj }) => {
    const value = obj as { metadata?: Record<string, unknown> | null };
    return value.metadata;
  })
  metadata: Record<string, unknown> | null;
  @Expose() managed: boolean;
  @Expose() sortOrder: number;
  @Expose() createdAt: Date;
  @Expose() updatedAt: Date;

  constructor(partial: Partial<VdevProfileResponseDto>) {
    Object.assign(this, partial);
  }
}
