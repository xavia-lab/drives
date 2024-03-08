const PaginationHandler = require("../../../app/utils/pagination.util");

describe("Pagination Handler", () => {
  describe("Paging", () => {
    test("given pageNumber and pageSize, calculate offset and limit", () => {
      //Call function of Add

      var result = PaginationHandler.paginate(
        (paging = { page: 5, size: 25 }),
        (sorting = {}),
        (filtering = {}),
      );

      // assertions

      expect(result.offset).toBe(100);
      expect(result.limit).toBe(25);
    });

    test("given no page number and page size, should have no offset and limit", () => {
      var result = PaginationHandler.paginate(
        (paging = {}),
        (sorting = {}),
        (filtering = {}),
      );

      // assertions

      expect(result.offset).not.toBeDefined();
      expect(result.limit).not.toBeDefined();
    });
  });

  describe("Sorting", () => {
    test("given multiple sort fields and sort order properties, calculate order object", () => {
      var result = PaginationHandler.paginate(
        (paging = {}),
        (sorting = { order: "ASC", field: "name,createdAt" }),
        (filtering = {}),
      );

      // assertions

      expect(result.order).toStrictEqual([
        ["name", "ASC"],
        ["createdAt", "ASC"],
      ]);
    });

    test("given sort field and sort order properties, calculate order object", () => {
      var result = PaginationHandler.paginate(
        (paging = {}),
        (sorting = { order: "DESC", field: "name" }),
        (filtering = {}),
      );

      // assertions

      expect(result.order).toStrictEqual([["name", "DESC"]]);
    });

    test("given sortBy only, calculate order object", () => {
      var result = PaginationHandler.paginate(
        (paging = {}),
        (sorting = { field: "name" }),
        (filtering = {}),
      );

      // assertions

      expect(result.order).toStrictEqual([["name"]]);
    });

    test("given orderBy only, should return error", () => {
      var result = PaginationHandler.paginate(
        (paging = {}),
        (sorting = { order: "DESC" }),
        (filtering = {}),
      );

      // assertions

      expect(result.order).toStrictEqual({
        errors: {
          field: ["The field field is required when order is present."],
        },
      });
    });

    test("when no orderBy or sortBy properties are provided, should return empry order object", () => {
      var result = PaginationHandler.paginate(
        (paging = {}),
        (ordering = {}),
        (filtering = {}),
      );

      // assertions

      expect(result.order).toStrictEqual([]);
    });
  });

  describe("Filtering", () => {
    test("given filter field, filter operator, and filter value properties, calculate where clause", () => {
      var result = PaginationHandler.paginate(
        (paging = {}),
        (ordering = {}),
        (filtering = { field: "name", operator: "EQ", value: "GB" }),
      );

      // assertions
      expect(result.where).toBeDefined();
    });

    test("when no filterBy and filer properties are provided, should return empry order object", () => {
      var result = PaginationHandler.paginate(
        (paging = {}),
        (ordering = {}),
        (filtering = {}),
      );

      // assertions
      expect(result.order).toStrictEqual([]);
    });
  });
});
