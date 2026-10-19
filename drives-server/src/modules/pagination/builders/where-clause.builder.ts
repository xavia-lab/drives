import { BadRequestException } from '@nestjs/common';
import { Op, WhereOptions } from 'sequelize';
import { FilterCondition } from '../filter.types';

const splitList = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);

/**
 * Translates one normalized filter into a Sequelize condition.
 * Field names are validated upstream (identifier pattern / per-resource
 * whitelist) and Sequelize quotes them, so they can be used as object keys.
 */
export const buildFilterCondition = (
  condition: FilterCondition,
): WhereOptions => {
  const { field, operator, value } = condition;

  switch (operator) {
    case 'eq':
      return { [field]: { [Op.eq]: value } };
    case 'ne':
      return { [field]: { [Op.ne]: value } };
    case 'gt':
      return { [field]: { [Op.gt]: value } };
    case 'gte':
      return { [field]: { [Op.gte]: value } };
    case 'lt':
      return { [field]: { [Op.lt]: value } };
    case 'lte':
      return { [field]: { [Op.lte]: value } };
    case 'in':
      return { [field]: { [Op.in]: splitList(value) } };
    case 'like':
      return { [field]: { [Op.like]: `%${value}%` } };
    case 'between': {
      const range = splitList(value);
      if (range.length !== 2) {
        throw new BadRequestException(
          `Filter "between" on "${field}" requires exactly two comma-separated values`,
        );
      }
      return { [field]: { [Op.between]: range } };
    }
    default: {
      // Exhaustiveness guard: adding an operator without handling it fails here.
      const unreachable: never = operator;
      throw new BadRequestException(
        `Unsupported filter operator "${String(unreachable)}"`,
      );
    }
  }
};

/** ANDs all filters together. A single filter is returned unwrapped. */
export const buildWhere = (
  filters: FilterCondition[],
): WhereOptions | undefined => {
  if (filters.length === 0) {
    return undefined;
  }

  const conditions = filters.map(buildFilterCondition);
  return conditions.length === 1 ? conditions[0] : { [Op.and]: conditions };
};
