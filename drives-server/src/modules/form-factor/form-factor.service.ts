import {
  Injectable,
  ConflictException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FormFactor } from './entities/form-factor.entity';
import { CreateFormFactorDto } from './dto/create-form-factor.dto';
import { UpdateFormFactorDto } from './dto/update-form-factor.dto';
import { QueryFormFactorDto } from './dto/query-form-factor.dto';
import { PaginationService } from '../common/pagination/pagination.service';
import { PaginatedResponse } from '../common/interfaces/paginated-response';

@Injectable()
export class FormFactorService implements OnModuleInit {
  constructor(
    @InjectModel(FormFactor)
    private readonly formFactorModel: typeof FormFactor,
    private readonly paginationService: PaginationService, // 🌟 Clean composition injection
  ) {}

  async onModuleInit() {
    await this.seedDefaultFormFactors();
  }

  private async seedDefaultFormFactors(): Promise<void> {
    const defaultFormFactors: {
      name: string;
      slotPitch: number;
    }[] = [];

    for (const formFactorData of defaultFormFactors) {
      const existing = await this.formFactorModel.findOne({
        where: { name: formFactorData.name },
      });

      if (!existing) {
        await this.formFactorModel.create({
          ...formFactorData,
          managed: true,
        });
        console.log(`Seeded default FormFactor: ${formFactorData.name}`);
      }
    }
  }

  async findAll(
    query?: QueryFormFactorDto,
  ): Promise<PaginatedResponse<FormFactor & { itemNumber: number }>> {
    // 🌟 Clean delegation to the standalone service
    return this.paginationService.paginate<FormFactor>(
      this.formFactorModel,
      query,
    );
  }

  async findOne(id: string): Promise<FormFactor | null> {
    return this.formFactorModel.findByPk(id);
  }

  async createFormFactor(
    createFormFactorDto: CreateFormFactorDto,
  ): Promise<FormFactor> {
    const existingByName = await this.formFactorModel.findOne({
      where: { name: createFormFactorDto.name },
    });

    if (existingByName) {
      throw new ConflictException(
        `FormFactor with name "${createFormFactorDto.name}" already exists`,
      );
    }

    return this.formFactorModel.create(createFormFactorDto as any);
  }

  async updateFormFactor(
    id: string,
    updateFormFactorDto: UpdateFormFactorDto,
  ): Promise<FormFactor> {
    const formFactor = await this.formFactorModel.findByPk(id);

    if (!formFactor) {
      throw new NotFoundException(`FormFactor with ID ${id} not found`);
    }

    if (formFactor.managed) {
      throw new ConflictException(
        'System-managed FormFactors cannot be updated',
      );
    }

    if (updateFormFactorDto.name) {
      const existing = await this.formFactorModel.findOne({
        where: { name: updateFormFactorDto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `FormFactor with name "${updateFormFactorDto.name}" already exists`,
        );
      }
    }

    // Filter down to only passed payload items to keep the query clean
    const updateData: Partial<FormFactor> = {};
    if (updateFormFactorDto.name !== undefined)
      updateData.name = updateFormFactorDto.name;
    if (updateFormFactorDto.slotPitch !== undefined)
      updateData.slotPitch = updateFormFactorDto.slotPitch;
    if (updateFormFactorDto.managed !== undefined)
      updateData.managed = updateFormFactorDto.managed;

    return formFactor.update(updateData);
  }

  async deleteFormFactor(id: string): Promise<boolean> {
    const formFactor = await this.formFactorModel.findByPk(id);

    if (!formFactor) {
      throw new NotFoundException(`FormFactor with ID ${id} not found`);
    }

    if (formFactor.managed) {
      throw new ConflictException(
        'System-managed FormFactors cannot be deleted',
      );
    }

    const deletedCount = await this.formFactorModel.destroy({ where: { id } });
    return deletedCount > 0;
  }
}
