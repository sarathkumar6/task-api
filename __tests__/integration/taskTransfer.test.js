require("dotenv").config();
const crypto = require("crypto");
const request = require("supertest");
const app = require("../../app");
const db = require("../../db");
const jwt = require("jsonwebtoken");
describe("Task Transfer ACID Transaction Integration Test", () => {
  let userA, userB, task;

  beforeEach(async () => {
    // Create userA and userB in the test DB
    userA = await db.user.create({
      data: {
        username: "userA",
        email: "userA@akkodis.com",
        password: crypto.randomBytes(16).toString("hex"),
        role: "USER",
        taskCount: 1,
      },
    });
    userB = await db.user.create({
      data: {
        username: "userB",
        email: "userB@akkodis.com",
        password: crypto.randomBytes(16).toString("hex"),
        role: "USER",
        taskCount: 0,
      },
    });
    task = await db.task.create({
      data: {
        title: "Task to be transferred",
        description: "This task will be transferred from userA to userB",
        userId: userA.id,
      },
    });
    console.log("Setup complete: ", { userA, userB, task });
  });

  afterEach(async () => {
    // Clean up test data
    await db.task.deleteMany({});
    await db.user.deleteMany({});
    await db.auditLog.deleteMany({});
  });

  afterAll(async () => {
    await db.$disconnect();
  });

  test("Should transfer task from userA to userB atomically", async () => {
    const tokenA = jwt.sign(
      { userId: userA.id, role: "USER" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    const response = await request(app)
      .patch(`/tasks/${task.id}/transfer`)
      .send({ toUserId: userB.id })
      .set("Authorization", `Bearer ${tokenA}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.status).toBe("Task transferred successfully");

    // Verify task ownership change
    await db.task
      .findUnique({
        where: {
          id: task.id,
        },
      })
      .then((updatedTask) => {
        expect(updatedTask.userId).toBe(userB.id);
        expect(updatedTask.title).toBe("Task to be transferred");
        expect(updatedTask.description).toBe(
          "This task will be transferred from userA to userB",
        );
      });

    await db.user
      .findUnique({
        where: {
          id: userA.id,
        },
      })
      .then((updatedUserA) => {
        expect(updatedUserA.taskCount).toBe(0);
      });

    await db.user
      .findUnique({
        where: {
          id: userB.id,
        },
      })
      .then((updatedUserB) => {
        expect(updatedUserB.taskCount).toBe(1);
      });

    await db.auditLog
      .findMany({
        where: {
          entityId: task.id,
          entityType: "TASK",
        },
      })
      .then((logs) => {
        expect(logs.length).toBe(1);
        const { action, performedBy, status, ipAddress } = logs[0];
        expect(action).toBe("TASK_TRANSFER");
        expect(performedBy).toBe(userA.id);
        expect(status).toBe("SUCCESS");
        expect(ipAddress).toBeDefined();
      });
  });

  test("Should fail transfer if toUserId does not exist", async () => {
    const tokenA = jwt.sign(
      { userId: userA.id, role: "USER" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" },
    );

    const response = await request(app)
      .patch(`/tasks/${task.id}/transfer`)
      .send({
        toUserId: 1234,
      })
      .set("Authorization", `Bearer ${tokenA}`);

    expect(response.statusCode).toBe(404);
    console.log("response.body: ", response.body);
    //TODO: Fix the service to return error body
    expect(response.body.status).toBe("error");
    expect(response.body.message).toBe("Target user not found.");

    // ATOMICITY TEST
    // Even if the code tried to update user A's task count it should have rolleb back
    await db.task
      .findUnique({
        where: {
          id: task.id,
        },
      })
      .then((unchangedTask) => {
        expect(unchangedTask.userId).toBe(userA.id); // Still with userB from previous test
      });

    await db.user
      .findUnique({
        where: {
          id: userA.id,
        },
      })
      .then((unchangedUserB) => {
        expect(unchangedUserB.taskCount).toBe(1); // Still 1
      });

    await db.user
      .findUnique({
        where: {
          id: userB.id,
        },
      })
      .then((unchangedUserA) => {
        expect(unchangedUserA.taskCount).toBe(0); // Still 0
      });
  });
});
