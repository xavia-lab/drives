import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ServerSlotAllocation } from './entities/server-slot-allocation.entity';
import { ServerSlot } from '../server-slot/entities/server-slot.entity';
import { PhysicalDrive } from '../physical-drive/entities/physical-drive.entity';
import { User } from '../user/entities/user.entity';
import { CreateServerSlotAllocationDto } from './dto/create-server-slot-allocation.dto';
import { UpdateServerSlotAllocationDto } from './dto/update-server-slot-allocation.dto';
import { QueryServerSlotAllocationDto } from './dto/query-server-slot-allocation.dto';
import { PaginationService } from '../common/pagination/pagination.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response';

@Injectable()
export class ServerSlotAllocationService {
  constructor(
    @InjectModel(ServerSlotAllocation)
    private readonly allocationModel: typeof ServerSlotAllocation,
    @InjectModel(ServerSlot)
    private readonly serverSlotModel: typeof ServerSlot,
    @InjectModel(PhysicalDrive)
    private readonly physicalDriveModel: typeof PhysicalDrive,
    @InjectModel(User)
    private readonly userModel: typeof User,
    private readonly paginationService: PaginationService,
  ) {}

  // 🌟 Private helper to check foreign key constraints concurrently and aggregate errors
  private async validateForeignKeys(ids: {
    serverSlotId?: string;
    physicalDriveId?: string;
    userId?: string;
  }): Promise<void> {
    const checkPromises: Promise<string | null>[] = [];

    if (ids.serverSlotId) {
      checkPromises.push(
        this.serverSlotModel
          .findByPk(ids.serverSlotId)
          .then((exists) =>
            exists ? null : `ServerSlot with ID ${ids.serverSlotId} not found`,
          ),
      );
    }
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
    if (ids.userId) {
      checkPromises.push(
        this.userModel
          .findByPk(ids.userId)
          .then((exists) =>
            exists ? null : `User with ID ${ids.userId} not found`,
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
    query?: QueryServerSlotAllocationDto,
  ): Promise<PaginatedResponse<ServerSlotAllocation & { itemNumber: number }>> {
    // Clean delegation to the standalone pagination service with relational inclusions
    return this.paginationService.paginate<ServerSlotAllocation>(
      this.allocationModel,
      query,
      {
        include: [ServerSlot, PhysicalDrive, User],
      },
    );
  }

  async findOne(id: string): Promise<ServerSlotAllocation | null> {
    const allocation = await this.allocationModel.findByPk(id, {
      include: [ServerSlot, PhysicalDrive, User],
    });

    if (!allocation) {
      throw new NotFoundException(
        `ServerSlotAllocation with ID ${id} not found`,
      );
    }

    return allocation;
  }

  async create(
    createDto: CreateServerSlotAllocationDto,
  ): Promise<ServerSlotAllocation> {
    // 🌟 Validate all incoming foreign keys concurrently before adding to the ledger
    await this.validateForeignKeys(createDto);

    const allocation = await this.allocationModel.create(createDto as any);
    return allocation.reload({ include: [ServerSlot, PhysicalDrive, User] });
  }

  async update(
    id: string,
    updateDto: UpdateServerSlotAllocationDto,
  ): Promise<ServerSlotAllocation> {
    const allocationObject = await this.allocationModel.findByPk(id);

    if (!allocationObject) {
      throw new NotFoundException(
        `ServerSlotAllocation with ID ${id} not found`,
      );
    }

    // 🌟 Validate passed keys for existence if modified parameters are present
    await this.validateForeignKeys(updateDto);

    const updateData: Partial<ServerSlotAllocation> = {};
    if (updateDto.actionType !== undefined)
      updateData.actionType = updateDto.actionType;
    if (updateDto.serverSlotId !== undefined)
      updateData.serverSlotId = updateDto.serverSlotId;
    if (updateDto.physicalDriveId !== undefined)
      updateData.physicalDriveId = updateDto.physicalDriveId;
    if (updateDto.userId !== undefined) updateData.userId = updateDto.userId;
    if (updateDto.timestamp !== undefined)
      updateData.timestamp = new Date(updateDto.timestamp);

    await allocationObject.update(updateData);
    return allocationObject.reload({
      include: [ServerSlot, PhysicalDrive, User],
    });
  }

  async delete(id: string): Promise<boolean> {
    const allocationObject = await this.allocationModel.findByPk(id);

    if (!allocationObject) {
      throw new NotFoundException(
        `ServerSlotAllocation with ID ${id} not found`,
      );
    }

    const deletedCount = await this.allocationModel.destroy({ where: { id } });
    return deletedCount > 0;
  }
}
