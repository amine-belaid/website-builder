const { DataTypes } = require('sequelize');
const bcrypt        = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true }
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, { tableName: 'users', timestamps: true });

// Hash password before saving
User.beforeCreate(async (user) => {
  user.password_hash = await bcrypt.hash(user.password_hash, 12);
});

// Instance method: compare password if exist in DB or not 
//simplify connexion(login) 
User.prototype.validatePassword = async function(plain) {
  return bcrypt.compare(plain, this.password_hash);
};

module.exports = User;