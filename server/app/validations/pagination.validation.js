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
      isString: { errorMessage: "Sort field by should be string" },
    },
    sortOrder: {
      optional: true,
      isString: { errorMessage: "Sort order should be string" },
      isIn: {
        options: [["desc", "asc"]],
        errorMessage: "Order should be either `desc`  or `asc`",
      },
      toLowerCase: true,
    },
    filterField: {
      optional: true,
      isString: { errorMessage: "Filter field should be a string" },
    },
    filterOperator: {
      optional: true,
      isString: { errorMessage: "Filter operator should be a string" },
      isIn: {
        options: [["eq", "ne", "lt", "lte", "gt", "gte", "like"]],
        errorMessage:
          "Filter operator should be in [`eq`, `ne`, `lt`, `lte`, `gt`, `gte`, `like`]",
      },
      toLowerCase: true,
    },
    filterValue: {
      optional: true,
      isString: { errorMessage: "Filter value should be a string" },
    },
  },
  ["query"],
);

module.exports = paginationQueryValidateSchema;
