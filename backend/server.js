// server.js — entry point
const app = require('./app');
const { connectDB } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

const start = async () => {
  await connectDB();   // wait for DB before accepting requests
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();