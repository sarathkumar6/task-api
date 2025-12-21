const express = require('express')
const router = express.Router()

// Debug stack endpoing
router.get('/', (request, response) => {
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

module.exports = router;