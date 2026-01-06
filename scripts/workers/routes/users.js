const express = require('express');
const router = express.Router();
const db = require('../db');
const { param, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const { ownershipCheck } = authMiddleware;
const AppError = require('../utils/AppError');
const validateRequest = (request, response, next) => {
    const errors = validationResult(request);
    if (!errors.isEmpty()) {
        return next(new AppError('Validation Failed', 400, errors.array()));
    }
    next();
}
router.get('/', async(request, response) => {
    try {
        // Prisma Magic
        const users = await db.user.findMany({
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true
                // Skip pwd here
            }
        });
        response.json(users);
    } catch (error) {
        console.error(error);
        response.json(500).json({
            error: 'Internal Server Error'
        })
    }
});

router.get('/:id', 
    param('id').isNumeric().withMessage('User id must be a number.'),
    validateRequest,
    ownershipCheck,
    async (request, response, next) => {
    console.log("request params are:", request.params);
    try {
        const {id} = request.params;

    const user = await db.user.findUnique({
        where: { id: parseInt(id) },
        select: {
            id: true,
            username: true,
            email: true,
            role: true,
            createdAt: true
        }
    });

    console.log("User is: ", user);

    if (!user) {
        return next(new AppError('User not found', 404));
    }

    response.json(user);
    } catch (error) {
        next(error)
    }
    
});
module.exports = router;