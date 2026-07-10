import {
  Injectable,
  ConflictException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Interface } from './entities/interface.entity';
import { BaseCrudService } from '../base/base-crud.service';
import { CreateInterfaceDto } from './dto/create-interface.dto';
import { UpdateInterfaceDto } from './dto/update-interface.dto';
import { QueryInterfaceDto } from './dto/query-interface.dto';
import { QueryBuilderService } from '../../common/services/query-builder/query-builder.service';
import { PaginatedResponse } from '../../common/interfaces/paginated-response';

@Injectable()
export class InterfaceService
  extends BaseCrudService<Interface>
  implements OnModuleInit
{
  constructor(
    @InjectModel(Interface)
    private interfaceModel: typeof Interface,
    protected queryBuilder: QueryBuilderService,
  ) {
    super(interfaceModel, queryBuilder);
  }

  async onModuleInit() {
    await this.seedDefaultInterfaces();
  }

  private async seedDefaultInterfaces(): Promise<void> {
    const defaultInterfaces: {
      name: string;
      linkGeneration: number;
      throughput: number;
      busProtocolId: number;
    }[] = [];

    for (const interfaceData of defaultInterfaces) {
      const existing = await this.interfaceModel.findOne({
        where: { name: interfaceData.name },
      });

      if (!existing) {
        await this.interfaceModel.create({
          ...interfaceData,
          managed: true,
        });
        console.log(`Seeded default interface: ${interfaceData.name}`);
      }
    }
  }

  async createInterface(
    createInterfaceDto: CreateInterfaceDto,
  ): Promise<Interface> {
    const existingByName = await this.interfaceModel.findOne({
      where: { name: createInterfaceDto.name },
    });

    if (existingByName) {
      throw new ConflictException(
        `Interface with name "${createInterfaceDto.name}" already exists`,
      );
    }

    return super.create(createInterfaceDto);
  }

  async updateInterface(
    id: number,
    updateInterfaceDto: UpdateInterfaceDto,
  ): Promise<Interface> {
    const interfaceObject = await super.findOne(id);

    if (!interfaceObject) {
      throw new NotFoundException(`Interface with ID ${id} not found`);
    }

    if (interfaceObject.managed) {
      throw new ConflictException(
        'System-managed interfaces cannot be updated',
      );
    }

    if (updateInterfaceDto.name) {
      const existing = await this.interfaceModel.findOne({
        where: { name: updateInterfaceDto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Interface with name "${updateInterfaceDto.name}" already exists`,
        );
      }
    }

    const updateData: Partial<Interface> = {};
    if (updateInterfaceDto.name !== undefined)
      updateData.name = updateInterfaceDto.name;
    if (updateInterfaceDto.linkGeneration !== undefined)
      updateData.linkGeneration = updateInterfaceDto.linkGeneration;
    if (updateInterfaceDto.throughput !== undefined)
      updateData.throughput = updateInterfaceDto.throughput;
    if (updateInterfaceDto.busProtocolId !== undefined)
      updateData.busProtocolId = updateInterfaceDto.busProtocolId;

    const result = await super.update(id, updateData);
    if (!result) {
      throw new NotFoundException(`Interface with ID ${id} not found`);
    }
    return result;
  }

  async deleteInterface(id: number): Promise<boolean> {
    const interfaceObject = await super.findOne(id);

    if (!interfaceObject) {
      throw new NotFoundException(`Interface with ID ${id} not found`);
    }

    if (interfaceObject.managed) {
      throw new ConflictException(
        'System-managed interfaces cannot be deleted',
      );
    }

    return super.delete(id);
  }

  async findAllInterfaces(
    query?: QueryInterfaceDto,
  ): Promise<PaginatedResponse<Interface>> {
    return super.findAll(query);
  }
}
