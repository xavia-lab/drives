export interface IdQueryParams {
  id?: number | number[];
}

export const build = (queryParams: IdQueryParams) => {
  const { id } = queryParams;

  const ids = Array.isArray(id) ? id : [id].filter(Boolean);

  const result = {
    where: { id: ids },
  };

  console.log(`Selection parameters: ${JSON.stringify(result)}`);
  return result;
};
