// const winston = require("winston");
// const SplunkStream = require('splunk-logging').LoggerStream;

// // Define security levels from 0 through 5 - Highest through lowest
// const levels = {
//   error: 0,
//   warn: 1,
//   info: 2,
//   http: 3,
//   debug: 4,
// };

// const level = () => {
//   const env = process.env.NODE_ENV || "development";
//   const isDevelopment = env === "development";
//   return isDevelopment ? "debug" : "warn";
// };

// // Define colors to levels
// const colors = {
//   error: "red",
//   warn: "yellow",
//   info: "green",
//   http: "magenta",
//   debug: "white",
// };

// // Indicate winston colors to use
// winston.addColors(colors);

// const format = winston.format.combine(
//   winston.format.timestamp({
//     format: "YYYY-MM-DD HH:mm:ss:ms",
//   }), // timestamp
//   winston.format.colorize({
//     all: true,
//     colors: colors,
//   }), // colorize logs
//   winston.format.printf(
//     (info) => `${info.timestamp} ${info.level}: ${info.message}`,
//   ), //log format to print
// );

// // Where do logs gor?
// // In production, may be a file or splunk or datadog agent
// // For now, just the console
// const transports = [
//   new winston.transports.Console(),
//   // new winston.transports.File({ filename: 'logs/error.log', level: 'error'}),
// ];
// const logger = winston.createLogger({
//   level: level(),
//   levels,
//   format,
//   transports,
// });

// const auditLogger = winston.createLogger({
//   transports: [
//     new SplunkStream({
//       splunk: {
//         token: process.env.SPLUNK_HEC_TOKEN,
//         url: process.env.SPLUNK_URL || 'http://splunk:8088',
//       },
//       index: 'audit-logs',
//     })
//   ]
// });

// const appLogger = winston.createLogger({
//     level: level(),
//     format,
//     transports: [
//         new SplunkStream({
//             splunk: { token: process.env.SPLUNK_HEC_TOKEN, url: 'http://splunk:8088' },
//             index: 'app_errors' // Operational data
//         })
//     ]
// });

// // Only add Splunk in production/integration environments to keep tests fast
// if (process.env.NODE_ENV !== 'test') {
//     appLogger.add(new SplunkStream(splunkSettings));
// }

// module.exports = logger;

const winston = require('winston');
const SplunkLogger = require("splunk-logging").Logger;

// 1. Configure the Splunk Connection
const splunkConfig = {
    token: process.env.SPLUNK_HEC_TOKEN || "00000000-0000-0000-0000-000000000000",
    url: process.env.SPLUNK_URL || "http://splunk:8088/services/collector/event"
};

const splunk = new SplunkLogger(splunkConfig);

// Handle Splunk errors globally so the app doesn't crash if Splunk is down
splunk.error = (err, context) => {
    console.error("Splunk Logger Error:", err, "Context:", context);
};

// 2. Create a Custom Winston Transport for Splunk
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports: [
        new winston.transports.Console()
    ]
});

// 3. Principal Logic: Only stream to Splunk if not in Test mode
// if (process.env.NODE_ENV !== 'test') {
//     const splunkTransport = new winston.transports.Stream({
//         stream: {
//             write: (message) => {
//                 try {
//                   const parsedMessage = JSON.parse(message);
//                   const payload = {
//                     message: parsedMessage,
//                     metadata: {
//                         source: "task-api",
//                         sourcetype: "_json",
//                         index: "audit_logs" // Explicitly set index
//                     }
//                 };
//                 splunk.send(payload, (error, response, body) => {
//                   if (error) {
//                       console.error("Error sending log to Splunk:", error);
//                   }
//                   if (body && body.code !== 0) {
//                       console.error("Splunk HEC Rejection:", body);
//                   }
//                 });
//                 } catch (error) {
//                     console.error("Logger Parsing Error:", error);
//                 }
//             }
//         }
//     });
//     logger.add(splunkTransport);
// }

// 3. Principal Logic: Functional Transport
if (process.env.NODE_ENV !== 'test') {
    logger.add(new winston.transports.Http({
        // We use the Http transport because HEC is an HTTP endpoint
        host: 'splunk',
        port: 8088,
        path: '/services/collector/event',
        headers: {
            'Authorization': `Splunk ${process.env.SPLUNK_HEC_TOKEN}`,
        },
        ssl: false,
        batchOptions:{
          limit: 1, // Send one log at a time
        },
        format: winston.format.combine(
            winston.format.timestamp(),
            // Wrap the mesage in an event object for Splunk HEC
            winston.format((info) => {
              const { timestamp, level, message, ...rest } = info;
                return {
                    event: { timestamp, level, message, ...rest },
                    sourcetype: "_json",
                    index: "audit_logs"
                };
            })(),
            winston.format.json()
        )
    }));

    // Handle transport errors
    logger.on('error', (err) => {
        console.error("Winston Transport Error (Splunk):", err);
    });
}

module.exports = logger;
