import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/sequelize';
import { Op, Order, Sequelize, Transaction } from 'sequelize';
import { randomUUID } from 'crypto';
import { LogicalDisk, VdevMemberRole } from './entities/logical-disk.entity';
import {
  LogicalDiskEvent,
  VdevMembershipAction,
} from './entities/logical-disk-event.entity';
import {
  LogicalVdev,
  VdevClass,
} from '../logical-vdev/entities/logical-vdev.entity';
import {
  VdevCapacityMode,
  VdevProfile,
} from '../vdev-profile/entities/vdev-profile.entity';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { StoragePool } from '../storage-pool/entities/storage-pool.entity';
import { DriveModel } from '../drive-model/entities/drive-model.entity';
import { Capacity } from '../capacity/entities/capacity.entity';
import { StorageTopologyService } from '../storage-topology/storage-topology.service';
import { DriveLifecycleEventService } from '../drive-lifecycle-event/drive-lifecycle-event.service';
import { isTerminalState } from '../drive-lifecycle-event/drive-lifecycle-state-machine';
import {
  VdevCapacityService,
  type VdevCapacity,
} from '../logical-vdev/vdev-capacity.service';
import { AttachVdevMembersDto } from './dto/attach-vdev-members.dto';
import { MoveVdevMembersDto } from './dto/move-vdev-members.dto';
import { SaveVdevLayoutDto } from './dto/save-vdev-layout.dto';

const MEMBER_ORDER: Order = [
  ['memberRole', 'ASC'],
  ['displayKey', 'ASC'],
];

@Injectable()
export class VdevMembershipService {
  constructor(
    @InjectModel(LogicalDisk)
    private readonly logicalDiskModel: typeof LogicalDisk,
    @InjectModel(LogicalDiskEvent)
    private readonly eventModel: typeof LogicalDiskEvent,
    @InjectModel(LogicalVdev)
    private readonly logicalVdevModel: typeof LogicalVdev,
    @InjectModel(VdevProfile)
    private readonly vdevProfileModel: typeof VdevProfile,
    @InjectModel(PhysicalDrive)
    private readonly physicalDriveModel: typeof PhysicalDrive,
    @InjectModel(StoragePool)
    private readonly storagePoolModel: typeof StoragePool,
    @InjectConnection()
    private readonly sequelize: Sequelize,
    private readonly topology: StorageTopologyService,
    private readonly capacity: VdevCapacityService,
    private readonly lifecycleService: DriveLifecycleEventService,
  ) {}

  async getMembers(vdevId: string): Promise<LogicalDisk[]> {
    return this.logicalDiskModel.findAll({
      where: { logicalVdevId: vdevId },
      include: [PhysicalDrive],
      order: MEMBER_ORDER,
    });
  }

  async getCapacity(vdevId: string): Promise<VdevCapacity> {
    const vdev = await this.vdevModelOrThrow(vdevId);
    return this.capacity.calculate(vdev);
  }

  async reconcileProjection(): Promise<{
    inserted: number;
    updated: number;
    removed: number;
  }> {
    return this.sequelize.transaction(async (transaction) => {
      const events = await this.eventModel.findAll({
        order: [
          ['physicalDriveId', 'ASC'],
          ['eventTimestamp', 'ASC'],
          ['displayKey', 'ASC'],
        ],
        transaction,
      });
      const latest = new Map<string, LogicalDiskEvent>();
      for (const event of events) {
        latest.set(event.physicalDriveId, event);
      }

      const desired = new Map<
        string,
        {
          vdevId: string;
          role: VdevMemberRole;
          path: string | null;
          memberIndex: number;
          groupIndex: number | null;
          attachedAt: Date;
        }
      >();
      for (const [driveId, event] of latest) {
        if (event.action === VdevMembershipAction.DETACH || !event.toVdevId) {
          continue;
        }
        desired.set(driveId, {
          vdevId: event.toVdevId,
          role: event.memberRole ?? VdevMemberRole.DATA,
          path: event.osDeviceNodePath,
          memberIndex: event.memberIndex ?? 0,
          groupIndex: event.groupIndex,
          attachedAt: event.eventTimestamp,
        });
      }

      const current = await this.logicalDiskModel.findAll({
        transaction,
        lock: transaction.LOCK.UPDATE,
        order: [['physicalDriveId', 'ASC']],
      });
      const currentByDrive = new Map(
        current.map((row) => [row.physicalDriveId, row]),
      );
      let inserted = 0;
      let updated = 0;
      let removed = 0;

      for (const [driveId, row] of desired) {
        const existing = currentByDrive.get(driveId);
        if (!existing) {
          await this.logicalDiskModel.create(
            {
              logicalVdevId: row.vdevId,
              physicalDriveId: driveId,
              osDeviceNodePath: row.path,
              memberRole: row.role,
              memberIndex: row.memberIndex,
              groupIndex: row.groupIndex,
              attachedAt: row.attachedAt,
            } as Partial<LogicalDisk>,
            { transaction },
          );
          inserted += 1;
          continue;
        }
        const changed =
          existing.logicalVdevId !== row.vdevId ||
          existing.osDeviceNodePath !== row.path ||
          existing.memberRole !== row.role ||
          existing.memberIndex !== row.memberIndex ||
          existing.groupIndex !== row.groupIndex;
        if (changed) {
          await existing.update(
            {
              logicalVdevId: row.vdevId,
              osDeviceNodePath: row.path,
              memberRole: row.role,
              memberIndex: row.memberIndex,
              groupIndex: row.groupIndex,
              attachedAt: row.attachedAt,
            },
            { transaction },
          );
          updated += 1;
        }
      }

      for (const row of current) {
        if (!desired.has(row.physicalDriveId)) {
          await row.destroy({ transaction });
          removed += 1;
        }
      }

      return { inserted, updated, removed };
    });
  }

