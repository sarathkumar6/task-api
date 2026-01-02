const request = require('supertest');
const app = require('../app'); // task-api express app
const db = require('../db'); // Prisma Client

describe('DB Concurrency and Race Conditions', () => {
   const product_id = 3; 

   beforeAll(async () => {
    console.log("Setting up product for concurrency test");
        await db.product.upsert({
            where: {
                id: product_id
            },
            update: {
                inventory: 1,
                version: 0
            },
            create: {
                id: product_id,
                name: 'Race Condition Test Product',
                inventory: 1,
                version: 0
            }
        });
    });

    afterAll(async () => {
        await db.$disconnect();
    });

    it('should only allow ONE pucharse when multiple users hit buy simultaneously', async () => {
        const users = ['user1', 'user2', 'user3', 'user4', 'user5'];

        const results = await Promise.all(users.map(user => {
            return request(app)
                .post('/shop/buy')
                .send({ productId: product_id });
        }));

        const successResponses = results.filter(res => res.statusCode === 200);
        const failureResponses = results.filter(res => res.statusCode !== 200);

        expect(successResponses.length).toBe(1);
        expect(failureResponses.length).toBe(users.length - 1);

        const finalProduct = await db.product.findUnique({
            where: { id: product_id }
        });

        expect(finalProduct.inventory).toBe(0);
        expect(finalProduct.version).toBe(1);
    });

    // Why we're not adding a test to catch failure case? because we want the test to fail in the build to catch it

    it('should block further purchases once inventory hits zero', async () => {
        const response = await request(app)
        .post('/shop/buy')
        .send({ productId: product_id });

        expect(response.statusCode).toBe(400);
        expect(response.body.error).toBe('Product is out of stock');
    });
});