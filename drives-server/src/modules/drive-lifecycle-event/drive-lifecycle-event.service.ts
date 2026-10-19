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
  DriveLifecycleEvent,
  DriveLifecycleEventType,
  DriveLifecycleState,
} from './entities/drive-lifecycle-event.entity';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { User } from '../user/entities/user.entity';
import { CreateDriveLifecycleEventDto } from './dto/create-drive-lifecycle-event.dto';
import { QueryDriveLifecycleEventDto } from './dto/query-drive-lifecycle-event.dto';
import { PaginationService } from '../pagination/pagination.service';
import { PaginatedResponse } from '../pagination/interfaces/paginated-response';
import {
  canTransition,
  INFORMATIONAL_EVENT_TYPES,
  isStateChangingEvent,
  stateForEvent,
} from './drive-lifecycle-state-machine';

// Derived snapshot of a drive's current lifecycle position.
export interface CurrentDriveLifecycle {
  state: DriveLifecycleState;
  eventId: string | null;
  eventType: DriveLifecycleEventType | null;
  eventTimestamp: Date | null;
  performedByUserId: string | null;
  triggeredBy: string | null;
}

// The full timeline for a drive: derived state plus every event (oldest first).
export interface DriveLifecycleTimeline {
  physicalDriveId: string;
  currentState: DriveLifecycleState;
  currentEvent: DriveLifecycleEvent | null;
  events: DriveLifecycleEvent[];
}

// Who recorded an event: the authenticated operator (preferred) or an explicit
// system actor for automation.
export interface RecordLifecycleEventActor {
  performedByUserId?: string | null;
  triggeredBy?: string | null;
}

