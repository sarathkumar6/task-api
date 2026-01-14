const request = require("supertest"); // Tool that fakes request
const app = require("../app"); // Import the app without starting port 3000 on a server

describe("Sanity check: Health Endpoint", () => {
  it("should return 200 and a success message", async () => {
    const response = await request(app).get("/health");
    expect(response.statusCode).toEqual(200);
    const { status, database, version, dbResponse } = response.body;
    expect(status).toBe("UP");
    expect(database).toBe("CONNECTED");
    expect(version).toBe("2.0-db-check");
    expect(dbResponse).toBeDefined();
  });
});
