class AppError extends Error {
    constructor(message, statusCode, details) {
        console.log("MESSAGE: ", message);
        console.log("STATUSCODE: ", statusCode);
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
        this.details = details
        this.isOperational = true;
    }
}

module.exports = AppError;