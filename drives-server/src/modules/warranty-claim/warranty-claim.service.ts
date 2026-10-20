import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Op } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import {
  WarrantyClaim,
  WarrantyClaimStatus,
} from './entities/warranty-claim.entity';
import { WarrantyClaimEventType } from './entities/warranty-claim-event.entity';
import { WarrantyClaimEventService } from './warranty-claim-event.service';
import { normalizeFilters } from '../pagination/builders/filter-normalizer';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { PhysicalDriveLocation } from '../physical-drive/entities/physical-drive-location.entity';
import {
  DriveLifecycleEvent,
  DriveLifecycleEventType,
  DriveLifecycleState,
} from '../drive-lifecycle-event/entities/drive-lifecycle-event.entity';
import { DriveLifecycleEventService } from '../drive-lifecycle-event/drive-lifecycle-event.service';
import { canTransition } from '../drive-lifecycle-event/drive-lifecycle-state-machine';
import { ServerSlotAllocationService } from '../server-slot-allocation/server-slot-allocation.service';
import { Vendor } from '../vendor/entities/vendor.entity';
import { CreateWarrantyClaimDto } from './dto/create-warranty-claim.dto';
import { CreateWarrantyClaimWorkflowDto } from './dto/create-warranty-claim-workflow.dto';
import { UpdateWarrantyClaimDto } from './dto/update-warranty-claim.dto';
import { QueryWarrantyClaimDto } from './dto/query-warranty-claim.dto';
import { PaginationService } from '../pagination/pagination.service';
import { PaginatedResponse } from '../pagination/interfaces/paginated-response';

