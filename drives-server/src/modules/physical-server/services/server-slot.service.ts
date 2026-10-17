import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { ServerSlot } from '../entities/server-slot.entity';
import { Interface } from '../../interface/entities/interface.entity';

export interface ServerSlotSyncInput {
  id?: string;
  slotLabel: string;
  supportedInterfaceId: string;
  pcieBusAddress?: string | null;
}

@Injectable()
export class ServerSlotService {
  constructor(
    @InjectModel(ServerSlot)
    private readonly serverSlotModel: typeof ServerSlot,
    @InjectModel(Interface)
    private readonly interfaceModel: typeof Interface,
  ) {}

  /**
   * Reconciles the full set of slots belonging to a single physical server.
   *
   * Slots are owned children of a server, so the caller (physical server
   * create/update) passes the desired end state and this method computes the
   * diff: removed slots are deleted, known slots are updated and new slots are
   * inserted. Runs inside the caller's transaction so the server and its slots
   * are committed atomically.
   */
  async syncForServer(
    serverId: string,
    slots: ServerSlotSyncInput[],
    transaction?: Transaction,
  ): Promise<void> {
    // 1. Reject duplicate labels within the submitted payload up front.
    const seenLabels = new Set<string>();
    for (const slot of slots) {
      if (seenLabels.has(slot.slotLabel)) {
        throw new ConflictException(
          `Duplicate slot label "${slot.slotLabel}" in request`,
        );
      }
      seenLabels.add(slot.slotLabel);
    }

    // 2. Ensure every referenced interface exists before touching any row.
    const interfaceIds = [...new Set(slots.map((s) => s.supportedInterfaceId))];
    if (interfaceIds.length > 0) {
      const foundInterfaces = await this.interfaceModel.findAll({
        where: { id: interfaceIds },
        attributes: ['id'],
        transaction,
      });
      const foundIds = new Set(foundInterfaces.map((i) => i.id));
      const missing = interfaceIds.filter((id) => !foundIds.has(id));
      if (missing.length > 0) {
        throw new NotFoundException(
          `Interface with ID ${missing.join(', ')} not found`,
        );
      }
    }

    // 3. Diff against the server's current slots.
    const existingSlots = await this.serverSlotModel.findAll({
      where: { serverId },
      transaction,
    });
    const existingById = new Map(existingSlots.map((s) => [s.id, s]));
    const incomingIds = new Set(
      slots.map((s) => s.id).filter((id): id is string => Boolean(id)),
    );

    for (const slot of slots) {
      const clash = existingSlots.find(
        (s) => s.slotLabel === slot.slotLabel && s.id !== slot.id,
      );
      if (clash) {
        throw new ConflictException(
          `ServerSlot with label "${slot.slotLabel}" already exists on physical server ${serverId}`,
        );
      }
    }

    const removedIds = existingSlots
      .filter((s) => !incomingIds.has(s.id))
      .map((s) => s.id);
    if (removedIds.length > 0) {
      await this.serverSlotModel.destroy({
        where: { id: removedIds },
        transaction,
      });
    }

    for (const slot of slots) {
      const payload = {
        slotLabel: slot.slotLabel,
        supportedInterfaceId: slot.supportedInterfaceId,
        pcieBusAddress: slot.pcieBusAddress ?? null,
      };
      const current = slot.id ? existingById.get(slot.id) : undefined;

      if (current) {
        await current.update(payload, { transaction });
      } else {
        const createData: Partial<ServerSlot> = { ...payload, serverId };
        if (slot.id) {
          createData.id = slot.id;
        }
        await this.serverSlotModel.create(createData, { transaction });
      }
    }
  }
}
