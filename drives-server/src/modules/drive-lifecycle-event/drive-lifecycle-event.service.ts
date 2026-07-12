import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { DriveLifecycleEvent } from './entities/drive-lifecycle-event.entity';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { CreateDriveLifecycleEventDto } from './dto/create-drive-lifecycle-event.dto';
import { UpdateDriveLifecycleEventDto } from './dto/update-drive-lifecycle-event.dto';
import { QueryDriveLifecycleEventDto } from './dto/query-drive-lifecycle-event.dto';
import { PaginationService } from '../common/pagination/pagination.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response';

@Injectable()
export class DriveLifecycleEventService {
  constructor(
    @InjectModel(DriveLifecycleEvent)
    private readonly driveLifecycleEventModel: typeof DriveLifecycleEvent,
    @InjectModel(PhysicalDrive)
    private readonly physicalDriveModel: typeof PhysicalDrive,
    private readonly paginationService: PaginationService, // 🌟 Clean composition injection
  ) {}

  // 🌟 Private helper to check foreign key constraints concurrently and aggregate errors
  private async validateForeignKeys(ids: {
    physicalDriveId?: string;
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

    const results = await Promise.all(checkPromises);
    const errors = results.filter((error): error is string => error !== null);

    if (errors.length > 0) {
      throw new NotFoundException(errors.join('\n'));
    }
  }

  async findAll(
    query?: QueryDriveLifecycleEventDto,
  ): Promise<PaginatedResponse<DriveLifecycleEvent & { itemNumber: number }>> {
    // 🌟 Clean delegation to the standalone pagination service
    return this.paginationService.paginate<DriveLifecycleEvent>(
      this.driveLifecycleEventModel,
      query,
    );
  }

  async findOne(id: string): Promise<DriveLifecycleEvent | null> {
    const event = await this.driveLifecycleEventModel.findByPk(id, {
      include: [PhysicalDrive],
    });

    if (!event) {
      throw new NotFoundException(
        `DriveLifecycleEvent with ID ${id} not found`,
      );
    }

    return event;
  }

  async create(
    createDriveLifecycleEventDto: CreateDriveLifecycleEventDto,
  ): Promise<DriveLifecycleEvent> {
    // 🌟 Validate that the parent physical drive exists before appending a lifestyle token
    await this.validateForeignKeys(createDriveLifecycleEventDto);

    const event = await this.driveLifecycleEventModel.create(
      createDriveLifecycleEventDto as any,
    );
    return event.reload({ include: [PhysicalDrive] });
  }

  async update(
    id: string,
    updateDriveLifecycleEventDto: UpdateDriveLifecycleEventDto,
  ): Promise<DriveLifecycleEvent> {
    const eventObject = await this.driveLifecycleEventModel.findByPk(id);

    if (!eventObject) {
      throw new NotFoundException(
        `DriveLifecycleEvent with ID ${id} not found`,
      );
    }

    // 🌟 Validate passed keys for existence if they are being updated
    await this.validateForeignKeys(updateDriveLifecycleEventDto);

    const updateData: Partial<DriveLifecycleEvent> = {};
    if (updateDriveLifecycleEventDto.eventType !== undefined)
      updateData.eventType = updateDriveLifecycleEventDto.eventType;
    if (updateDriveLifecycleEventDto.triggeredBy !== undefined)
      updateData.triggeredBy = updateDriveLifecycleEventDto.triggeredBy;
    if (updateDriveLifecycleEventDto.contextMetadata !== undefined)
      updateData.contextMetadata = updateDriveLifecycleEventDto.contextMetadata;
    if (updateDriveLifecycleEventDto.physicalDriveId !== undefined)
      updateData.physicalDriveId = updateDriveLifecycleEventDto.physicalDriveId;

    await eventObject.update(updateData);
    return eventObject.reload({ include: [PhysicalDrive] });
  }

  async delete(id: string): Promise<boolean> {
    const eventObject = await this.driveLifecycleEventModel.findByPk(id);

    if (!eventObject) {
      throw new NotFoundException(
        `DriveLifecycleEvent with ID ${id} not found`,
      );
    }

    const deletedCount = await this.driveLifecycleEventModel.destroy({
      where: { id },
    });
    return deletedCount > 0;
  }
}
