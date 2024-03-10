const collect = require("collect.js");

const { make, ruleIn } = require("simple-body-validator");

const Objects = require("../utils/objects.util");
const SelectOperators = require("./select.operators.builder");

exports.build = (queryParams) => {
  const { pageNumber, pageSize } = queryParams;
  const { sortField, sortOrder } = queryParams;
  const { filterField, filterOperator, filterValue } = queryParams;

  const calculatePaging = () => {
    const rules = {
      pageNumber: "integer|min:1",
      pageSize: "integer|min:2",
    };

    const validator = make({ pageNumber, pageSize }, rules);
    if (!validator.validate()) {
      return { errors: validator.errors().all() };
    }

    if (Objects.isNotEmpty(pageNumber) && Objects.isNotEmpty(pageSize)) {
      const offset = (pageNumber - 1) * pageSize;
      const limit = pageSize;

      return {
        offset: offset,
        limit: limit,
      };
    } else return {};
  };

  const calculateSorting = () => {
    const rules = {
      sortOrder: [ruleIn(["desc", "asc"])],
      sortField: "string|required_with:sortOrder",
    };

    const validator = make({ sortField, sortOrder }, rules);
    if (!validator.validate()) {
      return { errors: validator.errors().all() };
    }

    if (Objects.isNotEmpty(sortField) && Objects.isNotEmpty(sortOrder)) {
      const sortingFields = collect(Array.from(sortField.split(",")));
      const result = sortingFields.map((x) => [x, sortOrder]);

      return result.all();
    } else if (Objects.isNotEmpty(sortField) && Objects.isEmpty(sortOrder)) {
      const sortingFields = collect(Array.from(sortField.split(",")));
      const result = sortingFields.map((x) => [x]);

      return result.all();
    } else return [];
  };

  const calculateFiltring = () => {
    const rules = {
      filterField: ["string"],
      filterValue: ["string", "required_with:filterField"],
      filterOperator: [ruleIn(["eq", "ne", "lt", "lte", "gt", "gte", "like"])],
    };

    const validator = make(
      {
        filterField,
        filterOperator,
        filterValue,
      },
      rules,
    );
    if (!validator.validate()) {
      return { errors: validator.errors().all() };
    }

    if (
      Objects.isNotEmpty(filterField) &&
      Objects.isNotEmpty(filterOperator) &&
      Objects.isNotEmpty(filterValue)
    )
      return SelectOperators.where({
        field: filterField,
        operator: filterOperator,
        value: filterValue,
      });
    else return {};
  };

  const pagination = calculatePaging();
  const order = calculateSorting();
  const filter = calculateFiltring();

  const result = {
    order: order,
    ...pagination,
    ...filter,
  };

  console.log(`Pagination parameters: ${JSON.stringify(result)}`);
  return result;
};
