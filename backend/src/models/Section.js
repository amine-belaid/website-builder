const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Section = sequelize.define('Section', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  page_id: {
    type: DataTypes.UUID,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false     // 'hero' | 'text' | 'image' | 'navbar'
  },
  props: {
    type: DataTypes.JSONB,
    defaultValue: {}
  },
  order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, { tableName: 'sections', timestamps: false });

module.exports = Section;