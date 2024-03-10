exports.build = (queryParams) => {
  const { id } = queryParams;
  const idArray = Array.isArray(id) ? id : [id];
  const ids = idArray.map(Number);

  const result = {
    where: {
      id: ids,
    },
  };
  console.log(`Selection parameters: ${JSON.stringify(result)}`);
  return result;
};
