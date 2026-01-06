const express = require("express");
const router = express.Router();
const prisma = require("../db");
// require('dotenv').config();
// const { PrismaClient } = require('@prisma/client')
// const prisma = new PrismaClient();

router.get("/tasks", async (request, response) => {
  try {
    // 1. Grab Query Params
    const { query } = request;
    const limit = parseInt(query.limit) || 10;
    const cursor = query.cursor ? parseInt(query.cursor) : undefined;

    // 2. Build the query
    const queryOptions = {
      take: limit,
      orderBy: {
        id: "desc", // Latest items first
      },
    };
    console.log("Query Options are ", queryOptions);
    // 3. Cursor logic
    if (cursor) {
      queryOptions.cursor = {
        id: cursor,
      };
      queryOptions.skip = 1; // We already have it
    }

    // 4. Fetch Data
    const tasks = await prisma.task.findMany(queryOptions);

    // 5. Calculate next cursor for the frontend
    const lastTask = tasks[tasks.length - 1];
    const nextCursor = tasks.length === limit ? lastTask.id : null;
    console.log("Last Task is ", lastTask);
    console.log("Next cursor is ", nextCursor);

    response.json({
      data: tasks,
      meta: {
        count: tasks.length,
        nextCursor: nextCursor,
      },
    });
  } catch (error) {
    console.error(error);
    response.status(500).json({
      error: "Lab explosion",
    });
  }
});

module.exports = router;
