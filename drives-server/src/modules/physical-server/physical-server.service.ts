import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { PhysicalServer } from './entities/physical-server.entity';
import { CpuModel } from '../cpu-model/entities/cpu-model.entity';
import { OperatingSystem } from '../operating-system/entities/operating-system.entity';
import { Rack } from '../rack/entities/rack.entity';
import { CreatePhysicalServerDto } from './dto/create-physical-server.dto';
import { UpdatePhysicalServerDto } from './dto/update-physical-server.dto';
import { QueryPhysicalServerDto } from './dto/query-physical-server.dto';
import { PaginationService } from '../common/pagination/pagination.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response';

@Injectable()
export class PhysicalServerService {
  constructor(
    @InjectModel(PhysicalServer)
    private readonly physicalServerModel: typeof PhysicalServer,
    @InjectModel(CpuModel)
    private readonly cpuModelModel: typeof CpuModel,
    @InjectModel(OperatingSystem)
    private readonly osModel: typeof OperatingSystem,
    @InjectModel(Rack)
    private readonly rackModel: typeof Rack,
    private readonly paginationService: PaginationService,
  ) {}

  private async validateForeignKeys(ids: {
    cpuModelId?: string;
    operatingSystemId?: string;
    rackId?: string;
  }): Promise<void> {
    const checkPromises: Promise<string | null>[] = [];

    if (ids.cpuModelId) {
      checkPromises.push(
        this.cpuModelModel
          .findByPk(ids.cpuModelId)
          .then((exists) =>
            exists ? null : `CpuModel with ID ${ids.cpuModelId} not found`,
          ),
      );
    }
    if (ids.operatingSystemId) {
      checkPromises.push(
        this.osModel
          .findByPk(ids.operatingSystemId)
          .then((exists) =>
            exists
              ? null
              : `OperatingSystem with ID ${ids.operatingSystemId} not found`,
          ),
      );
    }
    if (ids.rackId) {
      checkPromises.push(
        this.rackModel
          .findByPk(ids.rackId)
          .then((exists) =>
            exists ? null : `Rack with ID ${ids.rackId} not found`,
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
    query?: QueryPhysicalServerDto,
  ): Promise<PaginatedResponse<PhysicalServer>> {
    return this.paginationService.paginate<PhysicalServer>(
      this.physicalServerModel,
      query,
    );
  }

  async findOne(id: string): Promise<PhysicalServer | null> {
    const physicalServer = await this.physicalServerModel.findByPk(id);

    if (!physicalServer) {
      throw new NotFoundException(`PhysicalServer with ID ${id} not found`);
    }

    return physicalServer;
  }

  async create(createDto: CreatePhysicalServerDto): Promise<PhysicalServer> {
    const existingByHostname = await this.physicalServerModel.findOne({
      where: { hostname: createDto.hostname },
    });

    if (existingByHostname) {
      throw new ConflictException(
        `PhysicalServer with hostname "${createDto.hostname}" already exists`,
      );
    }

    await this.validateForeignKeys(createDto);

    return this.physicalServerModel.create(
      createDto as Partial<PhysicalServer>,
    );
  }

  async update(
    id: string,
    updateDto: UpdatePhysicalServerDto,
  ): Promise<PhysicalServer> {
    const physicalServer = await this.physicalServerModel.findByPk(id);

    if (!physicalServer) {
      throw new NotFoundException(`PhysicalServer with ID ${id} not found`);
    }

    if (updateDto.hostname) {
      const existing = await this.physicalServerModel.findOne({
        where: { hostname: updateDto.hostname },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `PhysicalServer with hostname "${updateDto.hostname}" already exists`,
        );
      }
    }

    await this.validateForeignKeys(updateDto);

    const updateData: Partial<PhysicalServer> = {};
    if (updateDto.hostname !== undefined)
      updateData.hostname = updateDto.hostname;
    if (updateDto.memoryValue !== undefined)
      updateData.memoryValue = updateDto.memoryValue;
    if (updateDto.memoryUnit !== undefined)
      updateData.memoryUnit = updateDto.memoryUnit;
    if (updateDto.cpuModelId !== undefined)
      updateData.cpuModelId = updateDto.cpuModelId;
    if (updateDto.cpuCount !== undefined)
      updateData.cpuCount = updateDto.cpuCount;
    if (updateDto.operatingSystemId !== undefined)
      updateData.operatingSystemId = updateDto.operatingSystemId;
    if (updateDto.rackId !== undefined) updateData.rackId = updateDto.rackId;
    if (updateDto.rackUnitPosition !== undefined)
      updateData.rackUnitPosition = updateDto.rackUnitPosition;

    await physicalServer.update(updateData);
    return physicalServer;
  }

  async delete(id: string): Promise<boolean> {
    const physicalServer = await this.physicalServerModel.findByPk(id);

    if (!physicalServer) {
      throw new NotFoundException(`PhysicalServer with ID ${id} not found`);
    }

    const deletedCount = await this.physicalServerModel.destroy({
      where: { id },
    });
    return deletedCount > 0;
  }
}
