require('dotenv').config();
require('./src/models'); // registers all models + associations

const express = require('express');
const cors    = require('cors');
const helmet  = require('helmet');
const morgan  = require('morgan');


const authRoutes   = require('./src/routes/auth');
const siteRoutes   = require('./src/routes/sites');
const pageRoutes   = require('./src/routes/pages');
const assetRoutes  = require('./src/routes/assets');
const errorHandler = require('./src/middleware/errorHandler');
const path = require('path');

const app = express();

// Security & logging
app.use(helmet()); //Injects HTTP security headers.
app.use(morgan('dev'));

// CORS — only allow your frontend URL
app.use(cors({
  origin: function (origin, callback) {
    // Autorise les requêtes sans origine (comme Postman) ou venant de vercel.app
    if (!origin || origin.endsWith('.vercel.app') || origin === process.env.CLIENT_URL) {
      callback(null, true);
    } else {
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true
}));

// Parse JSON bodies
app.use(express.json());

// Routes
app.use('/auth',   authRoutes);
app.use('/sites',  siteRoutes);
app.use('/',  pageRoutes);
app.use('/assets', assetRoutes);
app.use('/published', express.static(path.join(__dirname, 'public/published')));

// Health check
app.get('/health', (req, res) => res.json({ ok: true }));

// Global error handler (always last)
app.use(errorHandler);

module.exports = app;