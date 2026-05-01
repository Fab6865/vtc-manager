const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { v4: uuidv4 } = require('uuid');

// Get free hiring status from admin routes
let isFreeHiringEnabled = () => false;
setTimeout(() => {
  try {
    const adminRoutes = require('./admin');
    if (adminRoutes.isFreeHiringEnabled) {
      isFreeHiringEnabled = adminRoutes.isFreeHiringEnabled;
    }
  } catch (e) {}
}, 100);

// Driver names for random generation
const FIRST_NAMES = ['Jean', 'Pierre', 'Michel', 'André', 'Philippe', 'Luc', 'Marc', 'Paul', 'Jacques', 'Henri', 'Klaus', 'Hans', 'Erik', 'Sven', 'Lars', 'Marco', 'Giovanni', 'Carlos', 'Pedro', 'Ivan'];
const LAST_NAMES = ['Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Müller', 'Schmidt', 'Weber', 'Rossi', 'Ferrari', 'Garcia', 'Lopez', 'Silva', 'Petrov', 'Novak'];

function generateDriverName() {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

// Get all drivers
router.get('/', (req, res) => {
  try {
    const drivers = db.prepare(`
      SELECT d.*, t.name as truck_name, t.model as truck_model
      FROM drivers d
      LEFT JOIN trucks t ON t.assigned_driver_id = d.id
      WHERE d.is_active = 1
      ORDER BY d.hired_at DESC
    `).all();
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Hire a new driver
router.post('/hire', (req, res) => {
  try {
    const company = db.prepare('SELECT balance FROM company WHERE id = 1').get();
    const hireCost = 500;

    if (!isFreeHiringEnabled() && company.balance < hireCost) {
      return res.status(400).json({ error: 'Solde insuffisant pour embaucher (500€ requis)' });
    }

    const name = req.body.name || generateDriverName();
    const id = uuidv4();

    db.prepare(`
      INSERT INTO drivers (id, name, skill_level)
      VALUES (?, ?, 1)
    `).run(id, name);

    if (!isFreeHiringEnabled()) {
      db.prepare('UPDATE company SET balance = balance - ? WHERE id = 1').run(hireCost);
    }

    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(id);
    res.json(driver);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Fire a driver
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    // Unassign from truck
    db.prepare('UPDATE trucks SET assigned_driver_id = NULL WHERE assigned_driver_id = ?').run(id);

    // Mark as inactive (keep history)
    db.prepare('UPDATE drivers SET is_active = 0 WHERE id = ?').run(id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Train a driver
router.post('/:id/train', (req, res) => {
  try {
    const { id } = req.params;
    const { training_type } = req.body;

    const company = db.prepare('SELECT balance FROM company WHERE id = 1').get();
    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(id);

    if (!driver) {
      return res.status(404).json({ error: 'Chauffeur non trouvé' });
    }

    const trainingCosts = {
      driving: 500,
      eco: 800,
      endurance: 1200,
      adr: 2000
    };

    const cost = trainingCosts[training_type];
    if (!cost) {
      return res.status(400).json({ error: 'Type de formation invalide' });
    }

    if (company.balance < cost) {
      return res.status(400).json({ error: `Solde insuffisant (${cost}€ requis)` });
    }

    // FIX: mapping correct des colonnes — certification_adr au lieu de training_adr
    const columnMap = {
      driving: 'training_driving',
      eco: 'training_eco',
      endurance: 'training_endurance',
      adr: 'certification_adr'
    };
    const column = columnMap[training_type];
    const currentLevel = driver[column] || 0;

    if (currentLevel >= 100) {
      return res.status(400).json({ error: 'Formation déjà au maximum' });
    }

    const increment = training_type === 'adr' ? 1 : 5;

    db.prepare(`UPDATE drivers SET ${column} = ${column} + ? WHERE id = ?`).run(increment, id);
    db.prepare('UPDATE company SET balance = balance - ? WHERE id = 1').run(cost);

    const updatedDriver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(id);
    res.json(updatedDriver);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Assign truck to driver
router.post('/:id/assign-truck', (req, res) => {
  try {
    const { id } = req.params;
    const { truck_id } = req.body;

    // FIX: accepte les camions loués (rented = 1) en plus des camions possédés (owned = 1)
    const truck = db.prepare('SELECT * FROM trucks WHERE id = ? AND (owned = 1 OR rented = 1)').get(truck_id);
    if (!truck) {
      return res.status(404).json({ error: 'Camion non trouvé ou non possédé/loué' });
    }

    // FIX: désassigner l'éventuel ancien chauffeur déjà sur ce camion
    db.prepare('UPDATE trucks SET assigned_driver_id = NULL WHERE id = ?').run(truck_id);

    // Désassigner ce chauffeur de son ancien camion
    db.prepare('UPDATE trucks SET assigned_driver_id = NULL WHERE assigned_driver_id = ?').run(id);

    // Assigner le camion au chauffeur
    db.prepare('UPDATE trucks SET assigned_driver_id = ? WHERE id = ?').run(id, truck_id);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get driver details
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const driver = db.prepare(`
      SELECT d.*, t.name as truck_name, t.model as truck_model
      FROM drivers d
      LEFT JOIN trucks t ON t.assigned_driver_id = d.id
      WHERE d.id = ?
    `).get(id);

    if (!driver) {
      return res.status(404).json({ error: 'Chauffeur non trouvé' });
    }

    res.json(driver);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get detailed stats for a driver
router.get('/:id/stats', (req, res) => {
  try {
    const { id } = req.params;
    const driver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(id);

    if (!driver) {
      return res.status(404).json({ error: 'Chauffeur non trouvé' });
    }

    const deliveries = db.prepare(`
      SELECT * FROM deliveries 
      WHERE driver_id = ? 
      ORDER BY delivered_at DESC
      LIMIT 50
    `).all(id);

    const totalDeliveries = deliveries.length;
    let totalRevenue = deliveries.reduce((sum, d) => sum + (d.revenue || 0), 0);
    let totalProfit = deliveries.reduce((sum, d) => sum + (d.profit || 0), 0);

    // Si pas de livraisons mais km simulés, estimation financière
    if (totalDeliveries === 0 && (driver.total_km_real > 0 || driver.total_km_race > 0)) {
      totalRevenue = (driver.total_km_real * 1.20) + (driver.total_km_race * 0.80);
      totalProfit = (driver.total_km_real * 0.35) + (driver.total_km_race * 0.25);
    }

    const avgProfitPerDelivery = totalDeliveries > 0 ? totalProfit / totalDeliveries : 0;
    const avgKmPerDelivery = totalDeliveries > 0 ? (driver.total_km_real + driver.total_km_race) / totalDeliveries : 0;

    const hiredDate = new Date(driver.hired_at);
    const daysSinceHired = Math.floor((Date.now() - hiredDate.getTime()) / (1000 * 60 * 60 * 24));

    const totalKm = driver.total_km_real + driver.total_km_race;
    const kmPerDay = daysSinceHired > 0 ? totalKm / daysSinceHired : totalKm;

    res.json({
      driver,
      stats: {
        total_deliveries: totalDeliveries,
        total_revenue: totalRevenue,
        total_profit: totalProfit,
        total_km: totalKm,
        total_km_real: driver.total_km_real,
        total_km_race: driver.total_km_race,
        monthly_km_real: driver.monthly_km_real,
        monthly_km_race: driver.monthly_km_race,
        avg_profit_per_delivery: avgProfitPerDelivery,
        avg_km_per_delivery: avgKmPerDelivery,
        days_employed: daysSinceHired,
        km_per_day: kmPerDay,
        training_total: driver.training_driving + driver.training_eco + driver.training_endurance + (driver.certification_adr * 10)
      },
      recent_deliveries: deliveries.slice(0, 10)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;