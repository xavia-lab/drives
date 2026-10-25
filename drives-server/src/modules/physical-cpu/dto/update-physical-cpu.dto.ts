import { PartialType } from '@nestjs/mapped-types';
import { CreatePhysicalCpuDto } from './create-physical-cpu.dto';

export class UpdatePhysicalCpuDto extends PartialType(CreatePhysicalCpuDto) {}
