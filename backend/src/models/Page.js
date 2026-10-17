const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Page = sequelize.define('Page', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  site_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'home'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'Home'
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, { tableName: 'pages', timestamps: true });

module.exports = Page;