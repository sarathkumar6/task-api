/* eslint-disable no-undef */
const express = require("express");
const router = express.Router();
const prisma = require("../db");

router.post("/buy", async (request, response) => {
  const { productId } = request.body;

  try {
    // 1. CHECK the inventory - READ
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });
    // 2. LOGIC is it available?
    if (!product || product.inventory <= 0) {
      return response.status(400).json({ error: "Product is out of stock" });
    }
    // Note: We're simulating a 50ms delay to mimic real-world processing time
    await sleep(50);

    // 3. ACT Decrement the inventory - WRITE
    // Update ONLY if the ID matches and version matches
    const updatedResult = await prisma.product.updateMany({
      where: {
        id: productId,
        version: product.version, // Security Guard to run into negative inventory
      },
      data: {
        inventory: product.inventory - 1,
        version: { increment: 1 }, // Bump version for the next update
      },
    });
    // 4. CHECK RESULT
    if (updatedResult.count === 0) {
      return response.status(409).json({
        error: "Purchase failed due to concurrent update. Please try again.",
      });
    }
    response.status(200).json({ message: "Purchase successful" });
  } catch (error) {
    response
      .status(500)
      .json({ error: "Internal server error", details: error.message });
  }
});

module.exports = router;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
