const morgan = require("morgan");
const logger = require("./utils/logger");
const express = require("express");
const cookie = require("cookie-parser");
const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const testdbRoutes = require("./routes/testdb");
const taskRoutes = require("./routes/tasks");
const labRoutes = require("./routes/lab");
const simulateErrorRoutes = require("./routes/simulateError");
const debugStackRoutes = require("./routes/debug");
const db = require("./db");
const shopRoutes = require("./routes/shop");
const { authenticationToken } = require("./middleware/authMiddleware");
const { globalLimiter, authLimiter } = require("./middleware/limiter");
const corsMiddleware = require("./middleware/security");
const helmet = require("helmet");
const morganMiddleware = morgan(
  ":method :url :status :res[content-length] - :response-time ms",
  {
    stream: {
      write: (message) => logger.http(message.trim()),
    },
  },
);
const app = express(); // Returns express application instance
// Health Endpoint
app.get("/health", async (request, response) => {
  try {
    logger.info(">>> THE DB HEALTH CHECK ROUTE WAS TRIGGERED <<<"); // Add this
    // 1. Check Database Connectivity
    // We use a raw query 'SELECT 1' because it's the fastest way 
    // to verify the connection without heavy processing.
    const resp = await db.$queryRaw`SELECT 1`;

    // 2. (Optional) Check other dependencies like Redis/Kafka here
    
    response.status(200).json({
      status: 'UP',
      database: 'CONNECTED',
      version: '2.0-db-check',
      timestamp: new Date().toISOString(),
        dbResponse: resp
    });
  } catch (error) {
    console.error('Health Check Failed:', error);
    
    // Returning a non-200 status tells OpenShift the pod is NOT ready
    response.status(503).json({
      status: 'DOWN',
      database: 'DISCONNECTED',
      error: error.message
    });
  }
});
app.use(helmet());
app.set("trust proxy", 1);
const requestBodyParser = express.json(); // Parses request body as JSON
const cookieParser = cookie(); // Parses cookies from the request
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");

const swaggerDocument = YAML.load("./swagger.yaml");

//app.use(helmet());
app.use(requestBodyParser);
app.use(cookieParser);
app.use(morganMiddleware);
app.use(corsMiddleware);
// Apply global rate limiter
app.use(globalLimiter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use((request, response, next) => {
  logger.info(`[Middleware] Processing request for url ${request.url}`);
  next();
});

// Authorization Endpoint
app.use("/auth", authLimiter, authRoutes); // you're mounting a sub-application

// Users endpoints
app.use("/users", authenticationToken, userRoutes); // you're mounting a sub-application

// Shop endpoints
app.use("/shop", shopRoutes);
// Test DB
app.use("/test-db", testdbRoutes);

// Tasks endpoints
app.use("/tasks", taskRoutes);

// Lab Routes
app.use("/lab", labRoutes);


// Debug stack endpoint
// NOTE: app.use is like mouting a small router application
//       app.get is terminal endpoint approach
app.use("/debug", debugStackRoutes);

// Simulate Error endpoint
app.get("/simulate-error", simulateErrorRoutes);

// Conditional listen - if you run tests and you might run into Port 3000 already in use
if (require.main === module) {
  const server = app.listen(3000, () => {
    logger.info("Server is running on port 3000");
    console.log("ACTIVE HANDLES:", process._getActiveHandles().length);
  });

  // Graceful Shutdown Function
  const handleShutdown = (signal) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);

    // Stop accepting new connections
    server.close(async () => {
      logger.info("HTTP server closed.");

      try {
        // Disconnect from Postgres
        await db.$disconnect();
        logger.info("Prisma disconnected. Process exiting cleanly.");
        process.exit(0);
      } catch (err) {
        logger.error("Error during Prisma disconnect:", err);
        process.exit(1);
      }
    });

    // Forced shutdown after 10 seconds (Safety net for hung connections)
    setTimeout(() => {
      logger.error("Forceful shutdown: Connections took too long to close.");
      process.exit(1);
    }, 10000);
  };

  // Listen for signals from OpenShift / Docker
  process.on("SIGTERM", () => handleShutdown("SIGTERM"));
  process.on("SIGINT", () => handleShutdown("SIGINT"));
}

// 2. 404 Handler (If no route matched above)
app.use((req, res) => {
  console.log(`404 Not Found: ${req.originalUrl}`);
  res.status(404).json({ message: "Route not found" });
});

// Global Error Handler
// Use _next here to indicate ignore variable warning unused but the next is needed to catch the error thrown
app.use((error, request, response, _next) => {
  console.log("Global Error Handler Invoked:", error);
  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";

  response.status(statusCode).json({
    status: "error",
    statusCode,
    message,
    details: error.details || null,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });
});

module.exports = app;
