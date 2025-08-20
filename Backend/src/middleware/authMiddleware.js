const jwt = require('jsonwebtoken');
const db =  require('../config/db');

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

//Can be deleted since its not used
const blockCashier = (req, res, next) => {
  if (req.user && req.user.role === 'Cashier') {
    return res.status(403).json({ message: 'Access Denied: Cashiers are not allowed to perform this action.' });
  }
  next();
};

const authorizeAdminOrBranchOfficerForBranch = async (req, res, next) => {
  const {role,userId} = req.user;
  const branchId = req.params.branchId;

  if (role ==='Admin'){
    return next();
  }

  if (role === 'Branch Officer') {
    try {
      const userBranchQuery = 'SELECT branch_id FROM users WHERE user_id = $1';
      const { rows } = await db.query(userBranchQuery, [userId]);

      if (rows.length > 0 && rows[0].branch_id === branchId) {
        return next();

      } else {
        return res.status(403).json({ message: 'Access Denied: You are not authorized to manage this branch.' });
      }

    } catch (error) {
      console.error('Authorization check failed:', error);
      return res.status(500).json({ message: 'Internal server error during authorization check.' });
    }
  }

  res.status(403).json({ message: 'Access Denied: You do not have permission to perform this action.' });
}

module.exports = { authenticateToken, authorizeRole, blockCashier, authorizeAdminOrBranchOfficerForBranch };