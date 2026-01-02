const express = require('express')
const router = express.Router();
const { Worker } = require('worker_threads');
const path = require('path');

// Debug stack endpoing
router.get('/test', (request, response) => {
    // 1. Get the router from the app instance
    const router = request.app._router;

    // 2. Safety check: If router is missing
    if (!router) {
        return response.json({ error: "Router not found. Check Express version." });
    }

    // 3. Map the internal stack to a readable list
    const stackInfo = router.stack.map((layer, index) => {
        let type = 'MIDDLEWARE';
        let pathInfo = 'Global (matches all)';

        if (layer.route) {
            type = 'ROUTE (Endpoint)';
            pathInfo = layer.route.path; // e.g. "/health"
        } else if (layer.name === 'router') {
            type = 'SUB-APP (Mounted Router)';
            // This regex is what Express made from your '/auth' string
            pathInfo = layer.regexp.toString(); 
        }

        return {
            position: index,
            name: layer.name || 'anonymous',
            type: type,
            match_logic: pathInfo
        };
    });

    // 4. Send the result to the browser
    response.json(stackInfo);
});

// THE BLOCKER
router.get('/heavy', (request, response) => {
    console.log("Heavy computation started");

    const start = Date.now();
    const result = calculateFibonacci(45); // Adjust number for desired load
    const duration = Date.now() - start;

    console.log("Heavy computation finished in ${} ms", duration);
    response.json({ result, duration_ms: duration });
});

router.get('/heavy-parallel', (request, response) => {
    console.log("Heavy computation (parallel) started");

    const start = Date.now();

    // 1. Create a worker thread
    const workerPath = path.resolve(__dirname, '../workers/fibonacciWorker.js');
    const worker = new Worker(workerPath, {
        workerData: { number: 45 } // Adjust number for desired load
    });

    worker.on('message', (result) => {
        const duration = Date.now() - start;
        console.log("Heavy computation (parallel) finished in ${} ms", duration);
        response.json({ message: 'Heavy task done via worker', result, duration_ms: duration });
    });

    worker.on('error', (error) => {
        console.error("Worker error:", error);
        response.status(500).json({ error: `Worker thread failed with ${error.message}` });
    });
});
// THE INNOCENT BYSTANDER
router.get('/ping', (request, response) => {
    response.json({ message: 'pong' });
});

// Helper function to calculate Fibonacci number (inefficiently)
function calculateFibonacci(n) {
    if (n <= 1) return n;
    return calculateFibonacci(n - 1) + calculateFibonacci(n - 2);
}

module.exports = router;