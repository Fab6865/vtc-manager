const express = require('express');
const router = express.Router();
const { db } = require('../database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configure multer for logo uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/logos');
    // Créer le dossier s'il n'existe pas (après reset Render)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo-${Date.now()}${ext}`);
  }
});

// Limite 5MB + images uniquement
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|webp|svg/;
    const ext = allowed.test(path.extname(file.originalname).toLowerCase());
    const mime = allowed.test(file.mimetype);
    if (ext && mime) return cb(null, true);
    cb(new Error('Type de fichier non autorise (images uniquement)'));
  }
});

// Get company info
router.get('/', (req, res) => {
  try {
    const company = db.prepare('SELECT * FROM company WHERE id = 1').get();
    const driverCount = db.prepare('SELECT COUNT(*) as count FROM drivers WHERE is_active = 1').get().count;
    const truckCount = db.prepare('SELECT COUNT(*) as count FROM trucks WHERE owned = 1').get().count;

    res.json({
      ...company,
      driver_count: driverCount,
      truck_count: truckCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update company info
router.put('/', (req, res) => {
  try {
    const { name, drive_mode } = req.body;

    if (name) {
      db.prepare('UPDATE company SET name = ? WHERE id = 1').run(name);
    }
    if (drive_mode && ['real', 'race'].includes(drive_mode)) {
      db.prepare('UPDATE company SET drive_mode = ? WHERE id = 1').run(drive_mode);
    }

    const company = db.prepare('SELECT * FROM company WHERE id = 1').get();
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload logo
// FIX: multer appelé manuellement pour catcher les erreurs de taille correctement
router.post('/logo', (req, res) => {
  upload.single('logo')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Fichier trop volumineux (max 5MB)' });
      }
      return res.status(400).json({ error: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier uploade' });
    }

    try {
      const logoPath = `/uploads/logos/${req.file.filename}`;
      db.prepare('UPDATE company SET logo = ? WHERE id = 1').run(logoPath);
      res.json({ logo: logoPath });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
});

// Get dashboard stats
router.get('/dashboard', (req, res) => {
  try {
    const company = db.prepare('SELECT * FROM company WHERE id = 1').get();
    const drivers = db.prepare('SELECT * FROM drivers WHERE is_active = 1').all();
    const trucks = db.prepare('SELECT * FROM trucks WHERE owned = 1').all();
    const recentDeliveries = db.prepare(`
      SELECT * FROM deliveries 
      ORDER BY delivered_at DESC 
      LIMIT 5
    `).all();

    const totalKmReal = company.monthly_km_real || 0;
    const totalKmRace = company.monthly_km_race || 0;

    const allCompanies = db.prepare('SELECT * FROM ai_companies').all();

    // Classement filtré par mode
    const realCompanies = allCompanies.filter(c => c.drive_mode === 'real');
    const raceCompanies = allCompanies.filter(c => c.drive_mode === 'race');

    const realRanking = realCompanies.filter(c => c.monthly_km_real > totalKmReal).length + 1;
    const raceRanking = raceCompanies.filter(c => c.monthly_km_race > totalKmRace).length + 1;

    const totalRealCompanies = realCompanies.length + (company.drive_mode === 'real' ? 1 : 0);
    const totalRaceCompanies = raceCompanies.length + (company.drive_mode === 'race' ? 1 : 0);

    res.json({
      company,
      stats: {
        balance: company.balance,
        driver_count: drivers.length,
        truck_count: trucks.length,
        monthly_km_real: totalKmReal,
        monthly_km_race: totalKmRace,
        real_ranking: realRanking,
        race_ranking: raceRanking,
        total_real_companies: totalRealCompanies,
        total_race_companies: totalRaceCompanies,
        total_companies: allCompanies.length + 1
      },
      recent_deliveries: recentDeliveries,
      drivers,
      trucks
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get transaction history
router.get('/transactions', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const transactions = db.prepare(`
      SELECT t.*, d.name as driver_name, tr.name as truck_name
      FROM transactions t
      LEFT JOIN drivers d ON t.driver_id = d.id
      LEFT JOIN trucks tr ON t.truck_id = tr.id
      ORDER BY t.created_at DESC
      LIMIT ?
    `).all(limit);

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayStats = db.prepare(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expenses
      FROM transactions
      WHERE created_at >= ?
    `).get(todayStart.toISOString());

    res.json({
      transactions,
      summary: {
        today_income: todayStats?.total_income || 0,
        today_expenses: todayStats?.total_expenses || 0,
        today_profit: (todayStats?.total_income || 0) - (todayStats?.total_expenses || 0)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;