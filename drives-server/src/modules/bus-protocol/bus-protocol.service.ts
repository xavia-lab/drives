import {
  Injectable,
  ConflictException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BusProtocol } from './entities/bus-protocol.entity';
import { CreateBusProtocolDto } from './dto/create-bus-protocol.dto';
import { UpdateBusProtocolDto } from './dto/update-bus-protocol.dto';
import { QueryBusProtocolDto } from './dto/query-bus-protocol.dto';
import { PaginationService } from '../common/pagination/pagination.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response';

@Injectable()
export class BusProtocolService implements OnModuleInit {
  constructor(
    @InjectModel(BusProtocol)
    private readonly busProtocolModel: typeof BusProtocol,
    private readonly paginationService: PaginationService, // 🌟 Clean composition injection
  ) {}

  async onModuleInit() {
    await this.seedDefaultBusProtocols();
  }

  private async seedDefaultBusProtocols(): Promise<void> {
    const defaultBusProtocols: {
      name: string;
      commandSet: string;
      supportsHotPlug: boolean;
    }[] = [];

    for (const busProtocolData of defaultBusProtocols) {
      const existing = await this.busProtocolModel.findOne({
        where: { name: busProtocolData.name },
      });

      if (!existing) {
        await this.busProtocolModel.create({
          ...busProtocolData,
          managed: true,
        });
        console.log(`Seeded default BusProtocol: ${busProtocolData.name}`);
      }
    }
  }

  async findAll(
    query?: QueryBusProtocolDto,
  ): Promise<PaginatedResponse<BusProtocol & { itemNumber: number }>> {
    // 🌟 Clean delegation to the standalone service
    return this.paginationService.paginate<BusProtocol>(
      this.busProtocolModel,
      query,
    );
  }

  async findOne(id: string): Promise<BusProtocol | null> {
    return this.busProtocolModel.findByPk(id);
  }

  async createBusProtocol(
    createBusProtocolDto: CreateBusProtocolDto,
  ): Promise<BusProtocol> {
    const existingByName = await this.busProtocolModel.findOne({
      where: { name: createBusProtocolDto.name },
    });

    if (existingByName) {
      throw new ConflictException(
        `BusProtocol with name "${createBusProtocolDto.name}" already exists`,
      );
    }

    return this.busProtocolModel.create(createBusProtocolDto as any);
  }

  async updateBusProtocol(
    id: string,
    updateBusProtocolDto: UpdateBusProtocolDto,
  ): Promise<BusProtocol> {
    const busProtocol = await this.busProtocolModel.findByPk(id);

    if (!busProtocol) {
      throw new NotFoundException(`BusProtocol with ID ${id} not found`);
    }

    if (busProtocol.managed) {
      throw new ConflictException(
        'System-managed BusProtocols cannot be updated',
      );
    }

    if (updateBusProtocolDto.name) {
      const existing = await this.busProtocolModel.findOne({
        where: { name: updateBusProtocolDto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `BusProtocol with name "${updateBusProtocolDto.name}" already exists`,
        );
      }
    }

    // Filter down to only passed payload items to keep the query clean
    const updateData: Partial<BusProtocol> = {};
    if (updateBusProtocolDto.name !== undefined)
      updateData.name = updateBusProtocolDto.name;
    if (updateBusProtocolDto.commandSet !== undefined)
      updateData.commandSet = updateBusProtocolDto.commandSet;
    if (updateBusProtocolDto.supportsHotPlug !== undefined)
      updateData.supportsHotPlug = updateBusProtocolDto.supportsHotPlug;
    if (updateBusProtocolDto.managed !== undefined)
      updateData.managed = updateBusProtocolDto.managed;

    return busProtocol.update(updateData);
  }

  async deleteBusProtocol(id: string): Promise<boolean> {
    const busProtocol = await this.busProtocolModel.findByPk(id);

    if (!busProtocol) {
      throw new NotFoundException(`BusProtocol with ID ${id} not found`);
    }

    if (busProtocol.managed) {
      throw new ConflictException(
        'System-managed BusProtocols cannot be deleted',
      );
    }

    const deletedCount = await this.busProtocolModel.destroy({ where: { id } });
    return deletedCount > 0;
  }
}
