const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 

  if (token == null) {
    return res.status(401).json({ message: 'Authentication token is required.' });
  }

  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, userPayload) => {
    if (err) {
      // catch expired tokens or invalid tokens
      return res.status(403).json({ message: 'Token is invalid or has expired.' });
    }
    // If the token is valid, attach its payload to the request object
    req.user = userPayload;
    next(); 
  });
};

const authorizeRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== requiredRole) {
      return res.status(403).json({ message: 'Access Denied: You do not have permission to perform this action.' });
    }
    next();
  };
};

module.exports = { authenticateToken, authorizeRole };