import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { DriveLifecycleEvent } from './entities/drive-lifecycle-event.entity';
import { BaseCrudService } from '../base/base-crud.service';
import { CreateDriveLifecycleEventDto } from './dto/create-drive-lifecycle-event.dto';
import { UpdateDriveLifecycleEventDto } from './dto/update-drive-lifecycle-event.dto';
import { QueryDriveLifecycleEventDto } from './dto/query-drive-lifecycle-event.dto';
import { QueryBuilderService } from '../../common/services/query-builder/query-builder.service';
import { PaginatedResponse } from '../../common/interfaces/paginated-response';

@Injectable()
export class DriveLifecycleEventService
  extends BaseCrudService<DriveLifecycleEvent>
  implements OnModuleInit
{
  constructor(
    @InjectModel(DriveLifecycleEvent)
    private driveLifecycleEventModel: typeof DriveLifecycleEvent,
    protected queryBuilder: QueryBuilderService,
  ) {
    super(driveLifecycleEventModel, queryBuilder);
  }

  async onModuleInit() {}

  async createDriveLifecycleEvent(
    createDriveLifecycleEventDto: CreateDriveLifecycleEventDto,
  ): Promise<DriveLifecycleEvent> {
    return super.create(createDriveLifecycleEventDto);
  }

  async updateDriveLifecycleEvent(
    id: number,
    updateDriveLifecycleEventDto: UpdateDriveLifecycleEventDto,
  ): Promise<DriveLifecycleEvent> {
    const driveLifecycleEventObject = await super.findOne(id);

    if (!driveLifecycleEventObject) {
      throw new NotFoundException(
        `DriveLifecycleEvent with ID ${id} not found`,
      );
    }

    const updateData: Partial<DriveLifecycleEvent> = {};
    if (updateDriveLifecycleEventDto.contextMetadata !== undefined)
      updateData.contextMetadata = updateDriveLifecycleEventDto.contextMetadata;

    const result = await super.update(id, updateData);
    if (!result) {
      throw new NotFoundException(
        `DriveLifecycleEvent with ID ${id} not found`,
      );
    }
    return result;
  }

  async deleteDriveLifecycleEvent(id: number): Promise<boolean> {
    const driveLifecycleEventObject = await super.findOne(id);

    if (!driveLifecycleEventObject) {
      throw new NotFoundException(
        `DriveLifecycleEvent with ID ${id} not found`,
      );
    }

    return super.delete(id);
  }

  async findAllDriveLifecycleEvents(
    query?: QueryDriveLifecycleEventDto,
  ): Promise<PaginatedResponse<DriveLifecycleEvent>> {
    return super.findAll(query);
  }
}
