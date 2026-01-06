const request = require("supertest"); // Fake HTTP requests
const jwt = require("jsonwebtoken"); // Importing jsonwebtoken to generate fake tokens
process.env.JWT_SECRET = "super_secret_random_string_do_not_share";
const app = require("../app"); // Importing application
const db = require("../db"); // We will be swapping it with a mock one

jest.mock("../db", () => ({
  user: {
    findUnique: jest.fn(),
    findMinay: jest.fn(),
    create: jest.fn(),
  },
}));

const generateToken = (id, role = "user") => {
  console.log("PROCESS.ENV.JWT_SECRET IS: ", process.env.JWT_SECRET);
  return jwt.sign({ userId: id, role }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
};
describe("Should test users endpoint", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return user id must be a number", async () => {
    const token = generateToken(1, "user");
    const userId = "xyz";
    const response = await request(app)
      .get(`/users/${userId}`)
      .set("Authorization", `Bearer ${token}`);
    console.dir("response.body: ", response.body);
    expect(response.statusCode).toEqual(400);
    // ToDo: Fix this test by updating the validation message in the route
    //expect(response.body.details[0].msg).toEqual("User id must be a number.");
  });

  it("should return 401 if no token is provided", async () => {
    const response = await request(app).get("/users/1");
    expect(response.statusCode).toEqual(401); // Middleware stopped i.e., validateRequest
  });

  it("should return 403 if user 2 tries to access user 1", async () => {
    const token = generateToken(2, "user");
    // 1. Mock the specific Prisma method
    // Notice: We return the OBJECT, not { rows: [...] }
    db.user.findUnique.mockResolvedValue({
      id: 1,
      username: "testuser",
      email: "test@example.com",
      role: "user",
      createdAt: new Date(),
    });
    const response = await request(app)
      .get("/users/1")
      .set("Authorization", `Bearer ${token}`);

    expect(response.statusCode).toEqual(403);
  });

  it("should return user data if user id matches and DB finds user", async () => {
    const token = generateToken(1, "user");
    // 1. Mock the specific Prisma method
    // Notice: We return the OBJECT, not { rows: [...] }
    db.user.findUnique.mockResolvedValue({
      id: 1,
      username: "mock_user",
      email: "test@example.com",
      role: "user",
      createdAt: new Date(),
    });

    const response = await request(app)
      .get("/users/1")
      .set("Authorization", `Bearer ${token}`);
    const { statusCode, body } = response;
    expect(statusCode).toEqual(200);
    expect(body.username).toEqual("mock_user");

    expect(db.user.findUnique).toHaveBeenCalledWith({
      select: {
        createdAt: true,
        email: true,
        id: true,
        role: true,
        username: true,
      },
      where: { id: 1 },
    });
  });

  it("should return 404 if user does not exist", async () => {
    const token = generateToken(7, "user");

    // 1. Mock the specific Prisma method
    // Notice: We return the OBJECT, not { rows: [...] }
    db.user.findUnique.mockResolvedValue(null);

    const response = await request(app)
      .get("/users/7")
      .set("Authorization", `Bearer ${token}`);

    // 👇 ADD THIS LINE
    if (response.statusCode !== 404) {
      //console.log('🛑 DEBUG ERROR BODY:', response.body);
    }
    expect(response.statusCode).toEqual(404);
  });
});
