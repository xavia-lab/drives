const request = require("supertest");
const server = require("../../src");

afterAll(() => {
  server.close();
});

describe("/health", function () {
  it("responds with json", function () {
    return request(server)
      .get("/health")
      .set("Accept", "application/json")
      .expect("Content-Type", /json/)
      .expect(200)
      .then((response) => {
        expect(response.body.status).toEqual("ok");
      });
  });
});
