import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import { PassthroughSlot } from './entities/passthrough-slot.entity';
import { ServerSlot } from '../physical-server/entities/server-slot.entity';
import { ServerSlotAllocationService } from '../server-slot-allocation/server-slot-allocation.service';

export interface PassthroughSlotInput {
  id?: string;
  serverSlotId: string;
}

@Injectable()
export class PassthroughSlotService {
  constructor(
    @InjectModel(PassthroughSlot)
    private readonly passthroughSlotModel: typeof PassthroughSlot,
    @InjectModel(ServerSlot)
    private readonly serverSlotModel: typeof ServerSlot,
    private readonly slotAllocationService: ServerSlotAllocationService,
  ) {}

  /**
   * Reconciles the full set of passthrough slots belonging to a virtual server.
   *
   * Passthrough slots are owned children of the guest: the caller passes the
   * desired end state and this method computes the diff (removed mappings are
   * deleted, new ones inserted). Every referenced slot must belong to the host
   * physical server and may be mapped to at most one virtual server globally.
   * Runs inside the caller's transaction so the guest and its mappings commit
   * atomically.
   */
  async syncForVirtualServer(
    virtualServerId: string,
    hostServerId: string,
    slots: PassthroughSlotInput[],
    transaction?: Transaction,
  ): Promise<void> {
    // 1. Reject duplicate slot references within the submitted payload.
    const seenSlotIds = new Set<string>();
    for (const slot of slots) {
      if (seenSlotIds.has(slot.serverSlotId)) {
        throw new ConflictException(
          `Duplicate passthrough slot "${slot.serverSlotId}" in request`,
        );
      }
      seenSlotIds.add(slot.serverSlotId);
    }

    const incomingIds = [...seenSlotIds];

    if (incomingIds.length > 0) {
      // 2. Every referenced slot must belong to the (new) host server.
      const hostSlots = await this.serverSlotModel.findAll({
        where: { serverId: hostServerId, id: incomingIds },
        attributes: ['id'],
        transaction,
      });
      const hostSlotIds = new Set(hostSlots.map((slot) => slot.id));
      const notOnHost = incomingIds.filter((id) => !hostSlotIds.has(id));
      if (notOnHost.length > 0) {
        throw new BadRequestException(
          `Server slot(s) ${notOnHost.join(', ')} do not belong to host physical server ${hostServerId}`,
        );
      }

      // 3. A host slot can only be passed through to a single virtual server.
      const conflicts = await this.passthroughSlotModel.findAll({
        where: {
          serverSlotId: incomingIds,
          virtualServerId: { [Op.ne]: virtualServerId },
        },
        attributes: ['serverSlotId'],
        transaction,
      });
      if (conflicts.length > 0) {
        const conflictIds = [
          ...new Set(conflicts.map((row) => row.serverSlotId)),
        ];
        throw new ConflictException(
          `Server slot(s) ${conflictIds.join(', ')} are already passed through to another virtual server`,
        );
      }
    }

    // 4. Diff against the guest's current mappings.
    const existing = await this.passthroughSlotModel.findAll({
      where: { virtualServerId },
      transaction,
    });
    const existingBySlotId = new Map(
      existing.map((row) => [row.serverSlotId, row]),
    );
    const incomingSet = new Set(incomingIds);

    const removed = existing.filter(
      (row) => !incomingSet.has(row.serverSlotId),
    );
    if (removed.length > 0) {
      await this.slotAllocationService.assertSlotDrivesNotVdevMembers(
        removed.map((row) => row.serverSlotId),
        transaction,
      );
      await this.passthroughSlotModel.destroy({
        where: { id: removed.map((row) => row.id) },
        transaction,
      });
    }

    for (const slot of slots) {
      if (existingBySlotId.has(slot.serverSlotId)) {
        continue;
      }
      const createData: Partial<PassthroughSlot> = {
        virtualServerId,
        serverSlotId: slot.serverSlotId,
      };
      if (slot.id) {
        createData.id = slot.id;
      }
      await this.passthroughSlotModel.create(createData, { transaction });
    }
  }
}
