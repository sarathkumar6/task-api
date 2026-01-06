const express = require("express");
const router = express.Router();

// Simulate Error Endpoint
router.get("/", (request, response, next) => {
  console.log(`[Route] Oops! Something went wrong inside the route`);
  const simulatedError = new Error("Database is down");
  next(simulatedError);
});

module.exports = router;
