import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Server } from './entities/server.entity';
import { CpuModel } from '../cpu-model/entities/cpu-model.entity';
import { OperatingSystem } from '../operating-system/entities/operating-system.entity';
import { Rack } from '../rack/entities/rack.entity';
import { CreateServerDto } from './dto/create-server.dto';
import { UpdateServerDto } from './dto/update-server.dto';
import { QueryServerDto } from './dto/query-server.dto';
import { PaginationService } from '../common/pagination/pagination.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response';

@Injectable()
export class ServerService {
  constructor(
    @InjectModel(Server)
    private readonly serverModel: typeof Server,
    @InjectModel(CpuModel)
    private readonly cpuModelModel: typeof CpuModel,
    @InjectModel(OperatingSystem)
    private readonly osModel: typeof OperatingSystem,
    @InjectModel(Rack)
    private readonly rackModel: typeof Rack,
    private readonly paginationService: PaginationService,
  ) {}

  // 🌟 Private helper to check foreign key constraints concurrently and aggregate errors
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
    query?: QueryServerDto,
  ): Promise<PaginatedResponse<Server & { itemNumber: number }>> {
    // Clean composition pagination with normalized inclusions
    return this.paginationService.paginate<Server>(this.serverModel, query, {
      include: [CpuModel, OperatingSystem, Rack],
    });
  }

  async findOne(id: string): Promise<Server | null> {
    const server = await this.serverModel.findByPk(id, {
      include: [CpuModel, OperatingSystem, Rack],
    });

    if (!server) {
      throw new NotFoundException(`Server with ID ${id} not found`);
    }

    return server;
  }

  async create(createServerDto: CreateServerDto): Promise<Server> {
    const existingByHostname = await this.serverModel.findOne({
      where: { hostname: createServerDto.hostname },
    });

    if (existingByHostname) {
      throw new ConflictException(
        `Server with hostname "${createServerDto.hostname}" already exists`,
      );
    }

    // 🌟 Concurrent check for all three normalized relational foreign keys
    await this.validateForeignKeys(createServerDto);

    const server = await this.serverModel.create(createServerDto as any);
    return server.reload({ include: [CpuModel, OperatingSystem, Rack] });
  }

  async update(id: string, updateServerDto: UpdateServerDto): Promise<Server> {
    const serverObject = await this.serverModel.findByPk(id);

    if (!serverObject) {
      throw new NotFoundException(`Server with ID ${id} not found`);
    }

    if (updateServerDto.hostname) {
      const existing = await this.serverModel.findOne({
        where: { hostname: updateServerDto.hostname },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Server with hostname "${updateServerDto.hostname}" already exists`,
        );
      }
    }

    // 🌟 Concurrent validation check on whatever modification references are passed
    await this.validateForeignKeys(updateServerDto);

    const updateData: Partial<Server> = {};
    if (updateServerDto.hostname !== undefined)
      updateData.hostname = updateServerDto.hostname;
    if (updateServerDto.totalRamMb !== undefined)
      updateData.totalRamMb = updateServerDto.totalRamMb;
    if (updateServerDto.cpuModelId !== undefined)
      updateData.cpuModelId = updateServerDto.cpuModelId;
    if (updateServerDto.cpuCount !== undefined)
      updateData.cpuCount = updateServerDto.cpuCount;
    if (updateServerDto.operatingSystemId !== undefined)
      updateData.operatingSystemId = updateServerDto.operatingSystemId;
    if (updateServerDto.rackId !== undefined)
      updateData.rackId = updateServerDto.rackId;
    if (updateServerDto.rackUnitPosition !== undefined)
      updateData.rackUnitPosition = updateServerDto.rackUnitPosition;

    await serverObject.update(updateData);
    return serverObject.reload({ include: [CpuModel, OperatingSystem, Rack] });
  }

  async delete(id: string): Promise<boolean> {
    const serverObject = await this.serverModel.findByPk(id);

    if (!serverObject) {
      throw new NotFoundException(`Server with ID ${id} not found`);
    }

    const deletedCount = await this.serverModel.destroy({ where: { id } });
    return deletedCount > 0;
  }
}
