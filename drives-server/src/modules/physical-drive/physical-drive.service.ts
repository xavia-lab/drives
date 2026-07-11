import {
  Injectable,
  ConflictException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PhysicalDrive } from './entities/physical-drive.entity';
import { BaseCrudService } from '../base/base-crud.service';
import { CreatePhysicalDriveDto } from './dto/create-physical-drive.dto';
import { UpdatePhysicalDriveDto } from './dto/update-physical-drive.dto';
import { QueryPhysicalDriveDto } from './dto/query-physical-drive.dto';
import { QueryBuilderService } from '../../common/services/query-builder/query-builder.service';
import { PaginatedResponse } from '../../common/interfaces/paginated-response';

@Injectable()
export class PhysicalDriveService
  extends BaseCrudService<PhysicalDrive>
  implements OnModuleInit
{
  constructor(
    @InjectModel(PhysicalDrive)
    private physicalDriveModel: typeof PhysicalDrive,
    protected queryBuilder: QueryBuilderService,
  ) {
    super(physicalDriveModel, queryBuilder);
  }

  async onModuleInit() {
    await this.seedDefaultPhysicalDrives();
  }

  private async seedDefaultPhysicalDrives(): Promise<void> {
    const defaultPhysicalDrives: {
      serialNumber: string;
      worldwideNameWwn: string;
      acquisitionCost: number;
      purchaseDate: string;
      warrantyExpiryDate: string;
      storageModelId: number;
      retailerVendorId: number;
      currencyId: number;
    }[] = [];

    for (const physicalDriveData of defaultPhysicalDrives) {
      const existing = await this.physicalDriveModel.findOne({
        where: {
          serialNumber: physicalDriveData.serialNumber,
        },
      });

      if (!existing) {
        await this.physicalDriveModel.create({
          ...physicalDriveData,
          managed: true,
        });
        console.log(
          `Seeded default physical drive: ${physicalDriveData.serialNumber}`,
        );
      }
    }
  }

  async createPhysicalDrive(
    createPhysicalDriveDto: CreatePhysicalDriveDto,
  ): Promise<PhysicalDrive> {
    const existingByName = await this.physicalDriveModel.findOne({
      where: {
        serialNumber: createPhysicalDriveDto.serialNumber,
      },
    });

    if (existingByName) {
      throw new ConflictException(
        `PhysicalDrive with name "${createPhysicalDriveDto.serialNumber}" already exists`,
      );
    }

    return super.create(createPhysicalDriveDto);
  }

  async updatePhysicalDrive(
    id: number,
    updatePhysicalDriveDto: UpdatePhysicalDriveDto,
  ): Promise<PhysicalDrive> {
    const physicalDriveObject = await super.findOne(id);

    if (!physicalDriveObject) {
      throw new NotFoundException(`PhysicalDrive with ID ${id} not found`);
    }

    if (updatePhysicalDriveDto.serialNumber) {
      const existing = await this.physicalDriveModel.findOne({
        where: {
          serialNumber: updatePhysicalDriveDto.serialNumber,
        },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `PhysicalDrive with name "${updatePhysicalDriveDto.serialNumber}" already exists`,
        );
      }
    }

    const updateData: Partial<PhysicalDrive> = {};
    if (updatePhysicalDriveDto.serialNumber !== undefined)
      updateData.serialNumber = updatePhysicalDriveDto.serialNumber;
    if (updatePhysicalDriveDto.worldwideNameWwn !== undefined)
      updateData.worldwideNameWwn = updatePhysicalDriveDto.worldwideNameWwn;
    if (updatePhysicalDriveDto.acquisitionCost !== undefined)
      updateData.acquisitionCost = updatePhysicalDriveDto.acquisitionCost;
    if (updatePhysicalDriveDto.purchaseDate !== undefined)
      updateData.purchaseDate = updatePhysicalDriveDto.purchaseDate;
    if (updatePhysicalDriveDto.warrantyExpiryDate !== undefined)
      updateData.warrantyExpiryDate = updatePhysicalDriveDto.warrantyExpiryDate;
    if (updatePhysicalDriveDto.storageModelId !== undefined)
      updateData.storageModelId = updatePhysicalDriveDto.storageModelId;
    if (updatePhysicalDriveDto.retailerVendorId !== undefined)
      updateData.retailerVendorId = updatePhysicalDriveDto.retailerVendorId;
    if (updatePhysicalDriveDto.currencyId !== undefined)
      updateData.currencyId = updatePhysicalDriveDto.currencyId;

    const result = await super.update(id, updateData);
    if (!result) {
      throw new NotFoundException(`PhysicalDrive with ID ${id} not found`);
    }
    return result;
  }

  async deletePhysicalDrive(id: number): Promise<boolean> {
    const physicalDriveObject = await super.findOne(id);

    if (!physicalDriveObject) {
      throw new NotFoundException(`PhysicalDrive with ID ${id} not found`);
    }

    return super.delete(id);
  }

  async findAllPhysicalDrives(
    query?: QueryPhysicalDriveDto,
  ): Promise<PaginatedResponse<PhysicalDrive>> {
    return super.findAll(query);
  }
}