@Injectable()
export class WarrantyClaimService {
  constructor(
    @InjectModel(WarrantyClaim)
    private readonly warrantyClaimModel: typeof WarrantyClaim,
    @InjectModel(PhysicalDrive)
    private readonly physicalDriveModel: typeof PhysicalDrive,
    @InjectModel(DriveLifecycleEvent)
    private readonly driveLifecycleEventModel: typeof DriveLifecycleEvent,
    @InjectModel(Vendor)
    private readonly vendorModel: typeof Vendor,
    @InjectModel(PhysicalDriveLocation)
    private readonly physicalDriveLocationModel: typeof PhysicalDriveLocation,
    private readonly warrantyClaimEventService: WarrantyClaimEventService,
    private readonly lifecycleService: DriveLifecycleEventService,
    private readonly allocationService: ServerSlotAllocationService,
    private readonly paginationService: PaginationService,
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  // Private helper to check foreign key constraints concurrently and aggregate errors
  private async validateForeignKeys(ids: {
    physicalDriveId?: string;
    triggeringEventId?: string;
    handledByVendorId?: string;
  }): Promise<void> {
    const checkPromises: Promise<string | null>[] = [];

    if (ids.physicalDriveId) {
      checkPromises.push(
        this.physicalDriveModel
          .findByPk(ids.physicalDriveId)
          .then((exists) =>
            exists
              ? null
              : `PhysicalDrive with ID ${ids.physicalDriveId} not found`,
          ),
      );
    }
    if (ids.triggeringEventId) {
      checkPromises.push(
        this.driveLifecycleEventModel
          .findByPk(ids.triggeringEventId)
          .then((exists) =>
            exists
              ? null
              : `DriveLifecycleEvent with ID ${ids.triggeringEventId} not found`,
          ),
      );
    }
    if (ids.handledByVendorId) {
      checkPromises.push(
        this.vendorModel
          .findByPk(ids.handledByVendorId)
          .then((exists) =>
            exists ? null : `Vendor with ID ${ids.handledByVendorId} not found`,
          ),
      );
    }

    const results = await Promise.all(checkPromises);
    const errors = results.filter((error): error is string => error !== null);

    if (errors.length > 0) {
      throw new NotFoundException(errors.join('\n'));
    }
  }

  // Stamps the derived status snapshot + lifecycle timestamps onto a set of
  // claims from the append-only warranty_claim_events log.
  private async decorateStatuses(claims: WarrantyClaim[]): Promise<void> {
    if (claims.length === 0) {
      return;
    }

    const statusMap = await this.warrantyClaimEventService.getStatusMap(
      claims.map((claim) => claim.id),
    );

    for (const claim of claims) {
      const current = statusMap.get(claim.id);
      const status = current?.status ?? WarrantyClaimStatus.SUBMITTED;

      claim.setDataValue('currentStatus', status);
      claim.setDataValue(
        'currentEvent',
        current?.eventType
          ? {
              id: current.eventId,
              eventType: current.eventType,
              eventTimestamp: current.eventTimestamp,
            }
          : null,
      );
      claim.setDataValue('openedAt', claim.createdAt);
      claim.setDataValue(
        'resolvedAt',
        status === WarrantyClaimStatus.CLOSED
          ? (current?.eventTimestamp ?? null)
          : null,
      );
    }
  }

  private async decorateStatus(claim: WarrantyClaim): Promise<WarrantyClaim> {
    await this.decorateStatuses([claim]);
    return claim;
  }

  async findAll(
    query?: QueryWarrantyClaimDto,
  ): Promise<PaginatedResponse<WarrantyClaim>> {
    // `currentStatus` is derived from the tracking log, not a table column.
    // Resolve the matching claim ids and remove the condition before delegating.
    const filters = normalizeFilters(query ?? {});
    const statusFilter = filters.find(
      (filter) => filter.field === 'currentStatus',
    );

    let customWhere: Record<string, unknown> = {};
    let effectiveQuery = query;

    if (statusFilter) {
      const statuses = statusFilter.value
        .split(',')
        .map((status) => status.trim())
        .filter(Boolean);
      const claimIds =
        await this.warrantyClaimEventService.getClaimIdsByStatus(statuses);

      customWhere = { id: { [Op.in]: claimIds } };
      effectiveQuery = {
        ...query,
        filters: filters.filter((filter) => filter.field !== 'currentStatus'),
      };
    }

    const result = await this.paginationService.paginate<WarrantyClaim>(
      this.warrantyClaimModel,
      effectiveQuery,
      { where: customWhere, include: [PhysicalDrive, Vendor] },
    );

    await this.decorateStatuses(result.data);
    return result;
  }

  async findOne(id: string): Promise<WarrantyClaim | null> {
    const claim = await this.warrantyClaimModel.findByPk(id, {
      include: [PhysicalDrive, DriveLifecycleEvent, Vendor],
    });

    if (!claim) {
      throw new NotFoundException(`WarrantyClaim with ID ${id} not found`);
    }

    return this.decorateStatus(claim);
  }

  async create(
    createWarrantyClaimDto: CreateWarrantyClaimDto,
  ): Promise<WarrantyClaim> {
    // Validate all incoming foreign keys concurrently before creation
    await this.validateForeignKeys(createWarrantyClaimDto);

    const claim = await this.warrantyClaimModel.create(
      createWarrantyClaimDto as Partial<WarrantyClaim>,
    );

    const reloaded = await claim.reload({
      include: [PhysicalDrive, DriveLifecycleEvent, Vendor],
    });
    return this.decorateStatus(reloaded);
  }

  /**
   * Create Warranty Claim workflow. In one transaction:
   *  - verifies the drive is unseated and in the selected datacenter;
   *  - moves the drive to IN_RMA via `RMA_INITIATE` (preceded by
   *    `DEPROVISION` when it is still IN_SERVICE);
   *  - creates the claim header with the RMA_INITIATE event as its trigger;
   *  - appends an informational NOTE to the claim tracking log.
   */
  async openClaim(
    dto: CreateWarrantyClaimWorkflowDto,
    actorId: string,
  ): Promise<WarrantyClaim> {
    const claimId = await this.sequelize.transaction(async (transaction) => {
      const drive = await this.physicalDriveModel.findByPk(
        dto.physicalDriveId,
        { transaction, lock: transaction.LOCK.UPDATE },
      );
      if (!drive) {
        throw new NotFoundException(
          `PhysicalDrive with ID ${dto.physicalDriveId} not found`,
        );
      }

      // The drive must still be covered (expiry date is inclusive).
      const today = new Date().toISOString().slice(0, 10);
      if (
        drive.warrantyExpiryDate &&
        String(drive.warrantyExpiryDate) < today
      ) {
        throw new ConflictException(
          `PhysicalDrive ${drive.id} warranty expired on ${drive.warrantyExpiryDate}`,
        );
      }

      const activeClaim =
        await this.warrantyClaimEventService.getActiveClaimForDrive(
          drive.id,
          transaction,
        );
      if (activeClaim) {
        throw new ConflictException(
          `PhysicalDrive ${drive.id} already has an open warranty claim (${activeClaim.id}, ${activeClaim.status})`,
        );
      }

      const vendor = await this.vendorModel.findByPk(dto.handledByVendorId, {
        transaction,
      });
      if (!vendor) {
        throw new NotFoundException(
          `Vendor with ID ${dto.handledByVendorId} not found`,
        );
      }

      const assignments =
        await this.allocationService.getCurrentAssignmentsForDrives(
          [drive.id],
          transaction,
        );
      const assignment = assignments.get(drive.id);
      if (assignment) {
        throw new ConflictException(
          `PhysicalDrive ${drive.id} is seated in ${assignment.serverHostname} slot ${assignment.slotLabel}; unmount it before opening an RMA claim`,
        );
      }

      const location = await this.physicalDriveLocationModel.findOne({
        where: { physicalDriveId: drive.id },
        order: [
          ['locatedAt', 'DESC'],
          ['displayKey', 'DESC'],
        ],
        transaction,
      });
      if (!location) {
        throw new ConflictException(
          `PhysicalDrive ${drive.id} has no recorded location`,
        );
      }
      if (location.datacenterId !== dto.datacenterId) {
        throw new ConflictException(
          `PhysicalDrive ${drive.id} is not located in the selected datacenter`,
        );
      }

      const lifecycles = await this.lifecycleService.getCurrentLifecycleMap(
        [drive.id],
        transaction,
      );
      const state =
        lifecycles.get(drive.id)?.state ?? DriveLifecycleState.UNRECEIVED;

      const lifecycleActor = {
        performedByUserId: actorId,
        triggeredBy: 'warranty-claim-workflow',
      };
      const contextMetadata = {
        reason: 'Warranty claim opened',
        datacenterId: dto.datacenterId,
      };

      if (state === DriveLifecycleState.IN_SERVICE) {
        await this.lifecycleService.recordEventInTransaction(
          drive.id,
          {
            eventType: DriveLifecycleEventType.DEPROVISION,
            contextMetadata,
          },
          lifecycleActor,
          transaction,
        );
      } else if (!canTransition(state, DriveLifecycleEventType.RMA_INITIATE)) {
        throw new ConflictException(
          `PhysicalDrive ${drive.id} is in state ${state} and cannot be sent to RMA`,
        );
      }

      const lifecycleTimeline =
        await this.lifecycleService.recordEventInTransaction(
          drive.id,
          {
            eventType: DriveLifecycleEventType.RMA_INITIATE,
            contextMetadata,
          },
          lifecycleActor,
          transaction,
        );
      const triggeringEventId = lifecycleTimeline.currentEvent?.id ?? null;

      const claim = await this.warrantyClaimModel.create(
        {
          physicalDriveId: drive.id,
          triggeringEventId,
          handledByVendorId: dto.handledByVendorId,
          rmaTrackingNumber: dto.rmaTrackingNumber ?? null,
          notes: dto.notes ?? null,
        } as Partial<WarrantyClaim>,
        { transaction },
      );

      await this.warrantyClaimEventService.recordEventInTransaction(
        claim.id,
        {
          eventType: WarrantyClaimEventType.NOTE,
          notes: 'Warranty claim opened',
        },
        { performedByUserId: actorId },
        transaction,
      );

      return claim.id;
    });

    const claim = await this.findOne(claimId);
    if (!claim) {
      throw new NotFoundException(`WarrantyClaim with ID ${claimId} not found`);
    }
    return claim;
  }

  async update(
    id: string,
    updateWarrantyClaimDto: UpdateWarrantyClaimDto,
  ): Promise<WarrantyClaim> {
    const claimObject = await this.warrantyClaimModel.findByPk(id);

    if (!claimObject) {
      throw new NotFoundException(`WarrantyClaim with ID ${id} not found`);
    }

    // Validate updated foreign keys if present in payload
    await this.validateForeignKeys(updateWarrantyClaimDto);

    const updateData: Partial<WarrantyClaim> = {};
    if (updateWarrantyClaimDto.rmaTrackingNumber !== undefined)
      updateData.rmaTrackingNumber = updateWarrantyClaimDto.rmaTrackingNumber;
    if (updateWarrantyClaimDto.notes !== undefined)
      updateData.notes = updateWarrantyClaimDto.notes;
    if (updateWarrantyClaimDto.physicalDriveId !== undefined)
      updateData.physicalDriveId = updateWarrantyClaimDto.physicalDriveId;
    if (updateWarrantyClaimDto.triggeringEventId !== undefined)
      updateData.triggeringEventId = updateWarrantyClaimDto.triggeringEventId;
    if (updateWarrantyClaimDto.handledByVendorId !== undefined)
      updateData.handledByVendorId = updateWarrantyClaimDto.handledByVendorId;

    await claimObject.update(updateData);

    const reloaded = await claimObject.reload({
      include: [PhysicalDrive, DriveLifecycleEvent, Vendor],
    });
    return this.decorateStatus(reloaded);
  }

  async delete(id: string): Promise<boolean> {
    const claimObject = await this.warrantyClaimModel.findByPk(id);

    if (!claimObject) {
      throw new NotFoundException(`WarrantyClaim with ID ${id} not found`);
    }

    const deletedCount = await this.warrantyClaimModel.destroy({
      where: { id },
    });
    return deletedCount > 0;
  }
}
