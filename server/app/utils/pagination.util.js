const { make, ruleIn } = require("simple-body-validator");

const { Op } = require("sequelize");

const Objects = require("./objects.util");

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
    const page = paging.page;
    const size = paging.size;

    const offset = (page - 1) * size;
    const limit = size;

    return {
      offset: offset,
      limit: limit,
    };
  } else return {};
};

const calculateOrdering = (ordering) => {
  const rules = {
    orderBy: [ruleIn(["desc", "asc"])],
    sortBy: ["string", "required_with:orderBy"],
  };

  const validator = make(ordering, rules);
  if (!validator.validate()) {
    return { errors: validator.errors().all() };
  }

  if (
    Objects.isNotEmpty(ordering) &&
    Objects.isNotEmpty(ordering.sortBy) &&
    Objects.isNotEmpty(ordering.orderBy)
  )
    return [[ordering.sortBy, ordering.orderBy.toUpperCase()]];
  else if (
    Objects.isNotEmpty(ordering) &&
    Objects.isNotEmpty(ordering.sortBy) &&
    Objects.isEmpty(ordering.orderBy)
  )
    return [[ordering.sortBy]];
  else return [];
};

const calculateFiltring = (filtering) => {
  const rules = {
    filterBy: ["string"],
    filter: ["string", "required_with:filterBy"],
  };

  const validator = make(ordering, rules);
  if (!validator.validate()) {
    return { errors: validator.errors().all() };
  }

  if (
    Objects.isNotEmpty(filtering) &&
    Objects.isNotEmpty(filtering.filterBy) &&
    Objects.isNotEmpty(filtering.filter)
  ) {
    const { filterBy, filter } = filtering;
    return {
      where: {
        [filterBy]: {
          [Op.like]: `%${filter}%`,
        },
      },
    };
  } else return {};
};

exports.paginate = (paging, ordering, filtering) => {
  const pagingAttributes = calculatePaging(paging);
  const order = calculateOrdering(ordering);
  const filter = calculateFiltring(filtering);

  const result = {
    order: Objects.isEmpty(order) ? [] : order,
    ...pagingAttributes,
    ...filter,
  };

  console.log(`Pagination parameters: ${JSON.stringify(result)}`);
  return result;
};
