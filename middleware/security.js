const cors = require('cors');

const whitelist = [
    'http://localhost:5173', // Your React/Vite Frontend
    'http://localhost:4200', // Your Angular Frontend
    'https://my-production-app.com',
    'http://localhost:3000',
    'http://localhost:8080'
];

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin i.e., POSTMAN, Mobile Apps, or cURL
        if (!origin) {
            return callback(null, true);
        }
        console.log('CORS Origin:', origin);
        console.log('Whitelist:', whitelist);
        if (whitelist.indexOf(origin) !== -1) {
            // Origin is in the whitelist. Allow it
            callback(null, true);
        } else {
            // Origin is not allowed. BLOCK IT
            callback(new Error('Not Allowed By CORS'))
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true // Allows cookies/headers to be sent
};

module.exports = cors(corsOptions);