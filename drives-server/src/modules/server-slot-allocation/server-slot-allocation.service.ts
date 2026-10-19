import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';
import { Op, Transaction } from 'sequelize';
import {
  ServerSlotAllocation,
  ServerSlotActionType,
} from './entities/server-slot-allocation.entity';
import { ServerSlot } from '../physical-server/entities/server-slot.entity';
import { PhysicalServer } from '../physical-server/entities/physical-server.entity';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { PhysicalDriveLocation } from '../physical-drive/entities/physical-drive-location.entity';
import { DriveModel } from '../drive-model/entities/drive-model.entity';
import { Rack } from '../rack/entities/rack.entity';
import { Datacenter } from '../datacenter/entities/datacenter.entity';
import { User } from '../user/entities/user.entity';
import { QueryServerSlotAllocationDto } from './dto/query-server-slot-allocation.dto';
import {
  AllocateDrivesDto,
  DetachedDriveStateDto,
  UNSEATED_DRIVE_LIFECYCLE_EVENTS,
} from './dto/allocate-drives.dto';
import {
  DriveLifecycleEventService,
  type CurrentDriveLifecycle,
} from '../drive-lifecycle-event/drive-lifecycle-event.service';
import {
  DriveLifecycleEventType,
  DriveLifecycleState,
} from '../drive-lifecycle-event/entities/drive-lifecycle-event.entity';
import { PaginationService } from '../pagination/pagination.service';
import { PaginatedResponse } from '../pagination/interfaces/paginated-response';

// Derived "where is this drive right now" projection. `null` means the drive's
// latest ledger event is an UNMOUNT (or there are no events at all), i.e. it is
// not seated in any slot.
export interface CurrentAssignment {
  allocationId: string;
  slotId: string;
  slotLabel: string;
  serverId: string;
  serverHostname: string;
  assignedAt: Date;
}

// Derived "what drive sits in this slot right now" projection.
export interface CurrentSlotOccupant {
  allocationId: string;
  physicalDriveId: string;
  driveLabel: string;
  serialNumber: string;
  driveModelId: string;
  driveModelName: string | null;
  assignedAt: Date;
}

export interface SlotAssignmentBoardSlot {
  id: string;
  slotLabel: string;
  pcieBusAddress: string | null;
  supportedInterfaceId: string;
  occupancy: CurrentSlotOccupant | null;
}

export interface SlotAssignmentBoardDrive {
  id: string;
  label: string;
  serialNumber: string;
  driveModelId: string;
  driveModelName: string | null;
}

export interface SlotAssignmentBoard {
  server: {
    id: string;
    hostname: string;
    rackId: string;
    rackName: string | null;
    datacenterId: string;
    datacenterCode: string;
    datacenterName: string;
  };
  slots: SlotAssignmentBoardSlot[];
  freeDrives: SlotAssignmentBoardDrive[];
  summary: {
    totalSlots: number;
    occupiedSlots: number;
    emptySlots: number;
    freeDrives: number;
  };
}

// Result of the Drive Allocation workflow: refreshed boards plus the exact
// drives that were unseated/seated by the transaction.
export interface DriveAllocationResult {
  source: SlotAssignmentBoard | null;
  target: SlotAssignmentBoard | null;
  unmountedDriveIds: string[];
  mountedDriveIds: string[];
}

// Derived "which server/slot is this drive seated in right now" projection.
export interface DriveCurrentAssignment {
  allocationId: string;
  slotId: string;
  slotLabel: string;
  serverId: string;
  serverHostname: string;
  assignedAt: Date;
}

