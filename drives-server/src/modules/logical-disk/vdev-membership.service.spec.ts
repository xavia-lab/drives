import { ConflictException } from '@nestjs/common';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VdevMembershipService } from './vdev-membership.service';
import {
  LogicalVdev,
  VdevClass,
} from '../logical-vdev/entities/logical-vdev.entity';
import { VdevMemberRole } from './entities/logical-disk.entity';
import { DriveLifecycleState } from '../drive-lifecycle-event/entities/drive-lifecycle-event.entity';

describe('VdevMembershipService guards', () => {
  let service: VdevMembershipService;
  let lifecycleService: { getCurrentLifecycleMap: ReturnType<typeof vi.fn> };
  let physicalDriveModel: { findByPk: ReturnType<typeof vi.fn> };
  let storagePoolModel: { findByPk: ReturnType<typeof vi.fn> };
  let topology: { getCurrentHost: ReturnType<typeof vi.fn> };

  const transaction = {} as never;
  const vdev = {
    id: 'vdev-1',
    storagePoolId: 'pool-1',
    vdevName: 'raidz2-0',
    vdevClass: VdevClass.DATA,
  } as LogicalVdev;

  beforeEach(() => {
    lifecycleService = { getCurrentLifecycleMap: vi.fn() };
    physicalDriveModel = { findByPk: vi.fn() };
    storagePoolModel = { findByPk: vi.fn() };
    topology = { getCurrentHost: vi.fn() };
    service = new VdevMembershipService(
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      physicalDriveModel as never,
      storagePoolModel as never,
      {} as never,
      topology as never,
      {} as never,
      lifecycleService as never,
    );
  });

  const guards = () =>
    service as unknown as {
      assertDrivesNotTerminal: (driveIds: string[], tx: never) => Promise<void>;
      assertSpareRoles: (
        vdev: LogicalVdev,
        members: Array<{
          physicalDriveId: string;
          memberRole?: VdevMemberRole;
        }>,
      ) => void;
      eventContext: (
        vdev: LogicalVdev,
        driveId: string,
        tx: never,
      ) => Promise<Record<string, unknown>>;
    };

  it('rejects drives in terminal lifecycle states', async () => {
    lifecycleService.getCurrentLifecycleMap.mockResolvedValue(
      new Map([
        ['drive-lost', { state: DriveLifecycleState.LOST }],
        ['drive-ok', { state: DriveLifecycleState.IN_SERVICE }],
      ]),
    );

    await expect(
      guards().assertDrivesNotTerminal(['drive-lost', 'drive-ok'], transaction),
    ).rejects.toThrow(ConflictException);
  });

  it('allows healthy or non-terminal drives', async () => {
    lifecycleService.getCurrentLifecycleMap.mockResolvedValue(
      new Map([
        ['drive-ok', { state: DriveLifecycleState.IN_SERVICE }],
        ['drive-failed', { state: DriveLifecycleState.FAILED }],
      ]),
    );

    await expect(
      guards().assertDrivesNotTerminal(
        ['drive-ok', 'drive-failed'],
        transaction,
      ),
    ).resolves.toBeUndefined();
  });

  it('rejects SPARE member roles on non-spare vdevs', () => {
    expect(() =>
      guards().assertSpareRoles(vdev, [
        {
          physicalDriveId: 'drive-1',
          memberRole: VdevMemberRole.SPARE,
        },
      ]),
    ).toThrow(ConflictException);
  });

  it('allows SPARE member roles on SPARE-class vdevs', () => {
    expect(() =>
      guards().assertSpareRoles(
        { ...vdev, vdevClass: VdevClass.SPARE } as LogicalVdev,
        [
          {
            physicalDriveId: 'drive-1',
            memberRole: VdevMemberRole.SPARE,
          },
        ],
      ),
    ).not.toThrow();
  });

  it('captures pool, vdev, host and drive capacity in event context', async () => {
    storagePoolModel.findByPk.mockResolvedValue({ poolName: 'tank' });
    topology.getCurrentHost.mockResolvedValue({
      type: 'PHYSICAL',
      serverId: 'server-1',
      hostname: 'ash-storage-01',
    });
    physicalDriveModel.findByPk.mockResolvedValue({
      driveModel: { capacity: { absoluteCapacity: 16_000_000_000_000 } },
    });

    await expect(
      guards().eventContext(vdev, 'drive-1', transaction),
    ).resolves.toEqual({
      storagePoolId: 'pool-1',
      storagePoolName: 'tank',
      vdevId: 'vdev-1',
      vdevName: 'raidz2-0',
      vdevClass: VdevClass.DATA,
      hostType: 'PHYSICAL',
      hostServerId: 'server-1',
      hostHostname: 'ash-storage-01',
      driveCapacityBytes: 16_000_000_000_000,
    });
  });
});
