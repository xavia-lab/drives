const collect = require("collect.js");

const { make, ruleIn } = require("simple-body-validator");

const Objects = require("./objects.util");
const SqlOperators = require("./sql.operators.util");

const calculatePaging = (paging) => {
  const rules = {
    page: "integer|min:1",
    size: "integer|min:2",
  };

  const validator = make(paging, rules);
  if (!validator.validate()) {
    return { errors: validator.errors().all() };
  }

  if (
    Objects.isNotEmpty(paging) &&
    Objects.isNotEmpty(paging.page) &&
    Objects.isNotEmpty(paging.size)
  ) {
    const { page, size } = paging;

    const offset = (page - 1) * size;
    const limit = size;

    return {
      offset: offset,
      limit: limit,
    };
  } else return {};
};

const calculateSorting = (sorting) => {
  console.log(`Sorting parameters: ${JSON.stringify(sorting)}`);

  const rules = {
    order: [ruleIn(["desc", "asc"])],
    field: "string|required_with:order",
  };

  const validator = make(sorting, rules);
  if (!validator.validate()) {
    return { errors: validator.errors().all() };
  }

  if (
    Objects.isNotEmpty(sorting) &&
    Objects.isNotEmpty(sorting.field) &&
    Objects.isNotEmpty(sorting.order)
  ) {
    const { field, order } = sorting;

    const sortingFields = collect(Array.from(field.split(",")));
    const result = sortingFields.map((x) => [x, order]);

    return result.all();
  } else if (
    Objects.isNotEmpty(sorting) &&
    Objects.isNotEmpty(sorting.field) &&
    Objects.isEmpty(sorting.order)
  ) {
    const { field } = sorting;

    const sortingFields = collect(Array.from(field.split(",")));
    const result = sortingFields.map((x) => [x]);

    return result.all();
  } else return [];
};

const calculateFiltring = (filtering) => {
  const rules = {
    field: ["string"],
    value: ["string", "required_with:filterBy"],
    operator: [ruleIn(["eq", "ne", "lt", "lte", "gt", "gte", "like"])],
  };

  const validator = make(filtering, rules);
  if (!validator.validate()) {
    return { errors: validator.errors().all() };
  }

  if (
    Objects.isNotEmpty(filtering) &&
    Objects.isNotEmpty(filtering.field) &&
    Objects.isNotEmpty(filtering.operator) &&
    Objects.isNotEmpty(filtering.value)
  )
    return SqlOperators.where(filtering);
  else return {};
};

exports.paginate = (paging, sorting, filtering) => {
  const pagination = calculatePaging(paging);
  const order = calculateSorting(sorting);
  const filter = calculateFiltring(filtering);

  const result = {
    order: order,
    ...pagination,
    ...filter,
  };

  console.log(`Pagination parameters: ${JSON.stringify(result)}`);
  return result;
};
