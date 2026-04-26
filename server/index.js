const express = require('express');
const cors = require('cors');
const path = require('path');
const cron = require('node-cron');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

async function startServer() {
  // Initialize database first
  await db.initDatabase();
  db.initialize();

  // Routes (loaded after DB init)
  app.use('/api/company', require('./routes/company'));
  app.use('/api/drivers', require('./routes/drivers'));
  app.use('/api/trucks', require('./routes/trucks'));
  app.use('/api/deliveries', require('./routes/deliveries'));
  app.use('/api/rankings', require('./routes/rankings'));
  app.use('/api/gallery', require('./routes/gallery'));
  app.use('/api/admin', require('./routes/admin'));
  app.use('/api/shop', require('./routes/shop'));

  // Serve static files in production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
  }

  // AI Simulation - runs every minute
  const aiSimulator = require('./aiSimulator');
  cron.schedule('* * * * *', () => {
    aiSimulator.simulateAll();
  });

  // Keep alive ping (for free hosting like Render)
  if (process.env.NODE_ENV === 'production' && process.env.RENDER_EXTERNAL_URL) {
    cron.schedule('*/14 * * * *', () => {
      fetch(process.env.RENDER_EXTERNAL_URL)
        .then(() => console.log('Keep-alive ping sent'))
        .catch(() => {});
    });
  }

  // Monthly reset - 1st of each month at midnight
  cron.schedule('0 0 1 * *', () => {
    db.resetMonthlyKm();
    console.log('Monthly km reset completed');
  });

  app.listen(PORT, () => {
    console.log(`🚛 VTC Manager server running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
