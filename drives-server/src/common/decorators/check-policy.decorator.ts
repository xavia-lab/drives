import { SetMetadata } from '@nestjs/common';

export interface PolicyMetadata {
  action: string;
  resource: string;
}

export const CheckPolicy = (action: string, resource: string) =>
  SetMetadata('policy', { action, resource });
