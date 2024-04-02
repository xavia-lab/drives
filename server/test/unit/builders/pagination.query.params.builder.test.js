const QueryParamsBuilder = require("../../../src/builders/pagination.query.params.builder");

describe("PaginationQueryParamsBuilder", () => {
  describe("Paging", () => {
    test("given pageNumber and pageSize, calculate offset and limit", () => {
      var result = QueryParamsBuilder.build({
        pageNumber: 5,
        pageSize: 25,
      });

      // assertions
      expect(result.offset).toBe(100);
      expect(result.limit).toBe(25);
    });

    test("given no page number and page size, should have no offset and limit", () => {
      var result = QueryParamsBuilder.build({});

      // assertions
      expect(result.offset).not.toBeDefined();
      expect(result.limit).not.toBeDefined();
    });
  });

  describe("Sorting", () => {
    test("given multiple sort fields and sort order properties, calculate order object", () => {
      var result = QueryParamsBuilder.build({
        sortOrder: "asc",
        sortField: "name,createdAt",
      });

      // assertions
      expect(result.order).toStrictEqual([
        ["name", "asc"],
        ["createdAt", "asc"],
      ]);
    });

    test("given sort field and sort order properties, calculate order object", () => {
      var result = QueryParamsBuilder.build({
        sortOrder: "desc",
        sortField: "name",
      });

      // assertions
      expect(result.order).toStrictEqual([["name", "desc"]]);
    });

    test("given sortBy only, calculate order object", () => {
      var result = QueryParamsBuilder.build({ sortField: "name" });

      // assertions
      expect(result.order).toStrictEqual([["name"]]);
    });

    test("given orderBy only, should return error", () => {
      var result = QueryParamsBuilder.build({ sortOrder: "desc" });

      // assertions
      expect(result.order).toStrictEqual({
        errors: {
          sortField: [
            "The sort field field is required when sort order is present.",
          ],
        },
      });
    });

    test("when no orderBy or sortBy properties are provided, should return empry order object", () => {
      var result = QueryParamsBuilder.build({});

      // assertions
      expect(result.order).toStrictEqual([]);
    });
  });

  describe("Filtering", () => {
    test("given filter field, filter operator, and filter value properties, calculate where clause", () => {
      var result = QueryParamsBuilder.build({
        filterField: "name",
        filterOperator: "eq",
        filterValue: "GB",
      });

      // assertions
      expect(result.where).toBeDefined();
    });

    test("when no filterBy and filer properties are provided, should return empry order object", () => {
      var result = QueryParamsBuilder.build({});

      // assertions
      expect(result.order).toStrictEqual([]);
    });
  });
});
