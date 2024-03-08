const PaginationHandler = require("../../../app/utils/pagination.util");

describe("Pagination Handler Tests", () => {
  describe("Paging", () => {
    test("given page number and pageSize, calculate offset and limit", () => {
      //Call function of Add

      var result = PaginationHandler.paginate(
        (paging = { page: 5, size: 25 }),
        (ordering = {}),
        (filtering = {}),
      );

      // assertions

      expect(result.offset).toBe(100);
      expect(result.limit).toBe(25);
    });

    test("given no page number and pageSize, should have no offset and limit", () => {
      var result = PaginationHandler.paginate(
        (paging = {}),
        (ordering = {}),
        (filtering = {}),
      );

      // assertions

      expect(result.offset).not.toBeDefined();
      expect(result.limit).not.toBeDefined();
    });
  });

  describe("Ordering", () => {
    test("given orderBy and sortBy properties, calculate order object", () => {
      var result = PaginationHandler.paginate(
        (paging = {}),
        (ordering = { orderBy: "desc", sortBy: "name" }),
        (filtering = {}),
      );

      // assertions

      expect(result.order).toStrictEqual([["name", "DESC"]]);
    });

    test("given sortBy only, calculate order object", () => {
      var result = PaginationHandler.paginate(
        (paging = {}),
        (ordering = { sortBy: "name" }),
        (filtering = {}),
      );

      // assertions

      expect(result.order).toStrictEqual([["name"]]);
    });

    test("given orderBy only, should return error", () => {
      var result = PaginationHandler.paginate(
        (paging = {}),
        (ordering = { orderBy: "desc" }),
        (filtering = {}),
      );

      // assertions

      expect(result.order).toStrictEqual({
        errors: {
          sortBy: ["The sort by field is required when order by is present."],
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
    test("given filterBy and filter properties, calculate where clause", () => {
      var result = PaginationHandler.paginate(
        (paging = {}),
        (ordering = {}),
        (filtering = { filterBy: "name", filter: "GB" }),
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
