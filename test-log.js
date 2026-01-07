const logger = require('./utils/logger');

console.log("🚀 Starting Splunk Log Test...");

logger.info("Principal Level Test: Audit Log to Splunk", { 
    action: "MANUAL_TEST", 
    sarath_status: "Persistence Mode" 
});

// Give the network 2 seconds to actually send the data before killing the process
setTimeout(() => {
    console.log("✅ Wait period over. Checking for Splunk errors above...");
    process.exit(0);
}, 2000);