import { PartialType } from '@nestjs/swagger';
import { CreatePoolTypeDto } from './create-pool-type.dto';

export class UpdatePoolTypeDto extends PartialType(CreatePoolTypeDto) {}
