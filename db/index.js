/**const { Pool } = require('pg');
require('dotenv').config();

const { env } = process;
const { DB_HOST, DB_NAME, DB_PASSWORD, DB_PORT, DB_USER} = env;
const pool = new Pool({
    user: DB_USER,
    host: DB_HOST,
    database: DB_NAME,
    password: DB_PASSWORD,
    port: DB_PORT,
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};
{
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    }
**/
/* eslint-disable no-undef */
// ... all code in this file will ignore 'no-undef' errors
require("dotenv").config();
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

module.exports = db;
