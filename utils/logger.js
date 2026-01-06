const winston = require("winston");

// Define security levels from 0 through 5 - Highest through lowest
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const level = () => {
  const env = process.env.NODE_ENV || "development";
  const isDevelopment = env === "development";
  return isDevelopment ? "debug" : "warn";
};

// Define colors to levels
const colors = {
  error: "red",
  warn: "yellow",
  info: "green",
  http: "magenta",
  debug: "white",
};

// Indicate winston colors to use
winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({
    format: "YYYY-MM-DD HH:mm:ss:ms",
  }), // timestamp
  winston.format.colorize({
    all: true,
    colors: colors,
  }), // colorize logs
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ), //log format to print
);

// Where do logs gor?
// In production, may be a file or splunk or datadog agent
// For now, just the console
const transports = [
  new winston.transports.Console(),
  // new winston.transports.File({ filename: 'logs/error.log', level: 'error'}),
];
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
});

module.exports = logger;
