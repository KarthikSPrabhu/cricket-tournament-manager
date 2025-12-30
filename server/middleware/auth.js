const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = (roles = []) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'User not found or inactive' });
      }

      // Check role if required
      if (roles.length > 0 && !roles.includes(user.role)) {
        return res.status(403).json({ message: 'Insufficient permissions' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      res.status(401).json({ message: 'Invalid token' });
    }
  };
};

module.exports = authMiddleware;