//Son rôle est de sécuriser les routes privées de votre API :
//il intercepte la requête, vérifie si l'utilisateur fournit un jeton JWT valide,
//puis injecte l'utilisateur authentifié directement dans la requête avant de lui laisser l'accès à la route.

const jwt  = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
  try {
    // Extract token from "Authorization: Bearer "
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer '))
      return res.status(401).json({ error: 'No token provided' });

    const token = header.split(' ')[1];

    // Verify & decode the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the user to the request object
    const user = await User.findByPk(decoded.userId); // find user by primary key 
    if (!user) return res.status(401).json({ error: 'User not found' });

    req.user = user;
    next();  // pass control to the route handler

  } catch (err) {
    if (err.name === 'JsonWebTokenError')
      return res.status(401).json({ error: 'Invalid token' });
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ error: 'Token expired' });
    next(err);
  }
};