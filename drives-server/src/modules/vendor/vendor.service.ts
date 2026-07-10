import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Vendor } from './entities/vendor.entity';
import { Country } from '../country/entities/country.entity';
import { Sequelize } from 'sequelize-typescript';
import { Transaction } from 'sequelize';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { QueryBuilderService } from '../../common/services/query-builder/query-builder.service';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { UpdateVendorDto } from './dto/update-vendor.dto';
import { PaginatedResponse } from '../../common/interfaces/paginated-response';

@Injectable()
export class VendorService {
  constructor(
    @InjectModel(Vendor) private vendorRepository: typeof Vendor,
    @InjectModel(Country) private countryRepository: typeof Country,
    private sequelize: Sequelize,
    protected queryBuilder: QueryBuilderService,
  ) {}

  private readonly logger = new Logger(VendorService.name);

  public async findAll(
    query?: PaginationQueryDto,
  ): Promise<PaginatedResponse<Vendor>> {
    try {
      const options = this.queryBuilder.buildQueryOptions(query ?? {});

      const { count, rows } = await this.vendorRepository.findAndCountAll({
        ...options,
        include: [Country],
        distinct: true,
      });

      // TypeScript is happy now because query is guaranteed to exist
      const limit = options.limit || Number(query?.pageSize) || 10;
      const page = Number(query?.pageNumber) || 1;
      const totalPages = Math.ceil(count / limit);

      return new PaginatedResponse(rows, count, page, limit, totalPages);
    } catch (error) {
      this.logger.error('Error in finding all vendor records:', error);
      throw new InternalServerErrorException(
        `Could not retrieve vendor records`,
        error,
      );
    }
  }

  async findOne(id: number): Promise<Vendor> {
    const vendor = await this.vendorRepository.findByPk(id, {
      include: [Country],
    });
    if (!vendor) {
      throw new NotFoundException('Vendor not found');
    }
    return vendor;
  }

  async create(createVendorDto: CreateVendorDto): Promise<Vendor> {
    const existingByName = await this.vendorRepository.findOne({
      where: { name: createVendorDto.name },
    });

    if (existingByName) {
      throw new ConflictException(
        `Vendor with name "${createVendorDto.name}" already exists`,
      );
    }

    const {
      name,
      isManufacturer,
      isRetailer,
      supportContactEmail,
      portalUrl,
      countryId,
    } = createVendorDto;
    if (!name) {
      throw new BadRequestException('Name is required');
    }

    if (!countryId) {
      throw new BadRequestException('countryId is required');
    }

    return this.sequelize.transaction(async (t: Transaction) => {
      const vendor = await this.vendorRepository.create(
        {
          name: name,
          isManufacturer: isManufacturer,
          isRetailer: isRetailer,
          supportContactEmail: supportContactEmail || null,
          portalUrl: portalUrl || null,
          countryId: countryId,
        },
        { transaction: t },
      );

      return vendor.reload({ include: [Country], transaction: t });
    });
  }

  async update(id: number, updateVendorDto: UpdateVendorDto): Promise<Vendor> {
    const {
      name,
      isManufacturer,
      isRetailer,
      supportContactEmail,
      portalUrl,
      countryId,
    } = updateVendorDto;

    return this.sequelize.transaction(async (t: Transaction) => {
      const vendor = await this.vendorRepository.findByPk(id, {
        transaction: t,
      });

      if (!vendor) {
        throw new NotFoundException('Vendor not found');
      }

      // 1. Update Vendor fields
      await vendor.update(
        {
          name: name,
          isManufacturer: isManufacturer,
          isRetailer: isRetailer,
          supportContactEmail: supportContactEmail || null,
          portalUrl: portalUrl || null,
          countryId: countryId,
        },
        { transaction: t },
      );

      return vendor.reload({ include: [Country], transaction: t });
    });
  }

  async delete(id: number): Promise<boolean> {
    return this.sequelize.transaction(async (t: Transaction) => {
      // 1. Fetch with explicit attributes
      const vendor = await this.vendorRepository.findByPk(id, {
        transaction: t,
        attributes: ['id'],
      });

      if (!vendor) {
        throw new NotFoundException(`Vendor with ID ${id} not found`);
      }

      // 5. Delete the vendor
      await vendor.destroy({ transaction: t });

      return true;
    });
  }
}
