import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { ServerSlot } from './entities/server-slot.entity';
import { Server } from '../server/entities/server.entity';
import { Interface } from '../interface/entities/interface.entity';
import { CreateServerSlotDto } from './dto/create-server-slot.dto';
import { UpdateServerSlotDto } from './dto/update-server-slot.dto';
import { QueryServerSlotDto } from './dto/query-server-slot.dto';
import { PaginationService } from '../common/pagination/pagination.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response';

@Injectable()
export class ServerSlotService {
  constructor(
    @InjectModel(ServerSlot)
    private readonly serverSlotModel: typeof ServerSlot,
    @InjectModel(Server)
    private readonly serverModel: typeof Server,
    @InjectModel(Interface)
    private readonly interfaceModel: typeof Interface,
    private readonly paginationService: PaginationService,
  ) {}

  // 🌟 Private helper to check foreign key constraints concurrently and aggregate errors
  private async validateForeignKeys(ids: {
    serverId?: string;
    supportedInterfaceId?: string;
  }): Promise<void> {
    const checkPromises: Promise<string | null>[] = [];

    if (ids.serverId) {
      checkPromises.push(
        this.serverModel
          .findByPk(ids.serverId)
          .then((exists) =>
            exists ? null : `Server with ID ${ids.serverId} not found`,
          ),
      );
    }
    if (ids.supportedInterfaceId) {
      checkPromises.push(
        this.interfaceModel
          .findByPk(ids.supportedInterfaceId)
          .then((exists) =>
            exists
              ? null
              : `Interface with ID ${ids.supportedInterfaceId} not found`,
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
    query?: QueryServerSlotDto,
  ): Promise<PaginatedResponse<ServerSlot & { itemNumber: number }>> {
    // Clean delegation to the standalone pagination service with relational inclusions
    return this.paginationService.paginate<ServerSlot>(
      this.serverSlotModel,
      query,
      {
        include: [Server, Interface],
      },
    );
  }

  async findOne(id: string): Promise<ServerSlot | null> {
    const slot = await this.serverSlotModel.findByPk(id, {
      include: [Server, Interface],
    });

    if (!slot) {
      throw new NotFoundException(`ServerSlot with ID ${id} not found`);
    }

    return slot;
  }

  async create(createServerSlotDto: CreateServerSlotDto): Promise<ServerSlot> {
    // 1. Composite Unique Constraint Check: Enforce uniqueness of slot label per server node
    const existingByLabel = await this.serverSlotModel.findOne({
      where: {
        serverId: createServerSlotDto.serverId,
        slotLabel: createServerSlotDto.slotLabel,
      },
    });

    if (existingByLabel) {
      throw new ConflictException(
        `ServerSlot with label "${createServerSlotDto.slotLabel}" already exists on server ${createServerSlotDto.serverId}`,
      );
    }

    // 🌟 Validate all incoming foreign keys concurrently before creation
    await this.validateForeignKeys(createServerSlotDto);

    const slot = await this.serverSlotModel.create(createServerSlotDto as any);
    return slot.reload({ include: [Server, Interface] });
  }

  async update(
    id: string,
    updateServerSlotDto: UpdateServerSlotDto,
  ): Promise<ServerSlot> {
    const slotObject = await this.serverSlotModel.findByPk(id);

    if (!slotObject) {
      throw new NotFoundException(`ServerSlot with ID ${id} not found`);
    }

    // Enforce unique name mapping within the target scope if columns change
    if (updateServerSlotDto.slotLabel || updateServerSlotDto.serverId) {
      const targetServer = updateServerSlotDto.serverId ?? slotObject.serverId;
      const targetLabel = updateServerSlotDto.slotLabel ?? slotObject.slotLabel;

      const existing = await this.serverSlotModel.findOne({
        where: { serverId: targetServer, slotLabel: targetLabel },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `ServerSlot with label "${targetLabel}" already exists on server ${targetServer}`,
        );
      }
    }

    // 🌟 Validate passed keys for existence if present in the payload modification parameters
    await this.validateForeignKeys(updateServerSlotDto);

    const updateData: Partial<ServerSlot> = {};
    if (updateServerSlotDto.slotLabel !== undefined)
      updateData.slotLabel = updateServerSlotDto.slotLabel;
    if (updateServerSlotDto.pcieBusAddress !== undefined)
      updateData.pcieBusAddress = updateServerSlotDto.pcieBusAddress;
    if (updateServerSlotDto.serverId !== undefined)
      updateData.serverId = updateServerSlotDto.serverId;
    if (updateServerSlotDto.supportedInterfaceId !== undefined)
      updateData.supportedInterfaceId =
        updateServerSlotDto.supportedInterfaceId;

    await slotObject.update(updateData);
    return slotObject.reload({ include: [Server, Interface] });
  }

  async delete(id: string): Promise<boolean> {
    const slotObject = await this.serverSlotModel.findByPk(id);

    if (!slotObject) {
      throw new NotFoundException(`ServerSlot with ID ${id} not found`);
    }

    const deletedCount = await this.serverSlotModel.destroy({ where: { id } });
    return deletedCount > 0;
  }
}
