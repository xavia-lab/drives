exports.validate = (requestQueryParams, tableSpec) => {
  const sortColumnMissing =
    "sortField" in requestQueryParams &&
    !(requestQueryParams.sortField in tableSpec);
  const filterColumnMissing =
    "filterField" in requestQueryParams &&
    !(requestQueryParams.filterField in tableSpec);

  console.log(`sortField missing: ${JSON.stringify(sortColumnMissing)}`);
  console.log(`filterField missging: ${JSON.stringify(filterColumnMissing)}`);

  if (sortColumnMissing && filterColumnMissing) {
    return {
      success: false,
      errors: [
        `Column: ${requestQueryParams.sortField} does not exist`,
        `Column: ${requestQueryParams.filterField} does not exist`,
      ],
    };
  } else if (sortColumnMissing) {
    return {
      success: false,
      errors: [`Column: ${requestQueryParams.sortField} does not exist`],
    };
  } else if (filterColumnMissing) {
    return {
      success: false,
      errors: [`Column: ${requestQueryParams.filterField} does not exist`],
    };
  } else {
    return {
      success: true,
    };
  }
};
