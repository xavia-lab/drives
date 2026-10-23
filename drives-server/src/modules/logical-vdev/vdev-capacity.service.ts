import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import { LogicalVdev } from './entities/logical-vdev.entity';
import {
  LogicalDisk,
  VdevMemberRole,
} from '../logical-disk/entities/logical-disk.entity';
import {
  VdevProfile,
  VdevCapacityMode,
} from '../vdev-profile/entities/vdev-profile.entity';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { DriveModel } from '../drive-model/entities/drive-model.entity';
import { Capacity } from '../capacity/entities/capacity.entity';

export interface VdevCapacity {
  memberCount: number;
  dataMemberCount: number;
  spareCount: number;
  minMembers: number;
  maxMembers: number | null;
  isComplete: boolean;
  capacityKnown: boolean;
  rawBytes: number | null;
  dataRawBytes: number | null;
  usableBytes: number | null;
  smallestMemberBytes: number | null;
  formula: string;
  estimated: boolean;
}

@Injectable()
export class VdevCapacityService {
  constructor(
    @InjectModel(LogicalVdev)
    private readonly logicalVdevModel: typeof LogicalVdev,
    @InjectModel(LogicalDisk)
    private readonly logicalDiskModel: typeof LogicalDisk,
    @InjectModel(VdevProfile)
    private readonly vdevProfileModel: typeof VdevProfile,
  ) {}

  private capacityOf(member: LogicalDisk): number | null {
    const drive = member.physicalDrive as PhysicalDrive | undefined;
    const driveModel = drive?.driveModel;
    const capacity = driveModel?.capacity;
    const absolute = capacity?.absoluteCapacity;

    if (absolute === undefined || absolute === null) {
      return null;
    }
    const value = Number(absolute);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  private calculateFor(
    profile: VdevProfile,
    members: LogicalDisk[],
  ): VdevCapacity {
    const dataMembers = members.filter(
      (member) => member.memberRole === VdevMemberRole.DATA,
    );
    const spareCount = members.length - dataMembers.length;
    const capacities = dataMembers.map((member) => this.capacityOf(member));
    const known = capacities.filter((value): value is number => value !== null);
    const capacityKnown =
      capacities.length === 0 || known.length === capacities.length;

    const rawBytes =
      capacities.length === 0
        ? 0
        : known.reduce((sum, value) => sum + value, 0);
    const dataRawBytes = capacityKnown ? rawBytes : null;
    const smallest = known.length > 0 ? Math.min(...known) : null;

    let usableBytes: number | null = null;
    let formula = 'No data members';

    if (dataMembers.length === 0) {
      usableBytes = 0;
    } else if (!capacityKnown || smallest === null) {
      usableBytes = null;
      formula = 'Unknown drive capacity';
    } else {
      switch (profile.capacityMode) {
        case VdevCapacityMode.SUM:
          usableBytes = known.reduce((sum, value) => sum + value, 0);
          formula = 'sum of member capacities';
          break;
        case VdevCapacityMode.MIN:
          usableBytes = smallest;
          formula = 'smallest member capacity';
          break;
        case VdevCapacityMode.PARITY: {
          const dataCount = Math.max(
            0,
            dataMembers.length - profile.parityMembers,
          );
          usableBytes = dataCount * smallest;
          formula = `(${dataMembers.length} - ${profile.parityMembers}) × smallest member`;
          break;
        }
        case VdevCapacityMode.MIRROR_GROUPS: {
          const groupSize = Math.max(2, profile.mirrorCopies || 2);
          const groups = Math.floor(dataMembers.length / groupSize);
          usableBytes =
            groups * Math.min(...known.slice(0, groups * groupSize));
          formula = `${groups} mirror group(s) × smallest member per group`;
          break;
        }
      }
    }

    return {
      memberCount: members.length,
      dataMemberCount: dataMembers.length,
      spareCount,
      minMembers: profile.minMembers,
      maxMembers: profile.maxMembers,
      isComplete: dataMembers.length >= profile.minMembers,
      capacityKnown,
      rawBytes: capacityKnown ? rawBytes : null,
      dataRawBytes,
      usableBytes,
      smallestMemberBytes: smallest,
      formula,
      estimated:
        profile.capacityMode === VdevCapacityMode.PARITY ||
        profile.capacityMode === VdevCapacityMode.MIRROR_GROUPS,
    };
  }

  private memberIncludes() {
    return [
      {
        model: PhysicalDrive,
        include: [{ model: DriveModel, include: [Capacity] }],
      },
    ];
  }

  async getMembers(
    vdevId: string,
    transaction?: Transaction,
  ): Promise<LogicalDisk[]> {
    return this.logicalDiskModel.findAll({
      where: { logicalVdevId: vdevId },
      include: this.memberIncludes(),
      order: [
        ['memberRole', 'ASC'],
        ['displayKey', 'ASC'],
      ],
      transaction,
    });
  }

  async calculate(
    vdev: LogicalVdev,
    transaction?: Transaction,
  ): Promise<VdevCapacity> {
    const profile =
      vdev.redundancyProfile ??
      (await this.vdevProfileModel.findByPk(vdev.redundancyProfileId, {
        transaction,
      }));
    if (!profile) {
      throw new Error(`VdevProfile ${vdev.redundancyProfileId} not found`);
    }
    const members = await this.getMembers(vdev.id, transaction);
    return this.calculateFor(profile, members);
  }

  async calculateMany(
    vdevIds: string[],
    transaction?: Transaction,
  ): Promise<Map<string, VdevCapacity>> {
    const result = new Map<string, VdevCapacity>();
    if (vdevIds.length === 0) {
      return result;
    }

    const vdevs = await this.logicalVdevModel.findAll({
      where: { id: { [Op.in]: vdevIds } },
      include: [VdevProfile],
      transaction,
    });
    const members = await this.logicalDiskModel.findAll({
      where: { logicalVdevId: { [Op.in]: vdevIds } },
      include: this.memberIncludes(),
      transaction,
    });
    const membersByVdev = new Map<string, LogicalDisk[]>();
    for (const member of members) {
      const list = membersByVdev.get(member.logicalVdevId) ?? [];
      list.push(member);
      membersByVdev.set(member.logicalVdevId, list);
    }

    for (const vdev of vdevs) {
      const profile = vdev.redundancyProfile as VdevProfile | undefined;
      if (!profile) continue;
      result.set(
        vdev.id,
        this.calculateFor(profile, membersByVdev.get(vdev.id) ?? []),
      );
    }

    return result;
  }
}
