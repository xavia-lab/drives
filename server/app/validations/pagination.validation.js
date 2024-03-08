const { checkSchema } = require("express-validator");

const paginationQueryValidateSchema = checkSchema(
  {
    pageNumber: {
      optional: true,
      isInt: {
        options: { min: 1 },
        errorMessage: "Page should be integer grater than 0.",
      },
    },
    pageSize: {
      optional: true,
      isInt: {
        options: { min: 2 },
        errorMessage: "Page size should be integer grater than 1.",
      },
    },
    sortField: {
      optional: true,
      isString: { errorMessage: "Sort by should be string" },
    },
    sortOrder: {
      optional: true,
      isString: { errorMessage: "Order by should be string" },
      isIn: {
        options: [["DESC", "ASC"]],
        errorMessage: "Order should be either `DESC`  or `ASC`",
      },
    },
    filterField: {
      optional: true,
      isString: { errorMessage: "Filter field should be a string" },
    },
    filterOperator: {
      optional: true,
      isString: { errorMessage: "Filter operator should be a string" },
      isIn: {
        options: [["EQ", "NE", "LT", "LTE", "GT", "GTE", "LIKE"]],
        errorMessage:
          "Filter operator should be in [`EQ`, `NE`, `LT`, `LTE`, `GT`, `GTE`, `LIKE`]",
      },
    },
    filterValue: {
      optional: true,
      isString: { errorMessage: "Filter value should be a string" },
    },
  },
  ["query"],
);

module.exports = paginationQueryValidateSchema;
