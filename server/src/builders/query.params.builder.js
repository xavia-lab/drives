const Objects = require("../utils/objects.util");

const IdQueryParamsBuilder = require("./id.query.params.builder");
const PaginationQueryParamsBuilder = require("./pagination.query.params.builder");

exports.build = (queryParams) => {
  if (Objects.isEmpty(queryParams) || Objects.isObjectEmpty(queryParams)) {
    console.log(`Querying unconditionally...`);
    return {};
  } else if (Objects.isNotEmpty(queryParams.id)) {
    console.log(
      `Querying based on id parameters: ${JSON.stringify(queryParams)}`,
    );
    return IdQueryParamsBuilder.build(queryParams);
  } else {
    console.log(
      `Querying based on pagination parameters: ${JSON.stringify(queryParams)}`,
    );
    return PaginationQueryParamsBuilder.build(queryParams);
  }
};
