const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
//define : Elle retourne une Classe Sequelize
const Site = sequelize.define('Site', {
  id:          { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  user_id:     { type: DataTypes.UUID, allowNull: false },
  name:        { type: DataTypes.STRING, allowNull: false },
  subdomain:   { type: DataTypes.STRING, unique: true },
  published_at:{ type: DataTypes.DATE }
}, { tableName: 'sites', timestamps: true });

module.exports = Site;

