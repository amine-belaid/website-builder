const jwt  = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });

exports.register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    if (password.length < 8)
      return res.status(400).json({ error: 'Password must be 8+ characters' });

    // password_hash stores plain text here;
    // the beforeCreate hook hashes it automatically
    const user = await User.create({ email, password_hash: password });

    const token = signToken(user.id);
    res.status(201).json({ token, userId: user.id });

  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError')
      return res.status(409).json({ error: 'Email already in use' });
    next(err);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    // Always validate (even if user not found) to prevent timing attacks
    const valid = user
      ? await user.validatePassword(password)
      : await bcrypt.hash('dummy', 12);  // constant time

    if (!user || !valid)
      return res.status(401).json({ error: 'Invalid credentials' });

    const token = signToken(user.id);
    res.json({ token, userId: user.id });

  } catch (err) { next(err); }
};