const { Op } = require("sequelize");

exports.where = (filtering) => {
  const { field, operator, value } = filtering;

  switch (operator.toUpperCase()) {
    case "eq":
      return {
        where: {
          [field]: {
            [Op.eq]: `${value}`,
          },
        },
      };

    case "NE":
      return {
        where: {
          [field]: {
            [Op.ne]: `${value}`,
          },
        },
      };

    case "GT":
      return {
        where: {
          [field]: {
            [Op.gt]: `${value}`,
          },
        },
      };

    case "GTE":
      return {
        where: {
          [field]: {
            [Op.gte]: `${value}`,
          },
        },
      };

    case "LT":
      return {
        where: {
          [field]: {
            [Op.lt]: `${value}`,
          },
        },
      };

    case "LTE":
      return {
        where: {
          [field]: {
            [Op.lte]: `${value}`,
          },
        },
      };

    case "like":
    default:
      return {
        where: {
          [field]: {
            [Op.like]: `%${value}%`,
          },
        },
      };
  }
};
