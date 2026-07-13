import {
  Injectable,
  ConflictException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Interface } from './entities/interface.entity';
import { BusProtocol } from '../bus-protocol/entities/bus-protocol.entity'; // 🌟 Import required relation entity
import { CreateInterfaceDto } from './dto/create-interface.dto';
import { UpdateInterfaceDto } from './dto/update-interface.dto';
import { QueryInterfaceDto } from './dto/query-interface.dto';
import { PaginationService } from '../common/pagination/pagination.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response';

@Injectable()
export class InterfaceService implements OnModuleInit {
  constructor(
    @InjectModel(Interface)
    private readonly interfaceModel: typeof Interface,
    @InjectModel(BusProtocol)
    private readonly busProtocolModel: typeof BusProtocol, // 🌟 Inject the related dependency repo
    private readonly paginationService: PaginationService,
  ) {}

  async onModuleInit() {}

  // 🌟 Private helper to check foreign key constraints concurrently and aggregate errors
  private async validateForeignKeys(ids: {
    busProtocolId?: string;
  }): Promise<void> {
    const checkPromises: Promise<string | null>[] = [];

    if (ids.busProtocolId) {
      checkPromises.push(
        this.busProtocolModel
          .findByPk(ids.busProtocolId)
          .then((exists) =>
            exists
              ? null
              : `BusProtocol with ID ${ids.busProtocolId} not found`,
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
    query?: QueryInterfaceDto,
  ): Promise<PaginatedResponse<Interface & { itemNumber: number }>> {
    return this.paginationService.paginate<Interface>(
      this.interfaceModel,
      query,
    );
  }

  async findOne(id: string): Promise<Interface | null> {
    return this.interfaceModel.findByPk(id);
  }

  async create(createInterfaceDto: CreateInterfaceDto): Promise<Interface> {
    const existingByName = await this.interfaceModel.findOne({
      where: { name: createInterfaceDto.name },
    });

    if (existingByName) {
      throw new ConflictException(
        `Interface with name "${createInterfaceDto.name}" already exists`,
      );
    }

    // 🌟 Check incoming relation constraints before writing record
    await this.validateForeignKeys(createInterfaceDto);

    return this.interfaceModel.create(createInterfaceDto as any);
  }

  async update(
    id: string,
    updateInterfaceDto: UpdateInterfaceDto,
  ): Promise<Interface> {
    const interfaceObject = await this.interfaceModel.findByPk(id);

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

    // 🌟 Check relation constraints for changes passed in payload
    await this.validateForeignKeys(updateInterfaceDto);

    const updateData: Partial<Interface> = {};
    if (updateInterfaceDto.name !== undefined)
      updateData.name = updateInterfaceDto.name;
    if (updateInterfaceDto.linkGeneration !== undefined)
      updateData.linkGeneration = updateInterfaceDto.linkGeneration;
    if (updateInterfaceDto.throughput !== undefined)
      updateData.throughput = updateInterfaceDto.throughput;
    if (updateInterfaceDto.busProtocolId !== undefined)
      updateData.busProtocolId = updateInterfaceDto.busProtocolId;

    return interfaceObject.update(updateData);
  }

  async delete(id: string): Promise<boolean> {
    const interfaceObject = await this.interfaceModel.findByPk(id);

    if (!interfaceObject) {
      throw new NotFoundException(`Interface with ID ${id} not found`);
    }

    if (interfaceObject.managed) {
      throw new ConflictException(
        'System-managed interfaces cannot be deleted',
      );
    }

    const deletedCount = await this.interfaceModel.destroy({ where: { id } });
    return deletedCount > 0;
  }
}
