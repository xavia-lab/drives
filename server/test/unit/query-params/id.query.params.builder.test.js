const QueryParamsBuilder = require("../../../src/builders/id.query.params.builder");

describe("IdQueryParamsBuilder", () => {
  describe("create", () => {
    test("given a single id parameter, build where object", () => {
      var result = QueryParamsBuilder.build({
        id: 10,
      });

      // assertions
      expect(result.where).toStrictEqual({ id: [10] });
    });
  });
});
