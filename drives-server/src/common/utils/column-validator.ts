import { Model } from 'sequelize-typescript';

export class ColumnValidator {
  static async validateFilterField<T extends Model>(
    model: typeof Model,
    field: string,
  ): Promise<boolean> {
    try {
      const tableSpec = await (model as any).describe();
      return field in tableSpec;
    } catch (error) {
      console.error('Error validating filter field:', error);
      return false;
    }
  }

  static async validateSortField<T extends Model>(
    model: typeof Model,
    field: string,
  ): Promise<boolean> {
    try {
      const tableSpec = await (model as any).describe();
      return field in tableSpec;
    } catch (error) {
      console.error('Error validating sort field:', error);
      return false;
    }
  }
}
