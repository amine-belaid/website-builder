const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Asset = sequelize.define('Asset', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  url: {
    type: DataTypes.STRING,
    allowNull: false       // the Cloudinary / S3 CDN URL
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false       // original file name e.g. "banner.png"
  },
  size_bytes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  mimetype: {
    type: DataTypes.STRING,
    defaultValue: 'image/jpeg'  // useful for filtering later
  }
}, { tableName: 'assets', timestamps: true });

module.exports = Asset;