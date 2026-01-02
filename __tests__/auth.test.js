const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app'); // task-api express app
const db = require('../db'); // Prisma Client


describe('Auth Integration & Task Security', () => {
    const userPayload = {
        userId: 3,
        email: 'srdev1@akkodis.com'
    };
    let validToken;
    const TEST_USER_ID = 3;
    beforeAll(async () => {
        // 1. Ensure the user exists in the transient DB first
        await db.user.upsert({
            where: { id: TEST_USER_ID },
            update: {},
            create: {
                id: TEST_USER_ID,
                email: 'architect@test.com',
                username: 'test_architect',
                role: 'user'
            }
        });

        // 2. Generate the token using the SAME secret the app uses
        // Ensure your CI environment has this secret set
        validToken = jwt.sign(
            { userId: TEST_USER_ID, email: 'architect@test.com' }, 
            process.env.JWT_SECRET || 'test_secret_for_ci'
        );
    });

    // Clean up
    afterAll(async () => {
        // close DB connections
        await db.$disconnect();
    });

    describe('POST /tasks (Protected Route)', () => {
        it('Should block access if no token is provided', async () => {
            const res = await request(app)
            .post('/tasks')
            .send({
                title: 'Outsider Hacking'
            });
            
            expect(res.statusCode).toBe(401)
        });

        it('Should create a task when valid token is provided', async () => {
            const res = await request(app)
            .post('/tasks')
            .set('Authorization', `Bearer ${validToken}`)
            .send({
                title: 'Integration Test Task',
                description: 'Testing JWT Middleware'
            });
            expect(res.statusCode).toBe(201);
            expect(res.body.userId).toBe(TEST_USER_ID);
        })
    })
})