const EVENT_READ_INCLUDES = [
  { model: PhysicalDrive, as: 'physicalDrive' },
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
export class DriveLifecycleEventService {
  constructor(
    @InjectModel(DriveLifecycleEvent)
    private readonly driveLifecycleEventModel: typeof DriveLifecycleEvent,
    @InjectModel(PhysicalDrive)
    private readonly physicalDriveModel: typeof PhysicalDrive,
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly paginationService: PaginationService,
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  private mapCurrent(event: DriveLifecycleEvent | null): CurrentDriveLifecycle {
    return {
      state: event
        ? stateForEvent(event.eventType)
        : DriveLifecycleState.UNRECEIVED,
      eventId: event?.id ?? null,
      eventType: event?.eventType ?? null,
      eventTimestamp: event?.eventTimestamp ?? null,
      performedByUserId: event?.performedByUserId ?? null,
      triggeredBy: event?.triggeredBy ?? null,
    };
  }

  // Batched derived "current lifecycle" for a set of drives: one query, reduce
  // to the latest state-changing event per drive in memory. Always returns an
  // entry for every requested id (UNRECEIVED when the drive has no history).
  async getCurrentLifecycleMap(
    driveIds: string[],
  ): Promise<Map<string, CurrentDriveLifecycle>> {
    const map = new Map<string, CurrentDriveLifecycle>();
    if (driveIds.length === 0) {
      return map;
    }

    const events = await this.driveLifecycleEventModel.findAll({
      where: { physicalDriveId: { [Op.in]: driveIds } },
      order: [['physicalDriveId', 'ASC'], ...LATEST_FIRST],
    });

    for (const event of events) {
      if (
        !map.has(event.physicalDriveId) &&
        isStateChangingEvent(event.eventType)
      ) {
        map.set(event.physicalDriveId, this.mapCurrent(event));
      }
    }

    for (const id of driveIds) {
      if (!map.has(id)) {
        map.set(id, this.mapCurrent(null));
      }
    }

    return map;
  }

  async findAll(
    query?: QueryDriveLifecycleEventDto,
  ): Promise<PaginatedResponse<DriveLifecycleEvent>> {
    // Translate the dedicated lookups + timestamp window into a where clause,
    // then delegate the rest to the pagination service (which still applies
    // the generic `filters` handling).
    const where: Record<string, unknown> = {};

    if (query?.physicalDriveId) where.physicalDriveId = query.physicalDriveId;
    if (query?.eventType) where.eventType = query.eventType;
    if (query?.triggeredBy) where.triggeredBy = query.triggeredBy;
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

    return this.paginationService.paginate<DriveLifecycleEvent>(
      this.driveLifecycleEventModel,
      query,
      { where, include: EVENT_READ_INCLUDES },
    );
  }

  async findOne(id: string): Promise<DriveLifecycleEvent> {
    const event = await this.driveLifecycleEventModel.findByPk(id, {
      include: EVENT_READ_INCLUDES,
    });

    if (!event) {
      throw new NotFoundException(
        `DriveLifecycleEvent with ID ${id} not found`,
      );
    }

    return event;
  }

  async getTimeline(driveId: string): Promise<DriveLifecycleTimeline> {
    const drive = await this.physicalDriveModel.findByPk(driveId);
    if (!drive) {
      throw new NotFoundException(`PhysicalDrive with ID ${driveId} not found`);
    }

    return this.loadTimeline(driveId);
  }

  private async loadTimeline(
    driveId: string,
    transaction?: Transaction,
  ): Promise<DriveLifecycleTimeline> {
    const events = await this.driveLifecycleEventModel.findAll({
      where: { physicalDriveId: driveId },
      order: OLDEST_FIRST,
      transaction,
    });

    const stateEvents = events.filter((event) =>
      isStateChangingEvent(event.eventType),
    );
    const currentEvent =
      stateEvents.length > 0 ? stateEvents[stateEvents.length - 1] : null;

    return {
      physicalDriveId: driveId,
      currentState: currentEvent
        ? stateForEvent(currentEvent.eventType)
        : DriveLifecycleState.UNRECEIVED,
      currentEvent,
      events,
    };
  }

  private async getLatestEvent(
    driveId: string,
    transaction: Transaction,
    stateChangingOnly: boolean,
  ): Promise<DriveLifecycleEvent | null> {
    return this.driveLifecycleEventModel.findOne({
      where: stateChangingOnly
        ? {
            physicalDriveId: driveId,
            eventType: { [Op.notIn]: [...INFORMATIONAL_EVENT_TYPES] },
          }
        : { physicalDriveId: driveId },
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
    driveId: string,
    dto: CreateDriveLifecycleEventDto,
    transaction: Transaction,
  ): Promise<void> {
    const replacementId = dto.replacementPhysicalDriveId ?? null;

    if (dto.eventType !== DriveLifecycleEventType.RMA_REPLACE) {
      if (replacementId) {
        throw new BadRequestException(
          'replacementPhysicalDriveId is only allowed for RMA_REPLACE events',
        );
      }
      return;
    }

    if (!replacementId) {
      throw new BadRequestException(
        'replacementPhysicalDriveId is required for RMA_REPLACE events',
      );
    }

    if (replacementId === driveId) {
      throw new BadRequestException(
        'A drive cannot be its own RMA replacement',
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

    const existingReplacement = await this.driveLifecycleEventModel.findOne({
      where: {
        eventType: DriveLifecycleEventType.RMA_REPLACE,
        replacementPhysicalDriveId: replacementId,
      },
      transaction,
    });
    if (existingReplacement) {
      throw new ConflictException(
        `PhysicalDrive with ID ${replacementId} is already linked as an RMA replacement`,
      );
    }
  }

  // Appends a lifecycle event (append-only). The drive row is locked so
  // concurrent appends on the same drive serialize, the transition is validated
  // against the derived current state, and the refreshed timeline is returned.
  async recordEvent(
    driveId: string,
    dto: CreateDriveLifecycleEventDto,
    actor: RecordLifecycleEventActor = {},
  ): Promise<DriveLifecycleTimeline> {
    return this.sequelize.transaction((transaction) =>
      this.recordEventInTransaction(driveId, dto, actor, transaction),
    );
  }

  // Same as `recordEvent`, but joins a caller-owned transaction. Used by
  // multi-table workflows (e.g. drive acquisition) that must commit the drive,
  // its location and its first lifecycle event atomically.
  async recordEventInTransaction(
    driveId: string,
    dto: CreateDriveLifecycleEventDto,
    actor: RecordLifecycleEventActor,
    transaction: Transaction,
  ): Promise<DriveLifecycleTimeline> {
    const drive = await this.physicalDriveModel.findByPk(driveId, {
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!drive) {
      throw new NotFoundException(`PhysicalDrive with ID ${driveId} not found`);
    }

    const performedByUserId =
      actor.performedByUserId ?? dto.performedByUserId ?? null;
    const triggeredBy =
      actor.triggeredBy ?? dto.triggeredBy ?? performedByUserId ?? 'system';

    await this.assertPerformedByUserExists(performedByUserId, transaction);

    const [latestEvent, latestStateEvent] = await Promise.all([
      this.getLatestEvent(driveId, transaction, false),
      this.getLatestEvent(driveId, transaction, true),
    ]);

    const currentState = latestStateEvent
      ? stateForEvent(latestStateEvent.eventType)
      : DriveLifecycleState.UNRECEIVED;

    if (!canTransition(currentState, dto.eventType)) {
      throw new ConflictException(
        `Cannot record ${dto.eventType} for a drive in state ${currentState}`,
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
        'eventTimestamp must not precede the latest lifecycle event',
      );
    }

    await this.assertReplacement(driveId, dto, transaction);

    await this.driveLifecycleEventModel.create(
      {
        ...(dto.id ? { id: dto.id } : {}),
        physicalDriveId: driveId,
        eventType: dto.eventType,
        eventTimestamp,
        triggeredBy,
        performedByUserId,
        replacementPhysicalDriveId: dto.replacementPhysicalDriveId ?? null,
        contextMetadata: dto.contextMetadata ?? null,
      } as Partial<DriveLifecycleEvent>,
      { transaction },
    );

    return this.loadTimeline(driveId, transaction);
  }
}
