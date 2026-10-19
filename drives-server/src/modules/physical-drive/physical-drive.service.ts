import {
  Injectable,
  ConflictException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/sequelize';
import { Op, Transaction, Order, Includeable } from 'sequelize';
import { Sequelize } from 'sequelize-typescript';
import { PhysicalDrive } from './entities/physical-drive.entity';
import { PhysicalDriveLocation } from './entities/physical-drive-location.entity';
import { DriveModel } from '../drive-model/entities/drive-model.entity';
import { Vendor } from '../vendor/entities/vendor.entity';
import { Currency } from '../currency/entities/currency.entity';
import { Datacenter } from '../datacenter/entities/datacenter.entity';
import { CreatePhysicalDriveDto } from './dto/create-physical-drive.dto';
import { UpdatePhysicalDriveDto } from './dto/update-physical-drive.dto';
import { QueryPhysicalDriveDto } from './dto/query-physical-drive.dto';
import { CreatePhysicalDriveLocationDto } from './dto/create-physical-drive-location.dto';
import { PaginationService } from '../common/pagination/pagination.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response';
import { ServerSlotAllocationService } from '../server-slot-allocation/server-slot-allocation.service';

interface CurrentDriveLocation {
  id: string;
  datacenterId: string;
  code: string;
  name: string;
  locatedAt: Date;
  notes: string | null;
}

const CURRENT_LOCATION_MAP_ORDER: Order = [
  ['physicalDriveId', 'ASC'],
  ['locatedAt', 'DESC'],
  ['displayKey', 'DESC'],
];

@Injectable()
export class PhysicalDriveService implements OnModuleInit {
  constructor(
    @InjectModel(PhysicalDrive)
    private readonly physicalDriveModel: typeof PhysicalDrive,
    @InjectModel(PhysicalDriveLocation)
    private readonly physicalDriveLocationModel: typeof PhysicalDriveLocation,
    @InjectModel(DriveModel)
    private readonly driveModelModel: typeof DriveModel,
    @InjectModel(Vendor)
    private readonly vendorModel: typeof Vendor,
    @InjectModel(Currency)
    private readonly currencyModel: typeof Currency,
    @InjectModel(Datacenter)
    private readonly datacenterModel: typeof Datacenter,
    private readonly allocationService: ServerSlotAllocationService,
    private readonly paginationService: PaginationService, // 🌟 Clean composition injection
    @InjectConnection()
    private readonly sequelize: Sequelize,
  ) {}

  async onModuleInit() {}

  // Relations eagerly loaded for single-record reads: the full location log
  // plus the resolved datacenter of each event. Timeline order is applied in
  // JS because Sequelize ignores `order` on an `include`.
  private get readIncludes(): Includeable[] {
    return [
      {
        model: PhysicalDriveLocation,
        as: 'locations',
        include: [Datacenter],
      },
    ];
  }

  // Ascending chronology: oldest first, `displayKey` breaking ties.
  private sortLocations(
    locations: PhysicalDriveLocation[],
  ): PhysicalDriveLocation[] {
    return [...locations].sort((a, b) => {
      const delta =
        new Date(a.locatedAt).getTime() - new Date(b.locatedAt).getTime();
      if (delta !== 0) return delta;
      return (a.displayKey ?? 0) - (b.displayKey ?? 0);
    });
  }

  // Derives the current location from a single (latest) event.
  private mapCurrentLocation(
    location?: PhysicalDriveLocation | null,
  ): CurrentDriveLocation | null {
    if (!location) {
      return null;
    }

    return {
      id: location.id,
      datacenterId: location.datacenterId,
      code: location.datacenter?.code ?? '',
      name: location.datacenter?.name ?? '',
      locatedAt: location.locatedAt,
      notes: location.notes ?? null,
    };
  }

  // Sorts an already-loaded location log and stamps the derived `currentLocation`.
  private decorateLocations(drive: PhysicalDrive): PhysicalDrive {
    const locations = this.sortLocations(drive.locations ?? []);
    drive.setDataValue('locations', locations);
    const latest =
      locations.length > 0 ? locations[locations.length - 1] : null;
    drive.setDataValue('currentLocation', this.mapCurrentLocation(latest));
    return drive;
  }

  // Stamps the derived `currentAssignment` (the server/slot the drive is
  // currently seated in) from the slot allocation ledger.
  private async attachCurrentAssignment(
    drive: PhysicalDrive,
  ): Promise<PhysicalDrive> {
    const assignments =
      await this.allocationService.getCurrentAssignmentsForDrives([drive.id]);
    drive.setDataValue('currentAssignment', assignments.get(drive.id) ?? null);
    return drive;
  }

  // Loads a single drive with its full location timeline and a derived
  // `currentLocation`. Throws when the drive does not exist.
  private async loadWithLocations(
    id: string,
    transaction?: Transaction,
  ): Promise<PhysicalDrive> {
    const drive = await this.physicalDriveModel.findByPk(id, {
      include: this.readIncludes,
      transaction,
    });

    if (!drive) {
      throw new NotFoundException(`PhysicalDrive with ID ${id} not found`);
    }

    return this.attachCurrentAssignment(this.decorateLocations(drive));
  }

  // Returns the latest location event for a single drive (or null when there is
  // no history).
  private async getLatestLocation(
    physicalDriveId: string,
    transaction?: Transaction,
  ): Promise<PhysicalDriveLocation | null> {
    return this.physicalDriveLocationModel.findOne({
      where: { physicalDriveId },
      order: [
        ['locatedAt', 'DESC'],
        ['displayKey', 'DESC'],
      ],
      transaction,
    });
  }

  // Batched "current location" derivation for a set of drives: one query,
  // reduce to the latest event per drive in memory.
  private async getCurrentLocationMap(
    driveIds: string[],
  ): Promise<Map<string, CurrentDriveLocation | null>> {
    const map = new Map<string, CurrentDriveLocation | null>();
    if (driveIds.length === 0) {
      return map;
    }

    const events = await this.physicalDriveLocationModel.findAll({
      where: { physicalDriveId: { [Op.in]: driveIds } },
      include: [Datacenter],
      order: CURRENT_LOCATION_MAP_ORDER,
    });

    for (const event of events) {
      if (!map.has(event.physicalDriveId)) {
        map.set(event.physicalDriveId, this.mapCurrentLocation(event));
      }
    }
    for (const id of driveIds) {
      if (!map.has(id)) {
        map.set(id, null);
      }
    }

    return map;
  }

  // 🌟 Optimized private helper to check foreign key constraints concurrently and aggregate errors
  private async validateForeignKeys(ids: {
    driveModelId?: string;
    retailerVendorId?: string;
    currencyId?: string;
  }): Promise<void> {
    const checkPromises: Promise<string | null>[] = [];

    if (ids.driveModelId) {
      checkPromises.push(
        this.driveModelModel
          .findByPk(ids.driveModelId)
          .then((exists) =>
            exists ? null : `DriveModel with ID ${ids.driveModelId} not found`,
          ),
      );
    }
    if (ids.retailerVendorId) {
      checkPromises.push(
        this.vendorModel
          .findByPk(ids.retailerVendorId)
          .then((exists) =>
            exists
              ? null
              : `Retailer Vendor with ID ${ids.retailerVendorId} not found`,
          ),
      );
    }
    if (ids.currencyId) {
      checkPromises.push(
        this.currencyModel
          .findByPk(ids.currencyId)
          .then((exists) =>
            exists ? null : `Currency with ID ${ids.currencyId} not found`,
          ),
      );
    }

    const results = await Promise.all(checkPromises);
    const errors = results.filter((error): error is string => error !== null);

    if (errors.length > 0) {
      throw new NotFoundException(errors.join('\n'));
    }
  }

  // Resolves the ids of drives whose *current* (latest) location is one of the
  // given datacenters. Used to translate the derived `currentLocation` filter
  // into a concrete `id IN (...)` clause.
  private async getDriveIdsByCurrentDatacenter(
    datacenterIds: string[],
  ): Promise<string[]> {
    if (datacenterIds.length === 0) {
      return [];
    }

    const events = await this.physicalDriveLocationModel.findAll({
      where: { datacenterId: { [Op.in]: datacenterIds } },
      attributes: ['physicalDriveId'],
    });

    const candidateIds = Array.from(
      new Set(events.map((event) => event.physicalDriveId)),
    );
    if (candidateIds.length === 0) {
      return [];
    }

    const currentLocationMap = await this.getCurrentLocationMap(candidateIds);
    return candidateIds.filter((driveId) =>
      datacenterIds.includes(
        currentLocationMap.get(driveId)?.datacenterId ?? '',
      ),
    );
  }

  async findAll(
    query?: QueryPhysicalDriveDto,
  ): Promise<PaginatedResponse<PhysicalDrive>> {
    // Translate the derived `currentLocation` filter (a datacenter id list) into
    // an `id IN (...)` clause, then delegate the rest to the pagination service.
    let customWhere: Record<string, unknown> = {};
    let effectiveQuery = query;

    if (query?.filterField === 'currentLocation' && query.filterValue) {
      const datacenterIds = String(query.filterValue)
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean);

      const driveIds = await this.getDriveIdsByCurrentDatacenter(datacenterIds);
      customWhere = { id: { [Op.in]: driveIds } };
      effectiveQuery = {
        ...query,
        filterField: undefined,
        filterOperator: undefined,
        filterValue: undefined,
      };
    }

    const result = await this.paginationService.paginate<PhysicalDrive>(
      this.physicalDriveModel,
      effectiveQuery,
      { where: customWhere },
    );

    const driveIds = result.data.map((drive) => drive.id);
    const currentLocationMap = await this.getCurrentLocationMap(driveIds);
    for (const drive of result.data) {
      drive.setDataValue(
        'currentLocation',
        currentLocationMap.get(drive.id) ?? null,
      );
    }

    return result;
  }

  async findOne(id: string): Promise<PhysicalDrive | null> {
    const drive = await this.physicalDriveModel.findByPk(id, {
      include: this.readIncludes,
    });

    if (!drive) {
      return null;
    }

    return this.attachCurrentAssignment(this.decorateLocations(drive));
  }

  async create(
    createPhysicalDriveDto: CreatePhysicalDriveDto,
  ): Promise<PhysicalDrive> {
    const existingBySerial = await this.physicalDriveModel.findOne({
      where: {
        serialNumber: createPhysicalDriveDto.serialNumber,
      },
    });

    if (existingBySerial) {
      throw new ConflictException(
        `PhysicalDrive with serial number "${createPhysicalDriveDto.serialNumber}" already exists`,
      );
    }

    // 🌟 Aggregate check for all incoming foreign keys concurrently
    await this.validateForeignKeys(createPhysicalDriveDto);

    return this.physicalDriveModel.create(
      createPhysicalDriveDto as Partial<PhysicalDrive>,
    );
  }

  async update(
    id: string,
    updatePhysicalDriveDto: UpdatePhysicalDriveDto,
  ): Promise<PhysicalDrive> {
    const physicalDriveObject = await this.physicalDriveModel.findByPk(id);

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
          `PhysicalDrive with serial number "${updatePhysicalDriveDto.serialNumber}" already exists`,
        );
      }
    }

    // 🌟 Validate passed keys for existence before performing the data update loop
    await this.validateForeignKeys(updatePhysicalDriveDto);

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
    if (updatePhysicalDriveDto.driveModelId !== undefined)
      updateData.driveModelId = updatePhysicalDriveDto.driveModelId;
    if (updatePhysicalDriveDto.retailerVendorId !== undefined)
      updateData.retailerVendorId = updatePhysicalDriveDto.retailerVendorId;
    if (updatePhysicalDriveDto.currencyId !== undefined)
      updateData.currencyId = updatePhysicalDriveDto.currencyId;

    return physicalDriveObject.update(updateData);
  }

  // Records a location event for a drive by appending a new row. The drive row
  // is locked so concurrent moves on the same drive serialize. Re-recording the
  // drive's current datacenter is rejected so the log stays meaningful.
  async recordLocation(
    id: string,
    dto: CreatePhysicalDriveLocationDto,
  ): Promise<PhysicalDrive> {
    return this.sequelize.transaction(async (transaction) => {
      const drive = await this.physicalDriveModel.findByPk(id, {
        transaction,
        lock: transaction.LOCK.UPDATE,
      });

      if (!drive) {
        throw new NotFoundException(`PhysicalDrive with ID ${id} not found`);
      }

      const datacenter = await this.datacenterModel.findByPk(dto.datacenterId, {
        transaction,
      });
      if (!datacenter) {
        throw new NotFoundException(
          `Datacenter with ID ${dto.datacenterId} not found`,
        );
      }

      const latest = await this.getLatestLocation(id, transaction);
      if (latest && latest.datacenterId === dto.datacenterId) {
        throw new ConflictException(
          `PhysicalDrive with ID ${id} is already located in datacenter ${dto.datacenterId}.`,
        );
      }

      await this.physicalDriveLocationModel.create(
        {
          physicalDriveId: id,
          datacenterId: dto.datacenterId,
          locatedAt: dto.locatedAt ? new Date(dto.locatedAt) : new Date(),
          notes: dto.notes ?? null,
        } as Partial<PhysicalDriveLocation>,
        { transaction },
      );

      return this.loadWithLocations(id, transaction);
    });
  }

  async delete(id: string): Promise<boolean> {
    const physicalDriveObject = await this.physicalDriveModel.findByPk(id);

    if (!physicalDriveObject) {
      throw new NotFoundException(`PhysicalDrive with ID ${id} not found`);
    }

    const deletedCount = await this.physicalDriveModel.destroy({
      where: { id },
    });
    return deletedCount > 0;
  }
}
