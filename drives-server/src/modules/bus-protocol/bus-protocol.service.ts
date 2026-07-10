import {
  Injectable,
  ConflictException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { BusProtocol } from './entities/bus-protocol.entity';
import { BaseCrudService } from '../base/base-crud.service';
import { CreateBusProtocolDto } from './dto/create-bus-protocol.dto';
import { UpdateBusProtocolDto } from './dto/update-bus-protocol.dto';
import { QueryBusProtocolDto } from './dto/query-bus-protocol.dto';
import { QueryBuilderService } from '../../common/services/query-builder/query-builder.service';
import { PaginatedResponse } from '../../common/interfaces/paginated-response';

@Injectable()
export class BusProtocolService
  extends BaseCrudService<BusProtocol>
  implements OnModuleInit
{
  constructor(
    @InjectModel(BusProtocol)
    private BusProtocolModel: typeof BusProtocol,
    protected queryBuilder: QueryBuilderService,
  ) {
    super(BusProtocolModel, queryBuilder);
  }

  async onModuleInit() {
    await this.seedDefaultBusProtocols();
  }

  private async seedDefaultBusProtocols(): Promise<void> {
    const defaultBusProtocols: {
      name: string;
      commandSet: string;
      supportsHotPlug: boolean;
    }[] = [];

    for (const BusProtocolData of defaultBusProtocols) {
      const existing = await this.BusProtocolModel.findOne({
        where: { name: BusProtocolData.name },
      });

      if (!existing) {
        await this.BusProtocolModel.create({
          ...BusProtocolData,
          managed: true,
        });
        console.log(`Seeded default BusProtocol: ${BusProtocolData.name}`);
      }
    }
  }

  async createBusProtocol(
    createBusProtocolDto: CreateBusProtocolDto,
  ): Promise<BusProtocol> {
    const existingByName = await this.BusProtocolModel.findOne({
      where: { name: createBusProtocolDto.name },
    });

    if (existingByName) {
      throw new ConflictException(
        `BusProtocol with name "${createBusProtocolDto.name}" already exists`,
      );
    }

    return super.create(createBusProtocolDto);
  }

  async updateBusProtocol(
    id: number,
    updateBusProtocolDto: UpdateBusProtocolDto,
  ): Promise<BusProtocol> {
    const BusProtocol = await super.findOne(id);

    if (!BusProtocol) {
      throw new NotFoundException(`BusProtocol with ID ${id} not found`);
    }

    if (BusProtocol.managed) {
      throw new ConflictException(
        'System-managed BusProtocols cannot be updated',
      );
    }

    if (updateBusProtocolDto.name) {
      const existing = await this.BusProtocolModel.findOne({
        where: { name: updateBusProtocolDto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `BusProtocol with name "${updateBusProtocolDto.name}" already exists`,
        );
      }
    }

    const updateData: Partial<BusProtocol> = {};
    if (updateBusProtocolDto.name !== undefined)
      updateData.name = updateBusProtocolDto.name;
    if (updateBusProtocolDto.commandSet !== undefined)
      updateData.commandSet = updateBusProtocolDto.commandSet;
    if (updateBusProtocolDto.supportsHotPlug !== undefined)
      updateData.supportsHotPlug = updateBusProtocolDto.supportsHotPlug;
    if (updateBusProtocolDto.managed !== undefined)
      updateData.managed = updateBusProtocolDto.managed;

    const result = await super.update(id, updateData);
    if (!result) {
      throw new NotFoundException(`BusProtocol with ID ${id} not found`);
    }
    return result;
  }

  async deleteBusProtocol(id: number): Promise<boolean> {
    const BusProtocol = await super.findOne(id);

    if (!BusProtocol) {
      throw new NotFoundException(`BusProtocol with ID ${id} not found`);
    }

    if (BusProtocol.managed) {
      throw new ConflictException(
        'System-managed BusProtocols cannot be deleted',
      );
    }

    return super.delete(id);
  }

  async findAllBusProtocols(
    query?: QueryBusProtocolDto,
  ): Promise<PaginatedResponse<BusProtocol>> {
    return super.findAll(query);
  }
}
