import { PartialType } from '@nestjs/swagger';
import { CreateCpuModelDto } from './create-cpu-model.dto';

export class UpdateCpuModelDto extends PartialType(CreateCpuModelDto) {}
