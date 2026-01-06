/* eslint-disable no-undef */
// ... all code in this file will ignore 'no-undef' errors
require("dotenv").config(); // without this you will run into SASL: SCRAM-SERVER-FIRST-MESSAGE as you're running this file in isolation
const { Pool } = require("pg");
const { PrismaPg } = require("@prisma/adapter-pg");
const { PrismaClient } = require("@prisma/client");

// Define global variable
let db;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

// Singleton Pattern Logic
if (process.env.NODE_ENV === "production") {
  db = new PrismaClient({
    adapter,
  });
} else {
  // Development mode
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      adapter,
    });
  }
  db = global.prisma;
}

async function main() {
  console.log("Seeding 1,000 tasks....");
  const userId = process.argv[2] || 1;
  const tasks = [];
  for (let i = 0; i < 5000; i++) {
    tasks.push({
      title: `Practice Task ${i}`,
      userId: parseInt(userId),
      isComplete: i % 2 === 0,
    });
  }

  await db.task.createMany({
    data: tasks,
  });
  console.log("Done! You now have 5,000 tasks to pracice with.");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => await db.$disconnect());
