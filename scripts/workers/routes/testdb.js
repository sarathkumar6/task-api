const express = require("express");
const router = express.Router();
const db = require("../db");

router.get("/", async (request, response) => {
  const result = await db.query("SELECT NOW()");
  response.json(result.rows);
});

module.exports = router;
