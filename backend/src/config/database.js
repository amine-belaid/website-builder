const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development'
    ? console.log
    : false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

// Test connection
const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');
    // sync({ force: true }) in dev to recreate tables
    await sequelize.sync({ alter: true });
    console.log('Models synced');
  } catch (err) {
    console.error('DB connection failed:', err);
    process.exit(1);
  }
};

module.exports = { sequelize, connectDB };