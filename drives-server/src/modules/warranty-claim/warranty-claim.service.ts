import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { WarrantyClaim } from './entities/warranty-claim.entity';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { DriveLifecycleEvent } from '../drive-lifecycle-event/entities/drive-lifecycle-event.entity';
import { Vendor } from '../vendor/entities/vendor.entity';
import { CreateWarrantyClaimDto } from './dto/create-warranty-claim.dto';
import { UpdateWarrantyClaimDto } from './dto/update-warranty-claim.dto';
import { QueryWarrantyClaimDto } from './dto/query-warranty-claim.dto';
import { PaginationService } from '../common/pagination/pagination.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response';

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
    private readonly paginationService: PaginationService,
  ) {}

  // 🌟 Optimized private helper to check foreign key constraints concurrently and aggregate errors
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

  async findAll(
    query?: QueryWarrantyClaimDto,
  ): Promise<PaginatedResponse<WarrantyClaim & { itemNumber: number }>> {
    return this.paginationService.paginate<WarrantyClaim>(
      this.warrantyClaimModel,
      query,
    );
  }

  async findOne(id: string): Promise<WarrantyClaim | null> {
    const claim = await this.warrantyClaimModel.findByPk(id, {
      include: [PhysicalDrive, DriveLifecycleEvent, Vendor],
    });

    if (!claim) {
      throw new NotFoundException(`WarrantyClaim with ID ${id} not found`);
    }

    return claim;
  }

  async create(
    createWarrantyClaimDto: CreateWarrantyClaimDto,
  ): Promise<WarrantyClaim> {
    // 🌟 Validate all incoming foreign keys concurrently before creation
    await this.validateForeignKeys(createWarrantyClaimDto);

    const claim = await this.warrantyClaimModel.create(
      createWarrantyClaimDto as any,
    );
    return claim.reload({
      include: [PhysicalDrive, DriveLifecycleEvent, Vendor],
    });
  }

  async update(
    id: string,
    updateWarrantyClaimDto: UpdateWarrantyClaimDto,
  ): Promise<WarrantyClaim> {
    const claimObject = await this.warrantyClaimModel.findByPk(id);

    if (!claimObject) {
      throw new NotFoundException(`WarrantyClaim with ID ${id} not found`);
    }

    // 🌟 Validate updated foreign keys if present in payload
    await this.validateForeignKeys(updateWarrantyClaimDto);

    const updateData: Partial<WarrantyClaim> = {};
    if (updateWarrantyClaimDto.rmaTrackingNumber !== undefined)
      updateData.rmaTrackingNumber = updateWarrantyClaimDto.rmaTrackingNumber;
    if (updateWarrantyClaimDto.claimStatus !== undefined)
      updateData.claimStatus = updateWarrantyClaimDto.claimStatus;
    if (updateWarrantyClaimDto.notes !== undefined)
      updateData.notes = updateWarrantyClaimDto.notes;
    if (updateWarrantyClaimDto.submittedAt !== undefined)
      updateData.submittedAt = updateWarrantyClaimDto.submittedAt;
    if (updateWarrantyClaimDto.resolvedAt !== undefined)
      updateData.resolvedAt = updateWarrantyClaimDto.resolvedAt;
    if (updateWarrantyClaimDto.physicalDriveId !== undefined)
      updateData.physicalDriveId = updateWarrantyClaimDto.physicalDriveId;
    if (updateWarrantyClaimDto.triggeringEventId !== undefined)
      updateData.triggeringEventId = updateWarrantyClaimDto.triggeringEventId;
    if (updateWarrantyClaimDto.handledByVendorId !== undefined)
      updateData.handledByVendorId = updateWarrantyClaimDto.handledByVendorId;

    await claimObject.update(updateData);
    return claimObject.reload({
      include: [PhysicalDrive, DriveLifecycleEvent, Vendor],
    });
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
