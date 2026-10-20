import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Op, OrderItem, Transaction } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import {
  WarrantyClaim,
  WarrantyClaimStatus,
} from './entities/warranty-claim.entity';
import {
  WarrantyClaimEvent,
  WarrantyClaimEventType,
} from './entities/warranty-claim-event.entity';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { User } from '../user/entities/user.entity';
import { CreateWarrantyClaimEventDto } from './dto/create-warranty-claim-event.dto';
import { QueryWarrantyClaimEventDto } from './dto/query-warranty-claim-event.dto';
import { PaginationService } from '../pagination/pagination.service';
import { PaginatedResponse } from '../pagination/interfaces/paginated-response';
import {
  allowedEventsFor,
  canTransition,
  INFORMATIONAL_EVENT_TYPES,
  isStateChangingEvent,
  statusForEvent,
} from './warranty-claim-state-machine';

// Derived snapshot of a warranty claim's current position.
export interface CurrentWarrantyClaimStatus {
  status: WarrantyClaimStatus;
  eventId: string | null;
  eventType: WarrantyClaimEventType | null;
  eventTimestamp: Date | null;
  performedByUserId: string | null;
}

// The full tracking timeline for a claim: derived status plus every event
// (oldest first).
export interface WarrantyClaimTimeline {
  warrantyClaimId: string;
  currentStatus: WarrantyClaimStatus;
  /** State-changing events allowed from the current status, plus NOTE. */
  allowedEvents: WarrantyClaimEventType[];
  currentEvent: WarrantyClaimEvent | null;
  events: WarrantyClaimEvent[];
}

// Who recorded an event: the authenticated operator (preferred) or an explicit
// system actor for automation.
export interface RecordWarrantyClaimEventActor {
  performedByUserId?: string | null;
}

const EVENT_READ_INCLUDES = [
  { model: WarrantyClaim, as: 'warrantyClaim' },
  { model: PhysicalDrive, as: 'replacementDrive' },
];

const LATEST_FIRST: OrderItem[] = [
  ['eventTimestamp', 'DESC'],
  ['displayKey', 'DESC'],
];

const OLDEST_FIRST: OrderItem[] = [
  ['eventTimestamp', 'ASC'],
  ['displayKey', 'ASC'],
];

