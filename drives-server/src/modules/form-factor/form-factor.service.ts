import {
  Injectable,
  ConflictException,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { FormFactor } from './entities/form-factor.entity';
import { BaseCrudService } from '../base/base-crud.service';
import { CreateFormFactorDto } from './dto/create-form-factor.dto';
import { UpdateFormFactorDto } from './dto/update-form-factor.dto';
import { QueryFormFactorDto } from './dto/query-form-factor.dto';
import { QueryBuilderService } from '../../common/services/query-builder/query-builder.service';
import { PaginatedResponse } from '../../common/interfaces/paginated-response';

@Injectable()
export class FormFactorService
  extends BaseCrudService<FormFactor>
  implements OnModuleInit
{
  constructor(
    @InjectModel(FormFactor)
    private FormFactorModel: typeof FormFactor,
    protected queryBuilder: QueryBuilderService,
  ) {
    super(FormFactorModel, queryBuilder);
  }

  async onModuleInit() {
    await this.seedDefaultFormFactors();
  }

  private async seedDefaultFormFactors(): Promise<void> {
    const defaultFormFactors: {
      name: string;
      slotPitch: number;
    }[] = [];

    for (const FormFactorData of defaultFormFactors) {
      const existing = await this.FormFactorModel.findOne({
        where: { name: FormFactorData.name },
      });

      if (!existing) {
        await this.FormFactorModel.create({
          ...FormFactorData,
          managed: true,
        });
        console.log(`Seeded default FormFactor: ${FormFactorData.name}`);
      }
    }
  }

  async createFormFactor(
    createFormFactorDto: CreateFormFactorDto,
  ): Promise<FormFactor> {
    const existingByName = await this.FormFactorModel.findOne({
      where: { name: createFormFactorDto.name },
    });

    if (existingByName) {
      throw new ConflictException(
        `FormFactor with name "${createFormFactorDto.name}" already exists`,
      );
    }

    return super.create(createFormFactorDto);
  }

  async updateFormFactor(
    id: string,
    updateFormFactorDto: UpdateFormFactorDto,
  ): Promise<FormFactor> {
    const FormFactor = await super.findOne(id);

    if (!FormFactor) {
      throw new NotFoundException(`FormFactor with ID ${id} not found`);
    }

    if (FormFactor.managed) {
      throw new ConflictException(
        'System-managed FormFactors cannot be updated',
      );
    }

    if (updateFormFactorDto.name) {
      const existing = await this.FormFactorModel.findOne({
        where: { name: updateFormFactorDto.name },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `FormFactor with name "${updateFormFactorDto.name}" already exists`,
        );
      }
    }

    const updateData: Partial<FormFactor> = {};
    if (updateFormFactorDto.name !== undefined)
      updateData.name = updateFormFactorDto.name;
    if (updateFormFactorDto.slotPitch !== undefined)
      updateData.slotPitch = updateFormFactorDto.slotPitch;
    if (updateFormFactorDto.managed !== undefined)
      updateData.managed = updateFormFactorDto.managed;

    const result = await super.update(id, updateData);
    if (!result) {
      throw new NotFoundException(`FormFactor with ID ${id} not found`);
    }
    return result;
  }

  async deleteFormFactor(id: string): Promise<boolean> {
    const FormFactor = await super.findOne(id);

    if (!FormFactor) {
      throw new NotFoundException(`FormFactor with ID ${id} not found`);
    }

    if (FormFactor.managed) {
      throw new ConflictException(
        'System-managed FormFactors cannot be deleted',
      );
    }

    return super.delete(id);
  }

  async findAllFormFactors(
    query?: QueryFormFactorDto,
  ): Promise<PaginatedResponse<FormFactor>> {
    return super.findAll(query);
  }
}
