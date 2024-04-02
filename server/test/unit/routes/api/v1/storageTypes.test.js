const request = require("supertest");
const server = require("../../../../../src");
const db = require("../../../../../src/models");

const timeout = 10000;
const endpoint = "/api/v1/storageTypes";

afterAll(() => {
  server.close();
});

describe(endpoint, () => {
  describe("findAll", () => {
    describe("when using id parameter", () => {
      it(
        "should responds with array of single object based on id parameter",
        () => {
          return request(server)
            .get(endpoint)
            .query({ id: 1, sortField: "id", sortOrder: "desc" })
            .expect("Content-Type", /json/)
            .expect("X-Pagination-Total-Count", "1")
            .expect(200)
            .then((response) => {
              expect(response.body[0].id).toEqual(1);
              expect(response.body[0].managed).toEqual(true);
              expect(response.body[0].name).toEqual("Magnetic");
              expect(response.body[0].title).toEqual("Magnetic");
            });
        },
        timeout,
      );

      it(
        "should responds with array of multiple object based on id parameter",
        () => {
          const expectedResult = [
            {
              managed: true,
              name: "Magnetic",
              title: "Magnetic",
            },
            {
              managed: true,
              name: "NAND Flash",
              title: "NAND Flash",
            },
          ];

          return request(server)
            .get(endpoint)
            .query({ id: [1, 2], sortField: "id", sortOrder: "desc" })
            .expect("Content-Type", /json/)
            .expect("X-Pagination-Total-Count", "2")
            .expect(200)
            .then((response) => {
              response.body.forEach(function (value, i) {
                console.log("%d: %s", i, value);
                console.log("%d: %s", i, expectedResult[i]);

                expect(value.id).toEqual(i + 1);
                expect(value.managed).toEqual(expectedResult[i].managed);
                expect(value.name).toEqual(expectedResult[i].name);
                expect(value.title).toEqual(expectedResult[i].title);
              });
            });
        },
        timeout,
      );
    });

    describe("when using pageNumber and pageSize parameters", () => {
      it(
        "should responds with correct pagenated response",
        () => {
          const expectedResult = [
            {
              managed: true,
              name: "Magnetic",
              title: "Magnetic",
            },
            {
              managed: true,
              name: "NAND Flash",
              title: "NAND Flash",
            },
          ];

          return (
            request(server)
              .get(endpoint)
              .query({ pageNumber: 1, pageSize: 2 })
              .expect("Content-Type", /json/)
              .expect("X-Pagination-Total-Count", "3")
              // .expect((res) => {
              //   res.headers["X-Pagination-Total-Count"].toBe(3);
              // })
              .expect(200)
              .then((response) => {
                response.body.forEach(function (value, i) {
                  expect(value.id).toEqual(i + 1);
                  expect(value.managed).toEqual(expectedResult[i].managed);
                  expect(value.name).toEqual(expectedResult[i].name);
                  expect(value.title).toEqual(expectedResult[i].title);
                });
              })
          );
        },
        timeout,
      );

      it(
        "should responds with error if incorrect query parameters are passed",
        () => {
          return request(server)
            .get(endpoint)
            .query({ pageNumber: "-1", pageSize: "0" })
            .expect("Content-Type", /json/)
            .expect(400)
            .then((response) => {
              expect(response.body).toEqual({
                errors: [
                  {
                    location: "query",
                    msg: "Page should be integer grater than 0.",
                    path: "pageNumber",
                    type: "field",
                    value: "-1",
                  },
                  {
                    location: "query",
                    msg: "Page size should be integer grater than 1.",
                    path: "pageSize",
                    type: "field",
                    value: "0",
                  },
                ],
                success: false,
              });
            });
        },
        timeout,
      );

      it(
        "should responds with error if malformed query parameters are passed",
        () => {
          return request(server)
            .get(endpoint)
            .query({ pageNumber: "one", pageSize: "five" })
            .expect("Content-Type", /json/)
            .expect(400)
            .then((response) => {
              expect(response.body).toEqual({
                errors: [
                  {
                    location: "query",
                    msg: "Page should be integer grater than 0.",
                    path: "pageNumber",
                    type: "field",
                    value: "one",
                  },
                  {
                    location: "query",
                    msg: "Page size should be integer grater than 1.",
                    path: "pageSize",
                    type: "field",
                    value: "five",
                  },
                ],
                success: false,
              });
            });
        },
        timeout,
      );
    });

    describe("when using filterField, filterValue and filterOperator parameters", () => {
      it(
        "should responds with correct filtered response",
        () => {
          const expectedResult = [
            {
              managed: true,
              name: "Magnetic",
              title: "Magnetic",
            },
          ];

          return request(server)
            .get(endpoint)
            .query({
              filterField: "name",
              filterValue: "Magnetic",
              filterOperator: "eq",
            })
            .expect("Content-Type", /json/)
            .expect("X-Pagination-Total-Count", "1")
            .expect(200)
            .then((response) => {
              response.body.forEach(function (value, i) {
                expect(value.id).toEqual(i + 1);
                expect(value.managed).toEqual(expectedResult[i].managed);
                expect(value.name).toEqual(expectedResult[i].name);
                expect(value.title).toEqual(expectedResult[i].title);
              });
            });
        },
        timeout,
      );

      it(
        "should responds with error if incorrect filterOperator parameters are passed",
        () => {
          return request(server)
            .get(endpoint)
            .query({
              filterField: "name",
              filterValue: "Magnetic",
              filterOperator: "EQUAL",
            })
            .expect("Content-Type", /json/)
            .expect(400)
            .then((response) => {
              expect(response.body).toEqual({
                errors: [
                  {
                    location: "query",
                    msg: "Filter operator should be in [`eq`, `ne`, `lt`, `lte`, `gt`, `gte`, `like`]",
                    path: "filterOperator",
                    type: "field",
                    value: "EQUAL",
                  },
                ],
                success: false,
              });
            });
        },
        timeout,
      );

      it(
        "should responds with error if incorrect filterField and filterOperator parameters are passed",
        () => {
          return request(server)
            .get(endpoint)
            .query({
              filterField: "incorrect",
              filterValue: "who-cares",
              filterOperator: "eq",
            })
            .expect("Content-Type", /json/)
            .expect(400)
            .then((response) => {
              expect(response.body).toEqual({
                errors: ["Column: incorrect does not exist"],
                success: false,
              });
            });
        },
        timeout,
      );
    });
  });

  describe("findOne", () => {
    describe("when using id", () => {
      it(
        "should responds with single object based on id",
        () => {
          return request(server)
            .get(`${endpoint}/1`)
            .expect("Content-Type", /json/)
            .expect(200)
            .then((response) => {
              expect(response.body.id).toEqual(1);
              expect(response.body.managed).toEqual(true);
              expect(response.body.name).toEqual("Magnetic");
              expect(response.body.title).toEqual("Magnetic");
            });
        },
        timeout,
      );
      it(
        "should responds with error if record not found by id",
        () => {
          return request(server)
            .get(`${endpoint}/100`)
            .expect("Content-Type", /json/)
            .expect(404)
            .then((response) => {
              expect(response.body).toEqual({
                success: false,
                errors: ["Storage type not found!"],
              });
            });
        },
        timeout,
      );
    });
  });

  describe("create", () => {
    describe("when using id", () => {
      it(
        "should create new object based on id",
        () => {
          return request(server)
            .post(endpoint)
            .send({ name: "NOR Flash" })
            .expect("Content-Type", /json/)
            .expect(201)
            .then((response) => {
              expect(response.body.managed).toEqual(false);
              expect(response.body.name).toEqual("NOR Flash");
              expect(response.body.title).toEqual("NOR Flash");
            })
            .finally(() => {
              console.log("Delete inserted row");
              db.sequelize.query(
                "DELETE FROM storageTypes WHERE name='NOR Flash'",
              );
            });
        },
        timeout,
      );

      it(
        "should responds with error if required parameters are not provided",
        () => {
          return request(server)
            .post(endpoint)
            .send({})
            .expect("Content-Type", /json/)
            .expect(409)
            .then((response) => {
              expect(response.body.success).toEqual(false);
            });
        },
        timeout,
      );
    });
  });
});
