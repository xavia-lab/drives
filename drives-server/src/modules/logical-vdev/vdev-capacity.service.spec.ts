import { describe, it, expect, beforeEach, vi } from 'vitest';
import { VdevCapacityService } from './vdev-capacity.service';
import { LogicalVdev } from './entities/logical-vdev.entity';
import {
  LogicalDisk,
  VdevMemberRole,
} from '../logical-disk/entities/logical-disk.entity';
import {
  VdevCapacityMode,
  VdevProfile,
} from '../vdev-profile/entities/vdev-profile.entity';

const TB = 1_000_000_000_000;

const profile = (mode: VdevCapacityMode, extra: Partial<VdevProfile> = {}) =>
  ({
    id: 'profile',
    minMembers: 2,
    maxMembers: null,
    parityMembers: 0,
    mirrorCopies: 1,
    capacityMode: mode,
    ...extra,
  }) as VdevProfile;

const member = (size: number, role = VdevMemberRole.DATA) =>
  ({
    memberRole: role,
    physicalDrive: {
      driveModel: { capacity: { absoluteCapacity: size } },
    },
  }) as unknown as LogicalDisk;

describe('VdevCapacityService', () => {
  let service: VdevCapacityService;
  let findAll: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    findAll = vi.fn();
    service = new VdevCapacityService(
      {} as never,
      { findAll } as never,
      {} as never,
    );
  });

  const calculate = async (
    vdevProfile: VdevProfile,
    members: LogicalDisk[],
  ) => {
    findAll.mockResolvedValue(members);
    return service.calculate({
      id: 'vdev',
      redundancyProfileId: vdevProfile.id,
      redundancyProfile: vdevProfile,
    } as LogicalVdev);
  };

  it('sums data members for a stripe', async () => {
    const result = await calculate(
      profile(VdevCapacityMode.SUM, { minMembers: 2 }),
      [member(16 * TB), member(16 * TB)],
    );
    expect(result.rawBytes).toBe(32 * TB);
    expect(result.usableBytes).toBe(32 * TB);
    expect(result.isComplete).toBe(true);
  });

  it('uses the smallest member for a mirror', async () => {
    const result = await calculate(
      profile(VdevCapacityMode.MIN, { minMembers: 2, mirrorCopies: 2 }),
      [member(16 * TB), member(20 * TB)],
    );
    expect(result.rawBytes).toBe(36 * TB);
    expect(result.usableBytes).toBe(16 * TB);
    expect(result.smallestMemberBytes).toBe(16 * TB);
  });

  it('applies parity for RAIDZ2', async () => {
    const result = await calculate(
      profile(VdevCapacityMode.PARITY, {
        minMembers: 4,
        parityMembers: 2,
      }),
      Array.from({ length: 6 }, () => member(16 * TB)),
    );
    expect(result.usableBytes).toBe(64 * TB);
    expect(result.estimated).toBe(true);
  });

  it('sums the smallest member per RAID10 mirror group', async () => {
    const result = await calculate(
      profile(VdevCapacityMode.MIRROR_GROUPS, {
        minMembers: 4,
        mirrorCopies: 2,
        stripeWidth: 2,
      }),
      [member(16 * TB), member(20 * TB), member(16 * TB), member(18 * TB)],
    );
    expect(result.usableBytes).toBe(32 * TB);
  });

  it('excludes spare drives from usable capacity', async () => {
    const result = await calculate(
      profile(VdevCapacityMode.MIN, { minMembers: 2 }),
      [member(16 * TB), member(16 * TB), member(16 * TB, VdevMemberRole.SPARE)],
    );
    expect(result.rawBytes).toBe(32 * TB);
    expect(result.spareCount).toBe(1);
    expect(result.usableBytes).toBe(16 * TB);
  });

  it('returns unknown capacity instead of zero when a member size is missing', async () => {
    const unknown = {
      memberRole: VdevMemberRole.DATA,
      physicalDrive: { driveModel: { capacity: null } },
    } as unknown as LogicalDisk;
    const result = await calculate(profile(VdevCapacityMode.SUM), [
      member(16 * TB),
      unknown,
    ]);
    expect(result.capacityKnown).toBe(false);
    expect(result.usableBytes).toBeNull();
  });
});
