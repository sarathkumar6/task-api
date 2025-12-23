const morgan = require('morgan');
const logger = require('./utils/logger');
const express = require('express');
const cookie = require('cookie-parser');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const testdbRoutes = require('./routes/testdb');
const taskRoutes = require('./routes/tasks');
const labRoutes = require('./routes/lab');
const simulateErrorRoutes = require('./routes/simulateError');
const debugStackRoutes = require('./routes/debug');
const {authenticationToken} = require('./middleware/authMiddleware');
const { globalLimiter, authLimiter } = require('./middleware/limiter');
const corsMiddleware = require('./middleware/security');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morganMiddleware = morgan(
    ':method :url :status :res[content-length] - :response-time ms',
    {
        stream: {
            write: (message) => logger.http(message.trim()),
        },
    }
)
const app = express(); // Returns express application instance
const requestBodyParser = express.json(); // Parses request body as JSON
const cookieParser = cookie();// Parses cookies from the request
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');

const swaggerDocument = YAML.load('./swagger.yaml');

app.use(helmet());
app.use(requestBodyParser);
app.use(cookieParser); 
app.use(morganMiddleware);
app.use(corsMiddleware);
// Apply global rate limiter
app.use(globalLimiter);
// This is a global limiter. You can also make specific ones for /login.
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
// Apply to all requests
app.use(limiter);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use((request, response, next) => {
    logger.info(`[Middleware] Processing request for url ${request.url}`);
    next();
});

// Authorization Endpoint
app.use('/auth', authLimiter, authRoutes); // you're mounting a sub-application

// Users endpoints
app.use('/users', authenticationToken, userRoutes); // you're mounting a sub-application

// Test DB
app.use('/test-db', testdbRoutes);

// Tasks endpoints
app.use('/tasks', taskRoutes);

// Lab Routes
app.use('/lab', labRoutes);

// Health Endpoint
app.get('/health', (request, response) => {
    response.json({ status: 'OK', message: 'Server is healthy' });
});

// Debug stack endpoint
app.get('/debug-stack', debugStackRoutes);

// Simulate Error endpoint
app.get('/simulate-error', simulateErrorRoutes)

// Conditional listen - if you run tests and you might run into Port 3000 already in use
if (require.main === module) {
    app.listen(3000, () => {
        logger.info('Server is running on port 3000');
    });
}

// Global Error Handler
app.use((error, request, response, next) => {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';

    response
    .status(statusCode)
    .json({
        status: 'error',
        statusCode,
        message,
        details: error.details || null
    });
});

module.exports = app;