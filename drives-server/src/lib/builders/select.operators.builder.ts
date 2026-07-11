import { Op, WhereOptions } from 'sequelize'; // Import WhereOptions explicitly

export interface FilterParams {
  field: string;
  operator: string;
  value: string;
}

/**
 * Generates a Sequelize where clause based on filter parameters.
 * Explicitly defining the return type as { where: WhereOptions }
 * resolves the TS4023 error.
 */
export const where = (filtering: FilterParams): { where: WhereOptions } => {
  console.log(`Filtering parameters: ${JSON.stringify(filtering)}`);

  const { field, operator, value } = filtering;
  const op = operator.toUpperCase();

  switch (op) {
    case 'BETWEEN': {
      // Split the string "date1,date2" into an array [date1, date2]
      const range = value.split(',');
      if (range.length === 2) {
        return { where: { [field]: { [Op.between]: range } } };
      }
      // Fallback if the range is malformed
      return { where: {} };
    }
    case 'EQ':
      return { where: { [field]: { [Op.eq]: value } } };
    case 'NE':
      return { where: { [field]: { [Op.ne]: value } } };
    case 'GT':
      return { where: { [field]: { [Op.gt]: value } } };
    case 'GTE':
      return { where: { [field]: { [Op.gte]: value } } };
    case 'LT':
      return { where: { [field]: { [Op.lt]: value } } };
    case 'LTE':
      return { where: { [field]: { [Op.lte]: value } } };
    case 'IN':
      return { where: { [field]: { [Op.in]: value.split(',') } } };
    case 'LIKE':
    default:
      return { where: { [field]: { [Op.like]: `%${value}%` } } };
  }
};
