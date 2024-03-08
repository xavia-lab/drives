const { checkSchema } = require("express-validator");

const paginationQueryValidateSchema = checkSchema(
  {
    page: {
      optional: true,
      isInt: {
        options: { min: 1 },
        errorMessage: "Page should be integer grater than 0.",
      },
    },
    size: {
      optional: true,
      isInt: {
        options: { min: 2 },
        errorMessage: "Page size should be integer grater than 1.",
      },
    },
    orderBy: {
      optional: true,
      isString: { errorMessage: "Order by should be string" },
      isIn: {
        options: [["desc", "asc"]],
        errorMessage: "Order should be either `desc`  or `asc`",
      },
    },
    sortBy: {
      optional: true,
      isString: { errorMessage: "Sort by should be string" },
    },
    filterBy: {
      optional: true,
      isString: { errorMessage: "Filter by should be string" },
    },
    filter: {
      optional: true,
      isString: { errorMessage: "Filter should be string" },
    },
  },
  ["query"],
);

module.exports = paginationQueryValidateSchema;
