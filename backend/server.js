// server.js — entry point
const app = require('./app');
const { connectDB } = require('./src/config/database');

const PORT = process.env.PORT || 3000;

const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

const start = async () => {
  await connectDB();   // wait for DB before accepting requests
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();