const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../db');
const jwt = require('jsonwebtoken');

console.log("router contains:", Object.keys(router)); // Logs the keys of the router object

router.post('/register', async (request, response) => {
    try {
        const { username, email, password } = request.body;

        // Check incoming data
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await db.user.create({
            data: {
                username,
                email,
                password: hashedPassword,
                role: 'USER'
            },
            //Return only safe data. Exclude pwd
            select: {
                id: true,
                username: true,
                email: true,
                createdAt: true
            }
        });

        response.status(201).json(newUser);

        // Insert user into the database
        // using parameterized queries to prevent SQL injection
        /**const query = `
        INSERT INTO users (username, email, password_hash)
        VALUES ($1, $2, $3)
        RETURNING id, username, email, created_at
        `;
        const values = [username, email, hashedPassword];   
        const result = await db.query(query, values);

        // Respond with the new user data (excluding password)
        res.status(201).json({ user: result.rows[0] });**/
    } catch (error) {
        if (error.code === '23505') { // Unique violation error code in PostgreSQL
            return res.status(409).json({ error: 'Email already exists' });
        }
        console.error('Error during registration:', error);
        res.status(500).json({ error: 'Internal server error' });   
    }
});

router.post('/login', async (request, response) => {
    try {
        const { email, password, role } = request.body;
        const loggedInUser = await db.user.findUnique({
            where: { email: email },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
                createdAt: true,
                password: true,
            }
        });
        // Find the user by email
        //const query = 'SELECT * FROM users WHERE email = $1';
        //const result = await db.query(query, [email])
        //const user = result.rows[0];
        console.log("loggedInUser: ", loggedInUser);
        if (!loggedInUser) {
            return response.status(401).json({
                error: 'Invalid credentials'
            });
        }

        const isValidPassword = await bcrypt.compare(
            password, loggedInUser.password
        );

        if (!isValidPassword) {
            return response.status(401).json({
                error: 'Invalid credentials'
            });
        }
        console.log("User is: ", loggedInUser);
        // Generate JWT
        const token = jwt.sign(
            { userId: loggedInUser.id, username: loggedInUser.username, role },
            process.env.JWT_SECRET,
            { expiresIn: '10m' }
        );

        console.log("Token is:", token);
        // Send token in HttpOnly Cookie
        response.cookie('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict', // Protect against CSRF
            maxAge: 3600000 // 1 hour in milliseconds
        });

        response.json({
            message: 'Login successful',
            token: token
        });

    } catch (error) {
        console.error(error);
        response.status(500).json({
            error: 'Internal Server Error'
        });
    }
});


module.exports = router;