  async getHistory(vdevId: string): Promise<LogicalDiskEvent[]> {
    const { Op } = await import('sequelize');
    return this.eventModel.findAll({
      where: {
        [Op.or]: [
          { logicalVdevId: vdevId },
          { fromVdevId: vdevId },
          { toVdevId: vdevId },
        ],
      },
      include: [PhysicalDrive],
      order: [
        ['eventTimestamp', 'DESC'],
        ['displayKey', 'DESC'],
      ],
    });
  }

  async attach(
    vdevId: string,
    dto: AttachVdevMembersDto,
    performedByUserId?: string | null,
  ): Promise<LogicalDisk[]> {
    return this.sequelize.transaction(async (transaction) => {
      const vdev = await this.lockVdev(vdevId, transaction);
      const profile = vdev.redundancyProfile;
      const driveIds = this.uniqueDriveIds(
        dto.members.map((member) => member.physicalDriveId),
      );
      if (driveIds.length !== dto.members.length) {
        throw new ConflictException(
          'A physical drive may appear only once in an attach request',
        );
      }

      await this.assertAccessible(vdev, driveIds, transaction);
      this.assertSpareRoles(vdev, dto.members);
      await this.lockDrivesAndCurrent(driveIds, transaction);
      await this.assertDrivesExist(driveIds, transaction);
      await this.assertDriveNotAssigned(driveIds, transaction);
      await this.assertDrivesNotTerminal(driveIds, transaction);

      const currentCount = await this.logicalDiskModel.count({
        where: { logicalVdevId: vdevId },
        transaction,
      });
      if (
        profile?.maxMembers != null &&
        currentCount + driveIds.length > profile.maxMembers
      ) {
        throw new ConflictException(
          `Vdev ${vdevId} accepts at most ${profile.maxMembers} members`,
        );
      }

      const currentMax = await this.logicalDiskModel.findOne({
        where: { logicalVdevId: vdevId },
        attributes: ['memberIndex'],
        order: [['memberIndex', 'DESC']],
        transaction,
      });
      const correlationId = randomUUID();
      const created: LogicalDisk[] = [];
      let nextIndex = (currentMax?.memberIndex ?? -1) + 1;
      for (const member of dto.members) {
        const memberIndex = member.memberIndex ?? nextIndex;
        const groupIndex =
          member.groupIndex ?? this.groupIndexFor(profile, memberIndex);
        nextIndex = Math.max(nextIndex, memberIndex) + 1;
        const row = await this.logicalDiskModel.create(
          {
            logicalVdevId: vdevId,
            physicalDriveId: member.physicalDriveId,
            osDeviceNodePath: member.osDeviceNodePath ?? null,
            memberRole: member.memberRole ?? VdevMemberRole.DATA,
            memberIndex,
            groupIndex,
            attachedAt: new Date(),
          } as Partial<LogicalDisk>,
          { transaction },
        );
        await this.appendEvent(
          {
            action: VdevMembershipAction.ATTACH,
            physicalDriveId: member.physicalDriveId,
            logicalVdevId: vdevId,
            toVdevId: vdevId,
            memberRole: member.memberRole ?? VdevMemberRole.DATA,
            memberIndex,
            groupIndex,
            osDeviceNodePath: member.osDeviceNodePath ?? null,
            performedByUserId: performedByUserId ?? null,
            correlationId,
            notes: dto.notes ?? null,
            contextMetadata: await this.eventContext(
              vdev,
              member.physicalDriveId,
              transaction,
            ),
          },
          transaction,
        );
        created.push(row);
      }

      return created;
    });
  }

