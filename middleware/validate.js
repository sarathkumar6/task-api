const validate = function validate(schema) {
    return function validateRequest(request, response, next) {
        try {
            schema.parse(request.body);
            next();
        } catch (error) {
            console.log("Validation error:", error);
         return response.status(400).json({
            status: 'error',
            details: JSON.parse(error.message),
         });
        }
    }
};

module.exports = validate;