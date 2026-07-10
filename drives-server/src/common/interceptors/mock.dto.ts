import { Expose } from 'class-transformer';

export class MockDto {
  @Expose()
  id: number;

  @Expose()
  name: string;

  // This should be stripped because it has no @Expose()
  password?: string;
}