@Injectable()
export class ServerSlotAllocationService {
  constructor(
    @InjectModel(ServerSlotAllocation)
    private readonly allocationModel: typeof ServerSlotAllocation,
    @InjectModel(ServerSlot)
    private readonly serverSlotModel: typeof ServerSlot,
    @InjectModel(PhysicalServer)
    private readonly physicalServerModel: typeof PhysicalServer,
    @InjectModel(PhysicalDrive)
    private readonly physicalDriveModel: typeof PhysicalDrive,
    @InjectModel(PhysicalDriveLocation)
    private readonly physicalDriveLocationModel: typeof PhysicalDriveLocation,
    private readonly lifecycleService: DriveLifecycleEventService,
    private readonly paginationService: PaginationService,
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  // --- Read-only ledger access -------------------------------------------------

  async findAll(
    query?: QueryServerSlotAllocationDto,
  ): Promise<PaginatedResponse<ServerSlotAllocation>> {
    return this.paginationService.paginate<ServerSlotAllocation>(
      this.allocationModel,
      query,
      { include: [ServerSlot, PhysicalDrive, User] },
    );
  }

  async findOne(id: string): Promise<ServerSlotAllocation | null> {
    const allocation = await this.allocationModel.findByPk(id, {
      include: [
        { model: ServerSlot, include: [PhysicalServer] },
        { model: PhysicalDrive, include: [DriveModel] },
        User,
      ],
    });

    if (!allocation) {
      throw new NotFoundException(
        `ServerSlotAllocation with ID ${id} not found`,
      );
    }

    return allocation;
  }

  // --- Derivation helpers ------------------------------------------------------

  // Latest ledger row per key (drive or slot). `key-first` ordering lets us
  // reduce the first row seen for each key to its current event.
  private async getLatestEventPerKey(
    keyField: 'physicalDriveId' | 'serverSlotId',
    ids: string[],
    transaction?: Transaction,
  ): Promise<Map<string, ServerSlotAllocation>> {
    const map = new Map<string, ServerSlotAllocation>();
    if (ids.length === 0) {
      return map;
    }

    const events = await this.allocationModel.findAll({
      where: { [keyField]: { [Op.in]: ids } },
      order: [
        [keyField, 'ASC'],
        ['timestamp', 'DESC'],
        ['displayKey', 'DESC'],
      ],
      transaction,
    });

    for (const event of events) {
      const key = event[keyField];
      if (!map.has(key)) {
        map.set(key, event);
      }
    }

    return map;
  }

  // Latest location event per drive, used for the datacenter eligibility rule.
  private async getLatestLocationPerDrive(
    driveIds: string[],
    transaction?: Transaction,
  ): Promise<Map<string, PhysicalDriveLocation>> {
    const map = new Map<string, PhysicalDriveLocation>();
    if (driveIds.length === 0) {
      return map;
    }

    const events = await this.physicalDriveLocationModel.findAll({
      where: { physicalDriveId: { [Op.in]: driveIds } },
      order: [
        ['physicalDriveId', 'ASC'],
        ['locatedAt', 'DESC'],
        ['displayKey', 'DESC'],
      ],
      transaction,
    });

    for (const event of events) {
      if (!map.has(event.physicalDriveId)) {
        map.set(event.physicalDriveId, event);
      }
    }

    return map;
  }

  // Resolves the datacenter a server belongs to (server -> rack -> datacenter).
  private async resolveServerDatacenter(
    serverId: string,
    transaction?: Transaction,
  ): Promise<{ server: PhysicalServer; datacenter: Datacenter } | null> {
    const server = await this.physicalServerModel.findByPk(serverId, {
      include: [{ model: Rack, include: [Datacenter] }],
      transaction,
    });
    if (!server) {
      return null;
    }

    const datacenter = server.rack?.datacenter;
    if (!datacenter) {
      return null;
    }

    return { server, datacenter };
  }

  // Derives the current occupant of each slot (null when the latest event is an
  // UNMOUNT or the slot has never been touched).
  private async getSlotOccupancyMap(
    slotIds: string[],
    transaction?: Transaction,
  ): Promise<Map<string, CurrentSlotOccupant | null>> {
    const map = new Map<string, CurrentSlotOccupant | null>();
    const latest = await this.getLatestEventPerKey(
      'serverSlotId',
      slotIds,
      transaction,
    );

    const mountEvents = [...latest.values()].filter(
      (event) => event.actionType === ServerSlotActionType.MOUNT,
    );
    const driveIds = [...new Set(mountEvents.map((e) => e.physicalDriveId))];
    const drives =
      driveIds.length > 0
        ? await this.physicalDriveModel.findAll({
            where: { id: { [Op.in]: driveIds } },
            include: [DriveModel],
            transaction,
          })
        : [];
    const driveById = new Map(drives.map((drive) => [drive.id, drive]));

    for (const slotId of slotIds) {
      const event = latest.get(slotId);
      if (!event || event.actionType !== ServerSlotActionType.MOUNT) {
        map.set(slotId, null);
        continue;
      }

      const drive = driveById.get(event.physicalDriveId);
      map.set(slotId, {
        allocationId: event.id,
        physicalDriveId: event.physicalDriveId,
        driveLabel: drive?.label ?? '',
        serialNumber: drive?.serialNumber ?? '',
        driveModelId: drive?.driveModelId ?? '',
        driveModelName: drive?.driveModel?.name ?? null,
        assignedAt: event.timestamp,
      });
    }

    return map;
  }

  // Every drive whose current (latest) location event points at `datacenterId`.
  private async getDriveIdsInDatacenter(
    datacenterId: string,
    transaction?: Transaction,
  ): Promise<string[]> {
    const events = await this.physicalDriveLocationModel.findAll({
      attributes: [
        'physicalDriveId',
        'datacenterId',
        'locatedAt',
        'displayKey',
      ],
      order: [
        ['physicalDriveId', 'ASC'],
        ['locatedAt', 'DESC'],
        ['displayKey', 'DESC'],
      ],
      transaction,
    });

    const latestByDrive = new Map<string, string>();
    for (const event of events) {
      if (!latestByDrive.has(event.physicalDriveId)) {
        latestByDrive.set(event.physicalDriveId, event.datacenterId);
      }
    }

    return [...latestByDrive.entries()]
      .filter(([, dcId]) => dcId === datacenterId)
      .map(([driveId]) => driveId);
  }

  // Drives that are in the datacenter and not currently seated in any slot.
  private async getFreeDrivesInDatacenter(
    datacenterId: string,
    transaction?: Transaction,
  ): Promise<SlotAssignmentBoardDrive[]> {
    const inDatacenter = await this.getDriveIdsInDatacenter(
      datacenterId,
      transaction,
    );
    if (inDatacenter.length === 0) {
      return [];
    }

    const latest = await this.getLatestEventPerKey(
      'physicalDriveId',
      inDatacenter,
      transaction,
    );
    const freeIds = inDatacenter.filter((driveId) => {
      const event = latest.get(driveId);
      return !event || event.actionType !== ServerSlotActionType.MOUNT;
    });
    if (freeIds.length === 0) {
      return [];
    }

    const drives = await this.physicalDriveModel.findAll({
      where: { id: { [Op.in]: freeIds } },
      include: [DriveModel],
      order: [['label', 'ASC']],
      transaction,
    });

    return drives.map((drive) => ({
      id: drive.id,
      label: drive.label,
      serialNumber: drive.serialNumber,
      driveModelId: drive.driveModelId,
      driveModelName: drive.driveModel?.name ?? null,
    }));
  }

  // --- Board -------------------------------------------------------------------

  async getBoard(serverId: string): Promise<SlotAssignmentBoard> {
    const resolved = await this.resolveServerDatacenter(serverId);
    if (!resolved) {
      throw new NotFoundException(
        `PhysicalServer with ID ${serverId} not found`,
      );
    }
    const { server, datacenter } = resolved;

    const slots = await this.serverSlotModel.findAll({
      where: { serverId },
      order: [
        ['supportedInterfaceId', 'ASC'],
        ['slotLabel', 'ASC'],
      ],
    });
    const occupancy = await this.getSlotOccupancyMap(slots.map((s) => s.id));
    const freeDrives = await this.getFreeDrivesInDatacenter(datacenter.id);

    const boardSlots: SlotAssignmentBoardSlot[] = slots.map((slot) => ({
      id: slot.id,
      slotLabel: slot.slotLabel,
      pcieBusAddress: slot.pcieBusAddress ?? null,
      supportedInterfaceId: slot.supportedInterfaceId,
      occupancy: occupancy.get(slot.id) ?? null,
    }));

    const occupiedSlots = boardSlots.filter((slot) => slot.occupancy).length;

    return {
      server: {
        id: server.id,
        hostname: server.hostname,
        rackId: server.rackId,
        rackName: server.rack?.name ?? null,
        datacenterId: datacenter.id,
        datacenterCode: datacenter.code,
        datacenterName: datacenter.name,
      },
      slots: boardSlots,
      freeDrives,
      summary: {
        totalSlots: boardSlots.length,
        occupiedSlots,
        emptySlots: boardSlots.length - occupiedSlots,
        freeDrives: freeDrives.length,
      },
    };
  }

  // Batched "which server/slot is each drive seated in right now" derivation.
  // Drives whose latest event is an UNMOUNT (or that have no events) are absent
  // from the returned map.
  async getCurrentAssignmentsForDrives(
    driveIds: string[],
    transaction?: Transaction,
  ): Promise<Map<string, DriveCurrentAssignment>> {
    const map = new Map<string, DriveCurrentAssignment>();
    if (driveIds.length === 0) {
      return map;
    }

    const latest = await this.getLatestEventPerKey(
      'physicalDriveId',
      driveIds,
      transaction,
    );
    const slotIds = [
      ...new Set(
        [...latest.values()]
          .filter((event) => event.actionType === ServerSlotActionType.MOUNT)
          .map((event) => event.serverSlotId),
      ),
    ];
    if (slotIds.length === 0) {
      return map;
    }

    const slots = await this.serverSlotModel.findAll({
      where: { id: { [Op.in]: slotIds } },
      include: [PhysicalServer],
      transaction,
    });
    const slotById = new Map(slots.map((slot) => [slot.id, slot]));

    for (const driveId of driveIds) {
      const event = latest.get(driveId);
      if (!event || event.actionType !== ServerSlotActionType.MOUNT) {
        continue;
      }
      const slot = slotById.get(event.serverSlotId);
      if (!slot) {
        continue;
      }
      map.set(driveId, {
        allocationId: event.id,
        slotId: slot.id,
        slotLabel: slot.slotLabel,
        serverId: slot.serverId,
        serverHostname: slot.server?.hostname ?? '',
        assignedAt: event.timestamp,
      });
    }

    return map;
  }

  // --- Writes (append-only) ----------------------------------------------------
  private appendEvent(
    data: {
      actionType: ServerSlotActionType;
      serverSlotId: string;
      physicalDriveId: string;
      userId: string;
      timestamp?: Date;
    },
    transaction: Transaction,
  ): Promise<ServerSlotAllocation> {
    return this.allocationModel.create(
      {
        actionType: data.actionType,
        serverSlotId: data.serverSlotId,
        physicalDriveId: data.physicalDriveId,
        userId: data.userId,
        timestamp: data.timestamp ?? new Date(),
      },
      { transaction },
    );
  }

  /**
   * Seats a drive into a slot.
   *
   * Business rules:
   *  - the slot must belong to the addressed server;
   *  - the drive must have a recorded current location in the SAME datacenter
   *    as the server (server -> rack -> datacenter);
   *  - a slot holds at most one drive (mounting into an occupied slot is 409);
   *  - a drive occupies at most one slot: if it is currently mounted elsewhere
   *    the move is recorded as UNMOUNT(old) + MOUNT(new) in one transaction.
   */
  async mount(
    serverId: string,
    slotId: string,
    physicalDriveId: string,
    actorId: string,
  ): Promise<SlotAssignmentBoard> {
    await this.sequelize.transaction(async (transaction) => {
      const slot = await this.serverSlotModel.findByPk(slotId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!slot) {
        throw new NotFoundException(`ServerSlot with ID ${slotId} not found`);
      }
      if (slot.serverId !== serverId) {
        throw new BadRequestException(
          `ServerSlot ${slotId} does not belong to physical server ${serverId}`,
        );
      }

      const resolved = await this.resolveServerDatacenter(
        serverId,
        transaction,
      );
      if (!resolved) {
        throw new NotFoundException(
          `PhysicalServer with ID ${serverId} not found`,
        );
      }
      const { datacenter } = resolved;

      const drive = await this.physicalDriveModel.findByPk(physicalDriveId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!drive) {
        throw new NotFoundException(
          `PhysicalDrive with ID ${physicalDriveId} not found`,
        );
      }

      const location = (
        await this.getLatestLocationPerDrive([physicalDriveId], transaction)
      ).get(physicalDriveId);
      if (!location) {
        throw new ConflictException(
          `PhysicalDrive ${physicalDriveId} has no recorded location and cannot be assigned to a slot`,
        );
      }
      if (location.datacenterId !== datacenter.id) {
        throw new ConflictException(
          `PhysicalDrive ${physicalDriveId} is located in a different datacenter than server ${serverId}`,
        );
      }

      const slotLatest = (
        await this.getLatestEventPerKey('serverSlotId', [slotId], transaction)
      ).get(slotId);
      if (
        slotLatest &&
        slotLatest.actionType === ServerSlotActionType.MOUNT &&
        slotLatest.physicalDriveId !== physicalDriveId
      ) {
        throw new ConflictException(
          `ServerSlot ${slotId} is already occupied by another drive`,
        );
      }

      const driveLatest = (
        await this.getLatestEventPerKey(
          'physicalDriveId',
          [physicalDriveId],
          transaction,
        )
      ).get(physicalDriveId);
      if (
        driveLatest &&
        driveLatest.actionType === ServerSlotActionType.MOUNT
      ) {
        if (driveLatest.serverSlotId === slotId) {
          throw new ConflictException(
            `PhysicalDrive ${physicalDriveId} is already mounted in ServerSlot ${slotId}`,
          );
        }
        await this.appendEvent(
          {
            actionType: ServerSlotActionType.UNMOUNT,
            serverSlotId: driveLatest.serverSlotId,
            physicalDriveId,
            userId: actorId,
          },
          transaction,
        );
      }

      await this.appendEvent(
        {
          actionType: ServerSlotActionType.MOUNT,
          serverSlotId: slotId,
          physicalDriveId,
          userId: actorId,
        },
        transaction,
      );
    });

    return this.getBoard(serverId);
  }

  /**
   * Removes the drive currently seated in a slot by appending an UNMOUNT event.
   */
  async unmount(
    serverId: string,
    slotId: string,
    actorId: string,
  ): Promise<SlotAssignmentBoard> {
    await this.sequelize.transaction(async (transaction) => {
      const slot = await this.serverSlotModel.findByPk(slotId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      if (!slot) {
        throw new NotFoundException(`ServerSlot with ID ${slotId} not found`);
      }
      if (slot.serverId !== serverId) {
        throw new BadRequestException(
          `ServerSlot ${slotId} does not belong to physical server ${serverId}`,
        );
      }

      const latest = (
        await this.getLatestEventPerKey('serverSlotId', [slotId], transaction)
      ).get(slotId);
      if (!latest || latest.actionType !== ServerSlotActionType.MOUNT) {
        throw new ConflictException(
          `ServerSlot ${slotId} does not currently hold a drive`,
        );
      }

      await this.appendEvent(
        {
          actionType: ServerSlotActionType.UNMOUNT,
          serverSlotId: slotId,
          physicalDriveId: latest.physicalDriveId,
          userId: actorId,
        },
        transaction,
      );
    });

    return this.getBoard(serverId);
  }

  /**
   * Replaces the server's whole drive seating in one transaction.
   *
   * The payload is the complete desired state: slots omitted from it are
   * emptied. The ledger is still append-only — the difference between the
   * derived current state and the desired state is recorded as UNMOUNT/MOUNT
   * events (unmounts first, then mounts).
   *
   * Business rules:
   *  - every slot must belong to the addressed server;
   *  - a slot and a drive may each appear at most once;
   *  - every drive must exist and have a recorded current location in the SAME
   *    datacenter as the server (server -> rack -> datacenter);
   *  - a drive currently mounted on another server is moved here.
   */
  async saveAssignments(
    serverId: string,
    assignments: { slotId: string; physicalDriveId: string }[],
    actorId: string,
  ): Promise<SlotAssignmentBoard> {
    await this.sequelize.transaction(async (transaction) => {
      const resolved = await this.resolveServerDatacenter(
        serverId,
        transaction,
      );
      if (!resolved) {
        throw new NotFoundException(
          `PhysicalServer with ID ${serverId} not found`,
        );
      }
      const { datacenter } = resolved;

      // Lock the server row so concurrent bulk saves for the same host
      // serialize (the derived current state is read below).
      await this.physicalServerModel.findByPk(serverId, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      const slots = await this.serverSlotModel.findAll({
        where: { serverId },
        order: [['id', 'ASC']],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      const slotById = new Map(slots.map((slot) => [slot.id, slot]));

      const seenSlots = new Set<string>();
      const seenDrives = new Set<string>();
      for (const { slotId, physicalDriveId } of assignments) {
        if (!slotById.has(slotId)) {
          throw new BadRequestException(
            `ServerSlot ${slotId} does not belong to physical server ${serverId}`,
          );
        }
        if (seenSlots.has(slotId)) {
          throw new BadRequestException(
            `ServerSlot ${slotId} is listed more than once`,
          );
        }
        if (seenDrives.has(physicalDriveId)) {
          throw new BadRequestException(
            `PhysicalDrive ${physicalDriveId} is listed more than once`,
          );
        }
        seenSlots.add(slotId);
        seenDrives.add(physicalDriveId);
      }

      // Drives we must reason about: the desired ones plus whatever currently
      // sits in this server's slots (so removed drives get an UNMOUNT).
      const occupancy = await this.getSlotOccupancyMap(
        slots.map((slot) => slot.id),
        transaction,
      );
      const currentOccupantIds = [...occupancy.values()]
        .filter((occupant): occupant is CurrentSlotOccupant =>
          Boolean(occupant),
        )
        .map((occupant) => occupant.physicalDriveId);
      const involvedDriveIds = [
        ...new Set([...seenDrives, ...currentOccupantIds]),
      ].sort();

      const drives =
        involvedDriveIds.length > 0
          ? await this.physicalDriveModel.findAll({
              where: { id: { [Op.in]: involvedDriveIds } },
              order: [['id', 'ASC']],
              transaction,
              lock: transaction.LOCK.UPDATE,
            })
          : [];
      const driveById = new Map(drives.map((drive) => [drive.id, drive]));

      for (const driveId of seenDrives) {
        if (!driveById.has(driveId)) {
          throw new NotFoundException(
            `PhysicalDrive with ID ${driveId} not found`,
          );
        }
      }

      if (seenDrives.size > 0) {
        const locations = await this.getLatestLocationPerDrive(
          [...seenDrives],
          transaction,
        );
        for (const driveId of seenDrives) {
          const location = locations.get(driveId);
          if (!location) {
            throw new ConflictException(
              `PhysicalDrive ${driveId} has no recorded location and cannot be assigned to a slot`,
            );
          }
          if (location.datacenterId !== datacenter.id) {
            throw new ConflictException(
              `PhysicalDrive ${driveId} is located in a different datacenter than server ${serverId}`,
            );
          }
        }
      }

      const latestDriveEvents = await this.getLatestEventPerKey(
        'physicalDriveId',
        involvedDriveIds,
        transaction,
      );
      const currentSlotByDrive = new Map<string, string>();
      for (const driveId of involvedDriveIds) {
        const event = latestDriveEvents.get(driveId);
        if (event && event.actionType === ServerSlotActionType.MOUNT) {
          currentSlotByDrive.set(driveId, event.serverSlotId);
        }
      }

      const desiredSlotByDrive = new Map<string, string>();
      for (const { slotId, physicalDriveId } of assignments) {
        desiredSlotByDrive.set(physicalDriveId, slotId);
      }

      const unmounts: { slotId: string; driveId: string }[] = [];
      const mounts: { slotId: string; driveId: string }[] = [];
      for (const driveId of involvedDriveIds) {
        const currentSlot = currentSlotByDrive.get(driveId) ?? null;
        const desiredSlot = desiredSlotByDrive.get(driveId) ?? null;
        if (currentSlot === desiredSlot) {
          continue;
        }
        if (currentSlot) {
          unmounts.push({ slotId: currentSlot, driveId });
        }
        if (desiredSlot) {
          mounts.push({ slotId: desiredSlot, driveId });
        }
      }

      // Unmounts first so the appended MOUNT is always the latest event.
      for (const { slotId, driveId } of unmounts) {
        await this.appendEvent(
          {
            actionType: ServerSlotActionType.UNMOUNT,
            serverSlotId: slotId,
            physicalDriveId: driveId,
            userId: actorId,
          },
          transaction,
        );
      }
      for (const { slotId, driveId } of mounts) {
        await this.appendEvent(
          {
            actionType: ServerSlotActionType.MOUNT,
            serverSlotId: slotId,
            physicalDriveId: driveId,
            userId: actorId,
          },
          transaction,
        );
      }
    });

    return this.getBoard(serverId);
  }

  /**
   * Drive Allocation workflow: detach drives from an optional source server
   * and/or seat drives into an optional target server, all in one transaction.
   *
   * Rules:
   *  - both servers (when provided) must belong to the selected datacenter;
   *  - detached drives must currently be seated in the source server;
   *  - a drive may only be seated if it is unseated or is being detached from
   *    the selected source (a drive mounted on any other server is rejected);
   *  - target slots must be empty or already hold the same drive;
   *  - every seated drive must have a location in the selected datacenter;
   *  - UNMOUNT events are appended before MOUNT events.
   *
   * Lock order matches the other write paths: servers -> slots -> drives.
   */
  async allocateDrives(
    dto: AllocateDrivesDto,
    actorId: string,
  ): Promise<DriveAllocationResult> {
    const detachDriveIds = [...new Set(dto.detachDriveIds ?? [])];
    const assignments = dto.assignments ?? [];

    if (!dto.sourceServerId && !dto.targetServerId) {
      throw new BadRequestException(
        'Select at least one source or target physical server',
      );
    }
    if (detachDriveIds.length > 0 && !dto.sourceServerId) {
      throw new BadRequestException('detachDriveIds require a sourceServerId');
    }
    if (assignments.length > 0 && !dto.targetServerId) {
      throw new BadRequestException('assignments require a targetServerId');
    }
    if (detachDriveIds.length === 0 && assignments.length === 0) {
      throw new BadRequestException('Nothing to allocate');
    }

    // Every detached drive that is not seated on the target needs an explicit
    // lifecycle state; drives that are re-seated keep IN_SERVICE via
    // DEPROVISION + PROVISION.
    const assignedDriveIds = new Set(
      assignments.map((assignment) => assignment.physicalDriveId),
    );
    const unseatedDetachedIds = detachDriveIds.filter(
      (driveId) => !assignedDriveIds.has(driveId),
    );
    const unseatedDetachedSet = new Set(unseatedDetachedIds);

    const stateByDrive = new Map<string, DetachedDriveStateDto>();
    for (const state of dto.unseatedDriveStates ?? []) {
      if (stateByDrive.has(state.physicalDriveId)) {
        throw new BadRequestException(
          `A lifecycle state for physical drive ${state.physicalDriveId} is listed more than once`,
        );
      }
      if (!UNSEATED_DRIVE_LIFECYCLE_EVENTS.includes(state.eventType)) {
        throw new BadRequestException(
          `Lifecycle event ${state.eventType} is not allowed for an unseated drive`,
        );
      }
      stateByDrive.set(state.physicalDriveId, state);
    }
    for (const driveId of unseatedDetachedSet) {
      if (!stateByDrive.has(driveId)) {
        throw new BadRequestException(
          `A lifecycle state is required for detached drive ${driveId} because it is not seated on the target`,
        );
      }
    }
    for (const driveId of stateByDrive.keys()) {
      if (!unseatedDetachedSet.has(driveId)) {
        throw new BadRequestException(
          `Physical drive ${driveId} is not a detached-unseated drive and cannot carry a lifecycle state`,
        );
      }
    }

    const mountedDriveIds: string[] = [];

    await this.sequelize.transaction(async (transaction) => {
      const uniqueServerIds = [
        ...new Set(
          [dto.sourceServerId, dto.targetServerId].filter((id): id is string =>
            Boolean(id),
          ),
        ),
      ].sort();

      // 1. Lock the servers first (deterministic order).
      const servers = await this.physicalServerModel.findAll({
        where: { id: { [Op.in]: uniqueServerIds } },
        order: [['id', 'ASC']],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      const serverById = new Map(servers.map((server) => [server.id, server]));
      for (const serverId of uniqueServerIds) {
        if (!serverById.has(serverId)) {
          throw new NotFoundException(
            `PhysicalServer with ID ${serverId} not found`,
          );
        }
      }

      for (const server of servers) {
        const resolved = await this.resolveServerDatacenter(
          server.id,
          transaction,
        );
        if (!resolved || resolved.datacenter.id !== dto.datacenterId) {
          throw new ConflictException(
            `PhysicalServer ${server.hostname} is not in the selected datacenter`,
          );
        }
      }

      // 2. Lock the target slots (if any) and validate slot ownership.
      const targetSlots = dto.targetServerId
        ? await this.serverSlotModel.findAll({
            where: { serverId: dto.targetServerId },
            order: [['id', 'ASC']],
            transaction,
            lock: transaction.LOCK.UPDATE,
          })
        : [];
      const slotById = new Map(targetSlots.map((slot) => [slot.id, slot]));

      const seenSlots = new Set<string>();
      const seenDrives = new Set<string>();
      for (const { slotId, physicalDriveId } of assignments) {
        if (!slotById.has(slotId)) {
          throw new BadRequestException(
            `ServerSlot ${slotId} does not belong to physical server ${dto.targetServerId}`,
          );
        }
        if (seenSlots.has(slotId)) {
          throw new BadRequestException(
            `ServerSlot ${slotId} is listed more than once`,
          );
        }
        if (seenDrives.has(physicalDriveId)) {
          throw new BadRequestException(
            `PhysicalDrive ${physicalDriveId} is listed more than once`,
          );
        }
        seenSlots.add(slotId);
        seenDrives.add(physicalDriveId);
      }

      // 3. Lock the involved drives.
      const involvedDriveIds = [
        ...new Set([
          ...detachDriveIds,
          ...assignments.map((assignment) => assignment.physicalDriveId),
        ]),
      ].sort();
      const drives = await this.physicalDriveModel.findAll({
        where: { id: { [Op.in]: involvedDriveIds } },
        order: [['id', 'ASC']],
        transaction,
        lock: transaction.LOCK.UPDATE,
      });
      const driveById = new Map(drives.map((drive) => [drive.id, drive]));
      for (const driveId of involvedDriveIds) {
        if (!driveById.has(driveId)) {
          throw new NotFoundException(
            `PhysicalDrive with ID ${driveId} not found`,
          );
        }
      }

      // 4. Derive the current seating/location under the locks.
      const currentAssignments = await this.getCurrentAssignmentsForDrives(
        involvedDriveIds,
        transaction,
      );

      const detachSet = new Set(detachDriveIds);
      for (const driveId of detachDriveIds) {
        const current = currentAssignments.get(driveId);
        if (!current || current.serverId !== dto.sourceServerId) {
          throw new ConflictException(
            `PhysicalDrive ${driveId} is not currently seated in the selected source server`,
          );
        }
      }

      const mountDriveIds = [
        ...new Set(assignments.map((a) => a.physicalDriveId)),
      ];
      const locations = await this.getLatestLocationPerDrive(
        mountDriveIds,
        transaction,
      );
      for (const driveId of mountDriveIds) {
        const location = locations.get(driveId);
        if (!location) {
          throw new ConflictException(
            `PhysicalDrive ${driveId} has no recorded location and cannot be seated`,
          );
        }
        if (location.datacenterId !== dto.datacenterId) {
          throw new ConflictException(
            `PhysicalDrive ${driveId} is located in a different datacenter than the target server`,
          );
        }
      }

      for (const { slotId, physicalDriveId } of assignments) {
        const current = currentAssignments.get(physicalDriveId);
        if (!current) {
          continue; // unseated drive -> eligible
        }
        const alreadyHere =
          current.serverId === dto.targetServerId && current.slotId === slotId;
        const detachedFromSource =
          current.serverId === dto.sourceServerId &&
          detachSet.has(physicalDriveId);
        if (!alreadyHere && !detachedFromSource) {
          throw new ConflictException(
            `PhysicalDrive ${physicalDriveId} is seated in ${current.serverHostname} slot ${current.slotLabel} and must be detached from the selected source first`,
          );
        }
      }

      const occupancy = await this.getSlotOccupancyMap(
        targetSlots.map((slot) => slot.id),
        transaction,
      );
      for (const { slotId, physicalDriveId } of assignments) {
        const occupant = occupancy.get(slotId);
        if (occupant && occupant.physicalDriveId !== physicalDriveId) {
          throw new ConflictException(
            `ServerSlot ${slotId} is already occupied by another drive`,
          );
        }
      }

      // 5. Apply UNMOUNTs first, then MOUNTs.
      for (const driveId of [...detachDriveIds].sort()) {
        const current = currentAssignments.get(driveId);
        if (!current) {
          continue;
        }
        await this.appendEvent(
          {
            actionType: ServerSlotActionType.UNMOUNT,
            serverSlotId: current.slotId,
            physicalDriveId: driveId,
            userId: actorId,
          },
          transaction,
        );
      }

      for (const { slotId, physicalDriveId } of assignments) {
        const current = currentAssignments.get(physicalDriveId);
        if (
          current &&
          current.serverId === dto.targetServerId &&
          current.slotId === slotId
        ) {
          continue; // already seated exactly there
        }
        await this.appendEvent(
          {
            actionType: ServerSlotActionType.MOUNT,
            serverSlotId: slotId,
            physicalDriveId,
            userId: actorId,
          },
          transaction,
        );
        mountedDriveIds.push(physicalDriveId);
      }

      // 6. Keep the lifecycle ledger consistent with the seating changes.
      //    - detached -> mounted: DEPROVISION then PROVISION
      //    - detached -> unseated: the operator-selected state
      //    - unseated -> mounted: PROVISION
      const mountedSet = new Set(mountedDriveIds);
      const targetSlotByDrive = new Map(
        assignments.map((assignment) => [
          assignment.physicalDriveId,
          assignment.slotId,
        ]),
      );

      for (const driveId of [...detachDriveIds].sort()) {
        const current = currentAssignments.get(driveId);
        const source = current
          ? {
              serverId: current.serverId,
              serverHostname: current.serverHostname,
              slotId: current.slotId,
              slotLabel: current.slotLabel,
            }
          : null;

        if (mountedSet.has(driveId)) {
          const contextMetadata = {
            source,
            target: {
              serverId: dto.targetServerId ?? null,
              slotId: targetSlotByDrive.get(driveId) ?? null,
            },
          };
          await this.lifecycleService.recordEventInTransaction(
            driveId,
            {
              eventType: DriveLifecycleEventType.DEPROVISION,
              contextMetadata,
            },
            { performedByUserId: actorId, triggeredBy: 'drive-allocation' },
            transaction,
          );
          await this.lifecycleService.recordEventInTransaction(
            driveId,
            {
              eventType: DriveLifecycleEventType.PROVISION,
              contextMetadata,
            },
            { performedByUserId: actorId, triggeredBy: 'drive-allocation' },
            transaction,
          );
        } else {
          const state = stateByDrive.get(driveId);
          if (!state) {
            continue;
          }
          await this.lifecycleService.recordEventInTransaction(
            driveId,
            {
              eventType: state.eventType,
              contextMetadata: {
                reason: state.explanation?.trim() || null,
                source,
                targetServerId: null,
              },
            },
            { performedByUserId: actorId, triggeredBy: 'drive-allocation' },
            transaction,
          );
        }
      }

      const unseatedMountedIds = [...mountedSet].filter(
        (driveId) => !detachSet.has(driveId),
      );
      const unseatedLifecycles: Map<string, CurrentDriveLifecycle> =
        unseatedMountedIds.length > 0
          ? await this.lifecycleService.getCurrentLifecycleMap(
              unseatedMountedIds,
              transaction,
            )
          : new Map<string, CurrentDriveLifecycle>();

      for (const driveId of unseatedMountedIds) {
        // A provisioned drive can be seated without a lifecycle change; only
        // received/inventory drives need PROVISION.
        if (
          unseatedLifecycles.get(driveId)?.state ===
          DriveLifecycleState.IN_SERVICE
        ) {
          continue;
        }
        await this.lifecycleService.recordEventInTransaction(
          driveId,
          {
            eventType: DriveLifecycleEventType.PROVISION,
            contextMetadata: {
              allocation: {
                targetServerId: dto.targetServerId ?? null,
                slotId: targetSlotByDrive.get(driveId) ?? null,
              },
            },
          },
          { performedByUserId: actorId, triggeredBy: 'drive-allocation' },
          transaction,
        );
      }
    });

    return {
      source: dto.sourceServerId
        ? await this.getBoard(dto.sourceServerId)
        : null,
      target: dto.targetServerId
        ? await this.getBoard(dto.targetServerId)
        : null,
      unmountedDriveIds: detachDriveIds,
      mountedDriveIds,
    };
  }
}