@Injectable()
export class WarrantyClaimEventService {
  constructor(
    @InjectModel(WarrantyClaimEvent)
    private readonly warrantyClaimEventModel: typeof WarrantyClaimEvent,
    @InjectModel(WarrantyClaim)
    private readonly warrantyClaimModel: typeof WarrantyClaim,
    @InjectModel(PhysicalDrive)
    private readonly physicalDriveModel: typeof PhysicalDrive,
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly paginationService: PaginationService,
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  private mapCurrent(
    event: WarrantyClaimEvent | null,
  ): CurrentWarrantyClaimStatus {
    return {
      status: event
        ? statusForEvent(event.eventType)
        : WarrantyClaimStatus.SUBMITTED,
      eventId: event?.id ?? null,
      eventType: event?.eventType ?? null,
      eventTimestamp: event?.eventTimestamp ?? null,
      performedByUserId: event?.performedByUserId ?? null,
    };
  }

  // Batched derived "current status" for a set of claims: one query, reduce to
  // the latest state-changing event per claim in memory. Always returns an
  // entry for every requested id (SUBMITTED when the claim has no events).
  async getStatusMap(
    claimIds: string[],
    transaction?: Transaction,
  ): Promise<Map<string, CurrentWarrantyClaimStatus>> {
    const map = new Map<string, CurrentWarrantyClaimStatus>();
    if (claimIds.length === 0) {
      return map;
    }

    const events = await this.warrantyClaimEventModel.findAll({
      where: { warrantyClaimId: { [Op.in]: claimIds } },
      order: [['warrantyClaimId', 'ASC'], ...LATEST_FIRST],
      transaction,
    });

    for (const event of events) {
      if (
        !map.has(event.warrantyClaimId) &&
        isStateChangingEvent(event.eventType)
      ) {
        map.set(event.warrantyClaimId, this.mapCurrent(event));
      }
    }

    for (const id of claimIds) {
      if (!map.has(id)) {
        map.set(id, this.mapCurrent(null));
      }
    }

    return map;
  }

  // Returns the first claim for a drive that is not CLOSED (terminal). Used by
  // the Create Warranty Claim workflow to prevent duplicate active claims.
  async getActiveClaimForDrive(
    driveId: string,
    transaction?: Transaction,
  ): Promise<{ id: string; status: WarrantyClaimStatus } | null> {
    const claims = await this.warrantyClaimModel.findAll({
      where: { physicalDriveId: driveId },
      attributes: ['id'],
      transaction,
    });
    if (claims.length === 0) {
      return null;
    }

    const statusMap = await this.getStatusMap(
      claims.map((claim) => claim.id),
      transaction,
    );

    for (const claim of claims) {
      const status =
        statusMap.get(claim.id)?.status ?? WarrantyClaimStatus.SUBMITTED;
      if (status !== WarrantyClaimStatus.CLOSED) {
        return { id: claim.id, status };
      }
    }

    return null;
  }

  // Resolves the ids of claims whose derived status is one of the given
  // statuses. Used by the list's derived `currentStatus` filter.
  async getClaimIdsByStatus(statuses: string[]): Promise<string[]> {
    const normalized = statuses
      .map((status) => status.trim().toUpperCase())
      .filter(Boolean);
    if (normalized.length === 0) {
      return [];
    }

    const claims = await this.warrantyClaimModel.findAll({
      attributes: ['id'],
    });
    const claimIds = claims.map((claim) => claim.id);
    const statusMap = await this.getStatusMap(claimIds);

    return claimIds.filter((claimId) => {
      const status =
        statusMap.get(claimId)?.status ?? WarrantyClaimStatus.SUBMITTED;
      return normalized.includes(status);
    });
  }

  async findAll(
    query?: QueryWarrantyClaimEventDto,
  ): Promise<PaginatedResponse<WarrantyClaimEvent>> {
    const where: Record<string, unknown> = {};

    if (query?.warrantyClaimId) where.warrantyClaimId = query.warrantyClaimId;
    if (query?.eventType) where.eventType = query.eventType;
    if (query?.performedByUserId)
      where.performedByUserId = query.performedByUserId;
    if (query?.replacementPhysicalDriveId)
      where.replacementPhysicalDriveId = query.replacementPhysicalDriveId;

    if (query?.eventTimestampFrom || query?.eventTimestampTo) {
      where.eventTimestamp = {
        ...(query.eventTimestampFrom
          ? { [Op.gte]: new Date(query.eventTimestampFrom) }
          : {}),
        ...(query.eventTimestampTo
          ? { [Op.lte]: new Date(query.eventTimestampTo) }
          : {}),
      };
    }

    return this.paginationService.paginate<WarrantyClaimEvent>(
      this.warrantyClaimEventModel,
      query,
      { where, include: EVENT_READ_INCLUDES },
    );
  }

  async findOne(id: string): Promise<WarrantyClaimEvent> {
    const event = await this.warrantyClaimEventModel.findByPk(id, {
      include: EVENT_READ_INCLUDES,
    });

    if (!event) {
      throw new NotFoundException(`WarrantyClaimEvent with ID ${id} not found`);
    }

    return event;
  }

  async getTimeline(claimId: string): Promise<WarrantyClaimTimeline> {
    const claim = await this.warrantyClaimModel.findByPk(claimId);
    if (!claim) {
      throw new NotFoundException(`WarrantyClaim with ID ${claimId} not found`);
    }

    return this.loadTimeline(claimId);
  }

  private async loadTimeline(
    claimId: string,
    transaction?: Transaction,
  ): Promise<WarrantyClaimTimeline> {
    const events = await this.warrantyClaimEventModel.findAll({
      where: { warrantyClaimId: claimId },
      order: OLDEST_FIRST,
      transaction,
    });

    const stateEvents = events.filter((event) =>
      isStateChangingEvent(event.eventType),
    );
    const currentEvent =
      stateEvents.length > 0 ? stateEvents[stateEvents.length - 1] : null;
    const currentStatus = currentEvent
      ? statusForEvent(currentEvent.eventType)
      : WarrantyClaimStatus.SUBMITTED;

    return {
      warrantyClaimId: claimId,
      currentStatus,
      allowedEvents: [
        ...allowedEventsFor(currentStatus),
        WarrantyClaimEventType.NOTE,
      ],
      currentEvent,
      events,
    };
  }

  private async getLatestEvent(
    claimId: string,
    transaction: Transaction,
    stateChangingOnly: boolean,
  ): Promise<WarrantyClaimEvent | null> {
    return this.warrantyClaimEventModel.findOne({
      where: stateChangingOnly
        ? {
            warrantyClaimId: claimId,
            eventType: { [Op.notIn]: [...INFORMATIONAL_EVENT_TYPES] },
          }
        : { warrantyClaimId: claimId },
      order: LATEST_FIRST,
      transaction,
    });
  }

  private async assertPerformedByUserExists(
    userId: string | null | undefined,
    transaction: Transaction,
  ): Promise<void> {
    if (!userId) {
      return;
    }

    const user = await this.userModel.findByPk(userId, { transaction });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
  }

  private async assertReplacement(
    claim: WarrantyClaim,
    dto: CreateWarrantyClaimEventDto,
    transaction: Transaction,
  ): Promise<void> {
    const replacementId = dto.replacementPhysicalDriveId ?? null;

    if (dto.eventType !== WarrantyClaimEventType.REPLACEMENT_RECEIVED) {
      if (replacementId) {
        throw new BadRequestException(
          'replacementPhysicalDriveId is only allowed for REPLACEMENT_RECEIVED events',
        );
      }
      return;
    }

    if (!replacementId) {
      throw new BadRequestException(
        'replacementPhysicalDriveId is required for REPLACEMENT_RECEIVED events',
      );
    }

    if (replacementId === claim.physicalDriveId) {
      throw new BadRequestException(
        'A drive cannot be its own warranty replacement',
      );
    }

    const replacement = await this.physicalDriveModel.findByPk(replacementId, {
      transaction,
    });
    if (!replacement) {
      throw new NotFoundException(
        `Replacement PhysicalDrive with ID ${replacementId} not found`,
      );
    }
  }

  // Appends a tracking event (append-only). The claim row is locked so
  // concurrent appends on the same claim serialize, the transition is validated
  // against the derived current status, and the refreshed timeline is returned.
  async recordEvent(
    claimId: string,
    dto: CreateWarrantyClaimEventDto,
    actor: RecordWarrantyClaimEventActor = {},
  ): Promise<WarrantyClaimTimeline> {
    return this.sequelize.transaction((transaction) =>
      this.recordEventInTransaction(claimId, dto, actor, transaction),
    );
  }

  // Same as `recordEvent`, but joins a caller-owned transaction. Used by
  // multi-table workflows (e.g. opening a claim together with its drive's
  // RMA_INITIATE lifecycle event).
  async recordEventInTransaction(
    claimId: string,
    dto: CreateWarrantyClaimEventDto,
    actor: RecordWarrantyClaimEventActor,
    transaction: Transaction,
  ): Promise<WarrantyClaimTimeline> {
    const claim = await this.warrantyClaimModel.findByPk(claimId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!claim) {
      throw new NotFoundException(`WarrantyClaim with ID ${claimId} not found`);
    }

    const performedByUserId =
      actor.performedByUserId ?? dto.performedByUserId ?? null;

    await this.assertPerformedByUserExists(performedByUserId, transaction);

    const [latestEvent, latestStateEvent] = await Promise.all([
      this.getLatestEvent(claimId, transaction, false),
      this.getLatestEvent(claimId, transaction, true),
    ]);

    const currentStatus = latestStateEvent
      ? statusForEvent(latestStateEvent.eventType)
      : WarrantyClaimStatus.SUBMITTED;

    if (!canTransition(currentStatus, dto.eventType)) {
      throw new ConflictException(
        `Cannot record ${dto.eventType} for a claim in status ${currentStatus}`,
      );
    }

    const eventTimestamp = dto.eventTimestamp
      ? new Date(dto.eventTimestamp)
      : new Date();

    if (
      latestEvent &&
      eventTimestamp.getTime() < new Date(latestEvent.eventTimestamp).getTime()
    ) {
      throw new ConflictException(
        'eventTimestamp must not precede the latest tracking event',
      );
    }

    await this.assertReplacement(claim, dto, transaction);

    await this.warrantyClaimEventModel.create(
      {
        ...(dto.id ? { id: dto.id } : {}),
        warrantyClaimId: claimId,
        eventType: dto.eventType,
        eventTimestamp,
        notes: dto.notes ?? null,
        performedByUserId,
        replacementPhysicalDriveId: dto.replacementPhysicalDriveId ?? null,
      } as Partial<WarrantyClaimEvent>,
      { transaction },
    );

    return this.loadTimeline(claimId, transaction);
  }
}
