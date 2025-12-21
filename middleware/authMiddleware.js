const jwt = require('jsonwebtoken');

const authenticationToken = (request, response, next) => {
    // GET token from request headers
    const authHeader = request.headers['authorization'];
    // If token exists, split it and get the second part
    const token = authHeader ? authHeader.split(' ')[1] : null;
    // If no token, deny the access with no token provided 401
    if (!token) {
        const error = new Error("Access Denied: No Token Provided");
        error.statusCode = 401;
        return next(error);
    }
    // Verify the token
    const JWT_SECRET = process.env.JWT_SECRET;
    jwt.verify(token, JWT_SECRET, (error, decodedUser) => {
        if (error) {
            const err = new Error("Access Denied: Invalid or Expored Token");
            err.statusCode = 403;
            return next(err);
        }
        request.user = decodedUser;
        console.log("Authentication Success for the User: ", request.user.username);
        next();
    })

}

const ownershipCheck = (request, response, next) => {
    // Who is requesting?
    const requesterId = request.user.user_id;
    console.log("requesterId: ", requesterId);
    // What is the role of the requestor?
    const requesterRole = request.user.role;
    console.log("requesterRole: ", requesterRole);
    // Which user are they trying to access?
    const targetId = parseInt(request.params.id);
    console.log("targetId: ", targetId);
    // Rule A: Respective user can access their own data
    if (requesterId === targetId) {
        return next();
    }

    // Rule B: Admins can access anyone's data
    if (requesterRole === 'admin') {
        return next();
    }

    const error = new Error('Forbidden: you are not allowed to access this information')
    error.statusCode = 403;
    next(error);
}

module.exports = {
    authenticationToken,
    ownershipCheck
};