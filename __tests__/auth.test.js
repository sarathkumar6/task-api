const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../app'); // task-api express app
const db = require('../db'); // Prisma Client


describe('Auth Integration & Task Security', () => {
    const userPayload = {
        userId: 3,
        email: 'srdev1@akkodis.com'
    };
    const validToken = jwt.sign(userPayload, process.env.JWT_SECRET);

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
            expect(res.body.userId).toBe(3);
        })
    })
})