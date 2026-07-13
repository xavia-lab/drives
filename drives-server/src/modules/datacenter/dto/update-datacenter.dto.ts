import { PartialType } from '@nestjs/swagger';
import { CreateDatacenterDto } from './create-datacenter.dto';

export class UpdateDatacenterDto extends PartialType(CreateDatacenterDto) {}
