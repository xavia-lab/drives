import { Expose, Transform } from 'class-transformer';
import { VdevConfigAction } from '../../entities/logical-vdev-event.entity';

export class LogicalVdevEventResponseDto {
  @Expose() id: string;
  @Expose() displayKey: number;
  @Expose() logicalVdevId: string | null;
  @Expose() storagePoolId: string | null;
  @Expose() action: VdevConfigAction;
  @Expose()
  @Transform(
    ({ obj }) =>
      (obj as { beforeSnapshot?: Record<string, unknown> | null })
        .beforeSnapshot,
  )
  beforeSnapshot: Record<string, unknown> | null;
  @Expose()
  @Transform(
    ({ obj }) =>
      (obj as { afterSnapshot?: Record<string, unknown> | null }).afterSnapshot,
  )
  afterSnapshot: Record<string, unknown> | null;
  @Expose() eventTimestamp: Date;
  @Expose() performedByUserId: string | null;
  @Expose() notes: string | null;
}
