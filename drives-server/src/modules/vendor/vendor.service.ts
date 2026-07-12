import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Vendor } from './entities/vendor.entity';
import { Country } from '../country/entities/country.entity'; // 🌟 Explicit context reference
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { QueryVendorDto } from './dto/query-vendor.dto';
import { PaginationService } from '../common/pagination/pagination.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response';

@Injectable()
export class VendorService {
  constructor(
    @InjectModel(Vendor)
    private readonly vendorModel: typeof Vendor,
    @InjectModel(Country)
    private readonly countryModel: typeof Country, // 🌟 Inject relation model dependency
    private readonly paginationService: PaginationService,
  ) {}

  // 🌟 Private helper to check foreign key constraints concurrently and aggregate errors
  private async validateForeignKeys(ids: {
    countryId?: string;
  }): Promise<void> {
    const checkPromises: Promise<string | null>[] = [];

    if (ids.countryId) {
      checkPromises.push(
        this.countryModel
          .findByPk(ids.countryId)
          .then((exists) =>
            exists ? null : `Country with ID ${ids.countryId} not found`,
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
    query?: QueryVendorDto,
  ): Promise<PaginatedResponse<Vendor & { itemNumber: number }>> {
    return this.paginationService.paginate<Vendor>(this.vendorModel, query);
  }

  async findOne(id: string): Promise<Vendor | null> {
    const vendor = await this.vendorModel.findByPk(id);

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    return vendor;
  }

  async create(createVendorDto: CreateVendorDto): Promise<Vendor> {
    const existingByName = await this.vendorModel.findOne({
      where: { name: createVendorDto.name },
    });

    if (existingByName) {
      throw new ConflictException(
        `Vendor with name "${createVendorDto.name}" already exists`,
      );
    }

    if (!createVendorDto.countryId) {
      throw new BadRequestException('countryId is required');
    }

    // 🌟 Validate countryId exists before committing creation block
    await this.validateForeignKeys(createVendorDto);

    const vendor = await this.vendorModel.create(createVendorDto as any);

    return vendor.reload();
  }

  async update(id: string, updateVendorDto: UpdateVendorDto): Promise<Vendor> {
    const vendor = await this.vendorModel.findByPk(id);

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    if (vendor.managed) {
      throw new ConflictException('System-managed vendors cannot be updated');
    }

    if (updateVendorDto.name) {
      const existing = await this.vendorModel.findOne({
        where: { name: updateVendorDto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Vendor with name "${updateVendorDto.name}" already exists`,
        );
      }
    }

    // 🌟 Validate countryId exists if passed down as a modification parameter
    await this.validateForeignKeys(updateVendorDto);

    const updateData: Partial<Vendor> = {};
    if (updateVendorDto.name !== undefined)
      updateData.name = updateVendorDto.name;
    if (updateVendorDto.isManufacturer !== undefined)
      updateData.isManufacturer = updateVendorDto.isManufacturer;
    if (updateVendorDto.isRetailer !== undefined)
      updateData.isRetailer = updateVendorDto.isRetailer;
    if (updateVendorDto.supportContactEmail !== undefined)
      updateData.supportContactEmail = updateVendorDto.supportContactEmail;
    if (updateVendorDto.portalUrl !== undefined)
      updateData.portalUrl = updateVendorDto.portalUrl;
    if (updateVendorDto.countryId !== undefined)
      updateData.countryId = updateVendorDto.countryId;

    await vendor.update(updateData);
    return vendor.reload({ include: [Country] });
  }

  async delete(id: string): Promise<boolean> {
    const vendor = await this.vendorModel.findByPk(id);

    if (!vendor) {
      throw new NotFoundException(`Vendor with ID ${id} not found`);
    }

    if (vendor.managed) {
      throw new ConflictException('System-managed vendors cannot be deleted');
    }

    const deletedCount = await this.vendorModel.destroy({ where: { id } });
    return deletedCount > 0;
  }
}
