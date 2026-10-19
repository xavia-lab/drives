import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  WarrantyClaim,
  WarrantyClaimStatus,
} from './entities/warranty-claim.entity';
import { WarrantyClaimEventService } from './warranty-claim-event.service';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { DriveLifecycleEvent } from '../drive-lifecycle-event/entities/drive-lifecycle-event.entity';
import { Vendor } from '../vendor/entities/vendor.entity';
import { CreateWarrantyClaimDto } from './dto/create-warranty-claim.dto';
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
    private readonly warrantyClaimEventService: WarrantyClaimEventService,
    private readonly paginationService: PaginationService,
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
    const result = await this.paginationService.paginate<WarrantyClaim>(
      this.warrantyClaimModel,
      query,
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
