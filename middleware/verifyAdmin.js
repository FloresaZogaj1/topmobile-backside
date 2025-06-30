// middleware/verifyAdmin.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async function (req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token mungon.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'sekretiYT');
    if (payload.role !== 'admin') {
      return res.status(403).json({ error: 'Vetëm admin mund të hyjë këtu.' });
    }
    // ruaj payload në req.user për përdorje më vonë
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Token i pavlefshëm!' });
  }
};
