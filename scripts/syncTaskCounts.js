// scripts/syncTaskCounts.js
const path = require('path');
// This ensures we find the .env file in the root directory
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const db = require('../db');

async function syncTaskCounts() {
    try {
        // Safety Check: Log the URL (masked for security) to verify it's loaded
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error('❌ DATABASE_URL is undefined. The .env file was not loaded correctly.');
        process.exit(1);
    }
    console.log(`🔗 Connecting to database at: ${url.replace(/:[^:@]+@/, ':****@')}`);
        // We use $executeRaw because it's the most efficient way to 
        // update all users in a single database round-trip.
        const result = await db.$executeRaw`
        UPDATE "users"
        SET "taskCount" = (
            SELECT COUNT(*)
            FROM "tasks" AS "Task"
            WHERE "Task"."id" = "users"."id"
        );
        `;

        console.log(`✅ Success! Synchronized ${result} user records.`);
    } catch (error) {
        console.error('❌ Error synchronizing task counts:', error);
        process.exit(1);
    } finally {
        await db.$disconnect();
    }
}

syncTaskCounts();