  async detach(
    vdevId: string,
    physicalDriveId: string,
    performedByUserId?: string | null,
    notes?: string,
  ): Promise<LogicalDisk[]> {
    return this.sequelize.transaction(async (transaction) => {
      const vdev = await this.lockVdev(vdevId, transaction);
      const current = await this.logicalDiskModel.findOne({
        where: { logicalVdevId: vdevId, physicalDriveId },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!current) {
        throw new NotFoundException(
          `Physical drive ${physicalDriveId} is not a member of vdev ${vdevId}`,
        );
      }

      const currentContext = await this.eventContext(
        vdev,
        physicalDriveId,
        transaction,
      );
      await current.destroy({ transaction });
      await this.appendEvent(
        {
          action: VdevMembershipAction.DETACH,
          physicalDriveId,
          logicalVdevId: vdevId,
          fromVdevId: vdevId,
          memberRole: current.memberRole,
          memberIndex: current.memberIndex,
          groupIndex: current.groupIndex,
          osDeviceNodePath: current.osDeviceNodePath,
          performedByUserId: performedByUserId ?? null,
          correlationId: randomUUID(),
          notes: notes ?? null,
          contextMetadata: currentContext,
        },
        transaction,
      );

      return this.getMembers(vdevId);
    });
  }

  async move(
    dto: MoveVdevMembersDto,
    performedByUserId?: string | null,
  ): Promise<LogicalDisk[]> {
    return this.sequelize.transaction(async (transaction) => {
      const driveIds = this.uniqueDriveIds(
        dto.moves.map((move) => move.physicalDriveId),
      );
      if (driveIds.length !== dto.moves.length) {
        throw new ConflictException(
          'A physical drive may appear only once in a move request',
        );
      }

      const snapshotRows = await this.logicalDiskModel.findAll({
        where: { physicalDriveId: driveIds },
        transaction,
        order: [['physicalDriveId', 'ASC']],
      });
      const snapshotByDrive = new Map(
        snapshotRows.map((row) => [row.physicalDriveId, row]),
      );
      const missing = driveIds.filter((id) => !snapshotByDrive.has(id));
      if (missing.length > 0) {
        throw new NotFoundException(
          `Physical drive(s) ${missing.join(', ')} are not assigned to a vdev`,
        );
      }

      const targetIds = this.uniqueDriveIds(
        dto.moves.map((move) => move.targetVdevId),
      );
      const sourceVdevIds = [
        ...new Set(snapshotRows.map((row) => row.logicalVdevId)),
      ];
      const allVdevIds = [...new Set([...targetIds, ...sourceVdevIds])].sort();
      const lockedVdevs = await this.lockVdevs(allVdevIds, transaction);
      const vdevById = new Map(lockedVdevs.map((vdev) => [vdev.id, vdev]));
      const targetById = new Map(
        targetIds
          .filter((id) => vdevById.has(id))
          .map((id) => [id, vdevById.get(id)!]),
      );
      const missingTargets = targetIds.filter((id) => !targetById.has(id));
      if (missingTargets.length > 0) {
        throw new NotFoundException(
          `Logical vdev(s) ${missingTargets.join(', ')} not found`,
        );
      }

      const sourceById = new Map(
        sourceVdevIds
          .filter((id) => vdevById.has(id))
          .map((id) => [id, vdevById.get(id)!]),
      );

      await this.lockDrivesAndCurrent(driveIds, transaction);
      await this.assertDrivesNotTerminal(driveIds, transaction);
      for (const move of dto.moves) {
        const target = targetById.get(move.targetVdevId);
        if (target) {
          this.assertSpareRoles(target, [
            {
              physicalDriveId: move.physicalDriveId,
              memberRole:
                move.memberRole ??
                snapshotByDrive.get(move.physicalDriveId)?.memberRole,
            },
          ]);
        }
      }
      const currentRows = await this.logicalDiskModel.findAll({
        where: { physicalDriveId: driveIds },
        transaction,
        lock: transaction.LOCK.UPDATE,
        order: [['physicalDriveId', 'ASC']],
      });
      const currentByDrive = new Map(
        currentRows.map((row) => [row.physicalDriveId, row]),
      );
      const changedSource = currentRows.find(
        (row) => !sourceById.has(row.logicalVdevId),
      );
      if (changedSource) {
        throw new ConflictException(
          `Physical drive ${changedSource.physicalDriveId} changed vdev concurrently; retry the move`,
        );
      }

      const sourcePoolIds = new Set(
        [...sourceById.values()].map((vdev) => vdev.storagePoolId),
      );
      const targetPoolIds = new Set(
        [...targetById.values()].map((vdev) => vdev.storagePoolId),
      );
      const pools: string[] = [
        ...new Set<string>([...sourcePoolIds, ...targetPoolIds]),
      ];
      const host = await this.sharedHost(pools, transaction);

      const targetCounts = new Map<string, number>();
      for (const move of dto.moves) {
        const target = targetById.get(move.targetVdevId);
        if (!target) continue;
        targetCounts.set(
          move.targetVdevId,
          (targetCounts.get(move.targetVdevId) ?? 0) + 1,
        );
      }
      const targetMemberRows = await this.logicalDiskModel.findAll({
        where: { logicalVdevId: [...targetCounts.keys()] },
        attributes: ['logicalVdevId', 'memberIndex'],
        transaction,
      });
      const nextIndexByTarget = new Map<string, number>();
      for (const row of targetMemberRows) {
        nextIndexByTarget.set(
          row.logicalVdevId,
          Math.max(
            nextIndexByTarget.get(row.logicalVdevId) ?? -1,
            row.memberIndex,
          ),
        );
      }
      for (const targetId of targetCounts.keys()) {
        nextIndexByTarget.set(
          targetId,
          (nextIndexByTarget.get(targetId) ?? -1) + 1,
        );
      }

      for (const [targetId, incoming] of targetCounts) {
        const target = targetById.get(targetId)!;
        const profile = target.redundancyProfile;
        const currentCount = await this.logicalDiskModel.count({
          where: { logicalVdevId: targetId },
          transaction,
        });
        const outgoing = dto.moves.filter(
          (move) =>
            currentByDrive.get(move.physicalDriveId)?.logicalVdevId ===
            targetId,
        ).length;
        if (
          profile?.maxMembers != null &&
          currentCount + incoming - outgoing > profile.maxMembers
        ) {
          throw new ConflictException(
            `Vdev ${targetId} accepts at most ${profile.maxMembers} members`,
          );
        }
      }

      await Promise.all(
        [...new Set(dto.moves.map((move) => move.targetVdevId))].map(
          (targetVdevId) => {
            const target = targetById.get(targetVdevId)!;
            return this.assertAccessible(
              target,
              dto.moves
                .filter((move) => move.targetVdevId === targetVdevId)
                .map((move) => move.physicalDriveId),
              transaction,
            );
          },
        ),
      );

      const correlationId = randomUUID();
      for (const move of dto.moves) {
        const current = currentByDrive.get(move.physicalDriveId)!;
        const source = sourceById.get(current.logicalVdevId)!;
        const target = targetById.get(move.targetVdevId)!;
        const fromVdevId = current.logicalVdevId;
        const role = move.memberRole ?? current.memberRole;
        const devicePath =
          move.osDeviceNodePath !== undefined
            ? move.osDeviceNodePath
            : current.osDeviceNodePath;
        const memberIndex =
          move.memberIndex ?? nextIndexByTarget.get(target.id) ?? 0;
        nextIndexByTarget.set(target.id, memberIndex + 1);
        const groupIndex =
          move.groupIndex ??
          this.groupIndexFor(target.redundancyProfile, memberIndex);

        await current.update(
          {
            logicalVdevId: target.id,
            osDeviceNodePath: devicePath,
            memberRole: role,
            memberIndex,
            groupIndex,
            attachedAt: new Date(),
          },
          { transaction },
        );

        await this.appendEvent(
          {
            action:
              fromVdevId === target.id
                ? VdevMembershipAction.UPDATE
                : VdevMembershipAction.MOVE,
            physicalDriveId: move.physicalDriveId,
            logicalVdevId: target.id,
            fromVdevId,
            toVdevId: target.id,
            memberRole: role,
            memberIndex,
            groupIndex,
            osDeviceNodePath: devicePath,
            performedByUserId: performedByUserId ?? null,
            correlationId,
            notes: dto.reason ?? null,
            contextMetadata: {
              source: await this.eventContext(
                source,
                move.physicalDriveId,
                transaction,
              ),
              target: await this.eventContext(
                target,
                move.physicalDriveId,
                transaction,
              ),
              hostType: host.type,
              hostServerId: host.serverId,
            },
          },
          transaction,
        );
      }

      return this.logicalDiskModel.findAll({
        where: { physicalDriveId: driveIds },
        include: [PhysicalDrive],
        order: MEMBER_ORDER,
        transaction,
      });
    });
  }

  async saveLayout(
    storagePoolId: string,
    dto: SaveVdevLayoutDto,
    performedByUserId?: string | null,
  ): Promise<LogicalDisk[]> {
    return this.sequelize.transaction(async (transaction) => {
      const vdevIds = this.uniqueDriveIds(
        dto.vdevs.map((layout) => layout.vdevId),
      );
      const vdevs = await this.lockVdevs(vdevIds, transaction);
      if (vdevs.length !== vdevIds.length) {
        throw new NotFoundException('One or more vdevs were not found');
      }
      if (vdevs.some((vdev) => vdev.storagePoolId !== storagePoolId)) {
        throw new BadRequestException(
          'Every vdev in the layout must belong to the target storage pool',
        );
      }

      const desired: Array<{
        vdevId: string;
        physicalDriveId: string;
        osDeviceNodePath?: string | null;
        memberRole?: VdevMemberRole;
        memberIndex?: number;
        groupIndex?: number;
      }> = [];
      const desiredDriveIds = new Set<string>();
      for (const layout of dto.vdevs) {
        for (const member of layout.members) {
          if (desiredDriveIds.has(member.physicalDriveId)) {
            throw new ConflictException(
              `Physical drive ${member.physicalDriveId} appears in more than one vdev`,
            );
          }
          desiredDriveIds.add(member.physicalDriveId);
          desired.push({
            vdevId: layout.vdevId,
            physicalDriveId: member.physicalDriveId,
            osDeviceNodePath: member.osDeviceNodePath,
            memberRole: member.memberRole,
            memberIndex: member.memberIndex,
            groupIndex: member.groupIndex,
          });
        }
      }

      await Promise.all(
        vdevs.map((vdev) =>
          this.assertAccessible(
            vdev,
            desired
              .filter((entry) => entry.vdevId === vdev.id)
              .map((entry) => entry.physicalDriveId),
            transaction,
          ),
        ),
      );

      await this.lockDrivesAndCurrent([...desiredDriveIds], transaction);
      const elsewhere = await this.logicalDiskModel.findAll({
        where: {
          physicalDriveId: [...desiredDriveIds],
          logicalVdevId: { [Op.notIn]: vdevIds },
        },
        attributes: ['physicalDriveId', 'logicalVdevId'],
        transaction,
      });
      if (elsewhere.length > 0) {
        throw new ConflictException(
          `Physical drive(s) ${elsewhere
            .map((row) => row.physicalDriveId)
            .join(
              ', ',
            )} are assigned to vdevs outside this pool; use the vdev move operation`,
        );
      }

      for (const vdev of vdevs) {
        const profile = vdev.redundancyProfile;
        const entries = desired.filter((entry) => entry.vdevId === vdev.id);
        this.assertSpareRoles(
          vdev,
          entries.map((entry) => ({
            physicalDriveId: entry.physicalDriveId,
            memberRole: entry.memberRole,
          })),
        );
        const count = entries.length;
        if (profile?.maxMembers != null && count > profile.maxMembers) {
          throw new ConflictException(
            `Vdev ${vdev.id} accepts at most ${profile.maxMembers} members`,
          );
        }
      }

      const current = await this.logicalDiskModel.findAll({
        where: { logicalVdevId: vdevIds },
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      const currentByDrive = new Map(
        current.map((row) => [row.physicalDriveId, row]),
      );
      await this.assertDrivesNotTerminal(
        [...desiredDriveIds].filter((id) => !currentByDrive.has(id)),
        transaction,
      );
      const desiredByDrive = new Map(
        desired.map((entry) => [entry.physicalDriveId, entry]),
      );

      const correlationId = randomUUID();
      const vdevById = new Map(vdevs.map((vdev) => [vdev.id, vdev]));
      const nextIndexByVdev = new Map<string, number>();
      const toRemove = current.filter(
        (row) => !desiredByDrive.has(row.physicalDriveId),
      );
      for (const row of toRemove) {
        const sourceVdev = vdevById.get(row.logicalVdevId);
        const context = sourceVdev
          ? await this.eventContext(
              sourceVdev,
              row.physicalDriveId,
              transaction,
            )
          : null;
        await row.destroy({ transaction });
        await this.appendEvent(
          {
            action: VdevMembershipAction.DETACH,
            physicalDriveId: row.physicalDriveId,
            logicalVdevId: row.logicalVdevId,
            fromVdevId: row.logicalVdevId,
            memberRole: row.memberRole,
            memberIndex: row.memberIndex,
            groupIndex: row.groupIndex,
            osDeviceNodePath: row.osDeviceNodePath,
            performedByUserId: performedByUserId ?? null,
            correlationId,
            notes: dto.notes ?? null,
            contextMetadata: context,
          },
          transaction,
        );
      }

      for (const entry of desired) {
        const existing = currentByDrive.get(entry.physicalDriveId);
        const role =
          entry.memberRole ?? existing?.memberRole ?? VdevMemberRole.DATA;
        const memberIndex =
          entry.memberIndex ?? nextIndexByVdev.get(entry.vdevId) ?? 0;
        nextIndexByVdev.set(entry.vdevId, memberIndex + 1);
        const groupIndex =
          entry.groupIndex ??
          this.groupIndexFor(
            vdevById.get(entry.vdevId)?.redundancyProfile,
            memberIndex,
          );
        if (!existing) {
          await this.ensureDriveExists(entry.physicalDriveId, transaction);
          await this.logicalDiskModel.create(
            {
              logicalVdevId: entry.vdevId,
              physicalDriveId: entry.physicalDriveId,
              osDeviceNodePath: entry.osDeviceNodePath ?? null,
              memberRole: role,
              memberIndex,
              groupIndex,
              attachedAt: new Date(),
            } as Partial<LogicalDisk>,
            { transaction },
          );
          await this.appendEvent(
            {
              action: VdevMembershipAction.ATTACH,
              physicalDriveId: entry.physicalDriveId,
              logicalVdevId: entry.vdevId,
              toVdevId: entry.vdevId,
              memberRole: role,
              memberIndex,
              groupIndex,
              osDeviceNodePath: entry.osDeviceNodePath ?? null,
              performedByUserId: performedByUserId ?? null,
              correlationId,
              notes: dto.notes ?? null,
              contextMetadata: await this.eventContext(
                vdevById.get(entry.vdevId)!,
                entry.physicalDriveId,
                transaction,
              ),
            },
            transaction,
          );
          continue;
        }

        const nextPath =
          entry.osDeviceNodePath !== undefined
            ? entry.osDeviceNodePath
            : existing.osDeviceNodePath;
        const changed =
          existing.logicalVdevId !== entry.vdevId ||
          existing.osDeviceNodePath !== nextPath ||
          existing.memberRole !== role ||
          existing.memberIndex !== memberIndex ||
          existing.groupIndex !== groupIndex;
        if (!changed) continue;

        const fromVdevId = existing.logicalVdevId;
        const isMove = existing.logicalVdevId !== entry.vdevId;
        await existing.update(
          {
            logicalVdevId: entry.vdevId,
            osDeviceNodePath: nextPath,
            memberRole: role,
            memberIndex,
            groupIndex,
            attachedAt: new Date(),
          },
          { transaction },
        );
        const sourceVdev = vdevById.get(fromVdevId);
        const targetVdev = vdevById.get(entry.vdevId)!;
        await this.appendEvent(
          {
            action: isMove
              ? VdevMembershipAction.MOVE
              : VdevMembershipAction.UPDATE,
            physicalDriveId: entry.physicalDriveId,
            logicalVdevId: entry.vdevId,
            fromVdevId,
            toVdevId: entry.vdevId,
            memberRole: role,
            memberIndex,
            groupIndex,
            osDeviceNodePath: nextPath,
            performedByUserId: performedByUserId ?? null,
            correlationId,
            notes: dto.notes ?? null,
            contextMetadata: {
              source: sourceVdev
                ? await this.eventContext(
                    sourceVdev,
                    entry.physicalDriveId,
                    transaction,
                  )
                : null,
              target: await this.eventContext(
                targetVdev,
                entry.physicalDriveId,
                transaction,
              ),
            },
          },
          transaction,
        );
      }

      return this.logicalDiskModel.findAll({
        where: { logicalVdevId: vdevIds },
        include: [PhysicalDrive],
        order: MEMBER_ORDER,
        transaction,
      });
    });
  }

  private async appendEvent(
    data: {
      action: VdevMembershipAction;
      physicalDriveId: string;
      logicalVdevId: string;
      fromVdevId?: string | null;
      toVdevId?: string | null;
      memberRole: VdevMemberRole;
      memberIndex?: number | null;
      groupIndex?: number | null;
      osDeviceNodePath: string | null;
      performedByUserId: string | null;
      correlationId: string;
      notes?: string | null;
      contextMetadata?: Record<string, unknown> | null;
    },
    transaction: Transaction,
  ): Promise<void> {
    await this.eventModel.create(
      {
        action: data.action,
        physicalDriveId: data.physicalDriveId,
        logicalVdevId: data.logicalVdevId,
        fromVdevId: data.fromVdevId ?? null,
        toVdevId: data.toVdevId ?? null,
        memberRole: data.memberRole,
        memberIndex: data.memberIndex ?? null,
        groupIndex: data.groupIndex ?? null,
        osDeviceNodePath: data.osDeviceNodePath,
        eventTimestamp: new Date(),
        performedByUserId: data.performedByUserId,
        correlationId: data.correlationId,
        notes: data.notes ?? null,
        contextMetadata: data.contextMetadata ?? null,
      } as Partial<LogicalDiskEvent>,
      { transaction },
    );
  }

  private groupIndexFor(
    profile: VdevProfile | undefined,
    memberIndex: number,
  ): number | null {
    if (!profile || profile.capacityMode !== VdevCapacityMode.MIRROR_GROUPS)
      return null;
    return Math.floor(memberIndex / Math.max(2, profile.mirrorCopies || 2));
  }

  private async eventContext(
    vdev: LogicalVdev,
    physicalDriveId: string,
    transaction: Transaction,
  ): Promise<Record<string, unknown>> {
    const [pool, host, drive] = await Promise.all([
      this.storagePoolModel.findByPk(vdev.storagePoolId, { transaction }),
      this.topology.getCurrentHost(vdev.storagePoolId, transaction),
      this.physicalDriveModel.findByPk(physicalDriveId, {
        transaction,
        include: [{ model: DriveModel, include: [Capacity] }],
      }),
    ]);
    const capacity = drive?.driveModel?.capacity;
    return {
      storagePoolId: vdev.storagePoolId,
      storagePoolName: pool?.poolName ?? null,
      vdevId: vdev.id,
      vdevName: vdev.vdevName,
      vdevClass: vdev.vdevClass,
      hostType: host?.type ?? null,
      hostServerId: host?.serverId ?? null,
      hostHostname: host?.hostname ?? null,
      driveCapacityBytes: capacity?.absoluteCapacity ?? null,
    };
  }

  private assertSpareRoles(
    vdev: LogicalVdev,
    members: Array<{
      physicalDriveId: string;
      memberRole?: VdevMemberRole;
    }>,
  ): void {
    if (vdev.vdevClass === VdevClass.SPARE) return;
    const invalid = members.filter(
      (member) => member.memberRole === VdevMemberRole.SPARE,
    );
    if (invalid.length > 0) {
      throw new ConflictException(
        'Spare drives must be attached to a SPARE-class vdev, not a data vdev',
      );
    }
  }

  private async assertDrivesNotTerminal(
    driveIds: string[],
    transaction: Transaction,
  ): Promise<void> {
    if (driveIds.length === 0) return;
    const lifecycle = await this.lifecycleService.getCurrentLifecycleMap(
      driveIds,
      transaction,
    );
    const terminal = driveIds.filter((driveId) => {
      const state = lifecycle.get(driveId)?.state;
      return state ? isTerminalState(state) : false;
    });
    if (terminal.length > 0) {
      throw new ConflictException(
        `Physical drive(s) ${terminal.join(', ')} are in a terminal lifecycle state and cannot be attached to a vdev`,
      );
    }
  }

  private async lockDrivesAndCurrent(
    driveIds: string[],
    transaction: Transaction,
  ): Promise<void> {
    if (driveIds.length === 0) return;
    await this.physicalDriveModel.findAll({
      where: { id: driveIds },
      order: [['id', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    await this.logicalDiskModel.findAll({
      where: { physicalDriveId: driveIds },
      order: [['physicalDriveId', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
  }

  private async vdevModelOrThrow(
    id: string,
    transaction?: Transaction,
  ): Promise<LogicalVdev> {
    const vdev = await this.logicalVdevModel.findByPk(id, {
      include: [VdevProfile],
      transaction,
    });
    if (!vdev) {
      throw new NotFoundException(`LogicalVdev with ID ${id} not found`);
    }
    return vdev;
  }

  private async lockVdev(
    id: string,
    transaction: Transaction,
  ): Promise<LogicalVdev> {
    const vdev = await this.logicalVdevModel.findByPk(id, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!vdev) {
      throw new NotFoundException(`LogicalVdev with ID ${id} not found`);
    }
    const profile = await this.vdevProfileModel.findByPk(
      vdev.redundancyProfileId,
      { transaction },
    );
    if (!profile) {
      throw new NotFoundException(
        `VdevProfile with ID ${vdev.redundancyProfileId} not found`,
      );
    }
    vdev.setDataValue('redundancyProfile', profile);
    return vdev;
  }

  private async lockVdevs(
    ids: string[],
    transaction: Transaction,
  ): Promise<LogicalVdev[]> {
    const vdevs = await this.logicalVdevModel.findAll({
      where: { id: ids },
      order: [['id', 'ASC']],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const profiles = await this.vdevProfileModel.findAll({
      where: {
        id: [...new Set(vdevs.map((vdev) => vdev.redundancyProfileId))],
      },
      transaction,
    });
    const byId = new Map(profiles.map((profile) => [profile.id, profile]));
    for (const vdev of vdevs) {
      const profile = byId.get(vdev.redundancyProfileId);
      if (profile) vdev.setDataValue('redundancyProfile', profile);
    }
    return vdevs;
  }

  private uniqueDriveIds(ids: string[]): string[] {
    return [...new Set(ids)];
  }

  private async assertAccessible(
    vdev: LogicalVdev,
    driveIds: string[],
    transaction: Transaction,
  ): Promise<void> {
    if (driveIds.length === 0) return;
    const accessible = await this.topology.getAccessibleDriveIds(
      vdev.storagePoolId,
      transaction,
    );
    const missing = driveIds.filter((id) => !accessible.has(id));
    if (missing.length > 0) {
      throw new ConflictException(
        `Physical drive(s) ${missing.join(', ')} are not accessible to the host of storage pool ${vdev.storagePoolId}`,
      );
    }
  }

  private async assertDrivesExist(
    ids: string[],
    transaction: Transaction,
  ): Promise<void> {
    const drives = await this.physicalDriveModel.findAll({
      where: { id: ids },
      attributes: ['id'],
      transaction,
    });
    if (drives.length !== ids.length) {
      const found = new Set(drives.map((drive) => drive.id));
      throw new NotFoundException(
        `Physical drive(s) ${ids.filter((id) => !found.has(id)).join(', ')} not found`,
      );
    }
  }

  private async ensureDriveExists(
    id: string,
    transaction: Transaction,
  ): Promise<void> {
    await this.assertDrivesExist([id], transaction);
  }

  private async assertDriveNotAssigned(
    ids: string[],
    transaction: Transaction,
  ): Promise<void> {
    const existing = await this.logicalDiskModel.findAll({
      where: { physicalDriveId: ids },
      attributes: ['physicalDriveId'],
      transaction,
    });
    if (existing.length > 0) {
      throw new ConflictException(
        `Physical drive(s) ${existing.map((row) => row.physicalDriveId).join(', ')} are already assigned to a vdev`,
      );
    }
  }

  private async sharedHost(
    poolIds: string[],
    transaction: Transaction,
  ): Promise<{ type: 'PHYSICAL' | 'VIRTUAL'; serverId: string }> {
    if (poolIds.length === 0) {
      throw new BadRequestException('No storage pool selected');
    }
    const hosts = await Promise.all(
      poolIds.map((poolId) =>
        this.topology.getCurrentHost(poolId, transaction),
      ),
    );
    const first = hosts[0];
    if (!first) {
      throw new BadRequestException(
        'All source and target pools must be attached to a host',
      );
    }
    for (const host of hosts) {
      if (
        !host ||
        host.type !== first.type ||
        host.serverId !== first.serverId
      ) {
        throw new ConflictException(
          'Vdev members can only move between pools on the same host',
        );
      }
    }
    return { type: first.type, serverId: first.serverId };
  }
}
