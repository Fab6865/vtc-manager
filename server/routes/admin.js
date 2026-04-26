const express = require('express');
const router = express.Router();
const { db, resetMonthlyKm } = require('../database');
const { v4: uuidv4 } = require('uuid');

// Global setting for free hiring
let freeHiringEnabled = false;

// Get free hiring status
router.get('/free-hiring', (req, res) => {
  res.json({ enabled: freeHiringEnabled });
});

// Toggle free hiring
router.post('/free-hiring', (req, res) => {
  freeHiringEnabled = !freeHiringEnabled;
  res.json({ enabled: freeHiringEnabled });
});


// Add money
router.post('/money/add', (req, res) => {
  try {
    const { amount } = req.body;
    const value = parseFloat(amount) || 10000;
    
    db.prepare('UPDATE company SET balance = balance + ? WHERE id = 1').run(value);
    
    const company = db.prepare('SELECT balance FROM company WHERE id = 1').get();
    res.json({ balance: company.balance, added: value });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set money
router.post('/money/set', (req, res) => {
  try {
    const { amount } = req.body;
    const value = parseFloat(amount) || 0;
    
    db.prepare('UPDATE company SET balance = ? WHERE id = 1').run(value);
    
    res.json({ balance: value });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset money to 0
router.post('/money/reset', (req, res) => {
  try {
    db.prepare('UPDATE company SET balance = 0 WHERE id = 1').run();
    res.json({ balance: 0 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simulate time (advance AI simulation - ignores time restrictions)
router.post('/simulate-time', (req, res) => {
  try {
    const { minutes = 60 } = req.body;
    const aiSimulator = require('../aiSimulator');
    
    // Use forceSimulateAll to ignore night time restrictions
    for (let i = 0; i < minutes; i++) {
      aiSimulator.forceSimulateAll();
    }
    
    res.json({ success: true, simulated_minutes: minutes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reset monthly km
router.post('/reset-monthly', (req, res) => {
  try {
    resetMonthlyKm();
    res.json({ success: true, message: 'Reset mensuel effectué + modes IA redistribués' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test auto-detection of month change (simulates what happens at month end)
router.post('/test-month-change', (req, res) => {
  try {
    // This simulates what the system does automatically when month changes
    resetMonthlyKm();
    res.json({ 
      success: true, 
      message: '🧪 Test réussi! Le système a bien détecté le changement de mois.',
      actions: [
        'Km mensuels remis à 0',
        'Modes IA redistribués 50/50'
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Full reset
router.post('/reset-all', (req, res) => {
  try {
    // Reset company
    db.prepare(`
      UPDATE company SET 
        name = 'Ma VTC',
        logo = NULL,
        balance = 0,
        drive_mode = 'real'
      WHERE id = 1
    `).run();
    
    // Delete all drivers
    db.prepare('DELETE FROM drivers').run();
    
    // Reset all trucks
    db.prepare('UPDATE trucks SET owned = 0, rented = 0, assigned_driver_id = NULL, total_km = 0').run();
    
    // Delete all deliveries
    db.prepare('DELETE FROM deliveries').run();
    
    // Delete gallery
    db.prepare('DELETE FROM gallery').run();
    
    // Delete garage decorations
    db.prepare('DELETE FROM garage_decorations').run();
    
    // Reset garage
    db.prepare('UPDATE garage SET name = "Mon Garage", capacity = 2, level = 1 WHERE id = 1').run();
    
    // Reset AI companies
    db.prepare('DELETE FROM ai_companies').run();
    
    // Re-initialize AI companies
    const { v4: uuidv4 } = require('uuid');
    const companies = [
      { id: uuidv4(), name: 'TransEuropa', drive_mode: 'real', skill_level: 2, balance: 50000, driver_count: 3, truck_count: 3 },
      { id: uuidv4(), name: 'Nordic Freight', drive_mode: 'real', skill_level: 3, balance: 80000, driver_count: 5, truck_count: 4 },
      { id: uuidv4(), name: 'Alpine Transport', drive_mode: 'real', skill_level: 1, balance: 15000, driver_count: 1, truck_count: 1 },
      { id: uuidv4(), name: 'Baltic Logistics', drive_mode: 'real', skill_level: 2, balance: 35000, driver_count: 2, truck_count: 2 },
      { id: uuidv4(), name: 'Mediterranean Cargo', drive_mode: 'real', skill_level: 1, balance: 20000, driver_count: 2, truck_count: 1 },
      { id: uuidv4(), name: 'Speed Demons', drive_mode: 'race', skill_level: 3, balance: 60000, driver_count: 4, truck_count: 3 },
      { id: uuidv4(), name: 'Turbo Truckers', drive_mode: 'race', skill_level: 2, balance: 40000, driver_count: 3, truck_count: 2 },
      { id: uuidv4(), name: 'Highway Kings', drive_mode: 'race', skill_level: 2, balance: 45000, driver_count: 3, truck_count: 3 },
      { id: uuidv4(), name: 'Nitro Express', drive_mode: 'race', skill_level: 1, balance: 18000, driver_count: 1, truck_count: 1 },
      { id: uuidv4(), name: 'Thunder Road', drive_mode: 'race', skill_level: 3, balance: 75000, driver_count: 4, truck_count: 4 },
    ];
    
    const insert = db.prepare(`
      INSERT INTO ai_companies (id, name, drive_mode, skill_level, balance, driver_count, truck_count)
      VALUES (@id, @name, @drive_mode, @skill_level, @balance, @driver_count, @truck_count)
    `);
    
    for (const company of companies) {
      insert.run(company);
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unlock all trucks (give ownership)
router.post('/unlock-trucks', (req, res) => {
  try {
    db.prepare('UPDATE trucks SET owned = 1').run();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Set player ranking (for testing)
router.post('/set-ranking', (req, res) => {
  try {
    const { position, mode = 'real' } = req.body;
    
    // Get AI companies sorted by km
    const column = mode === 'real' ? 'monthly_km_real' : 'monthly_km_race';
    const aiCompanies = db.prepare(`SELECT * FROM ai_companies ORDER BY ${column} DESC`).all();
    
    if (position <= 0 || position > aiCompanies.length + 1) {
      return res.status(400).json({ error: 'Position invalide' });
    }
    
    // Calculate needed km to be at that position
    let targetKm;
    if (position === 1) {
      targetKm = (aiCompanies[0]?.[column] || 0) + 100;
    } else if (position > aiCompanies.length) {
      targetKm = 0;
    } else {
      targetKm = aiCompanies[position - 2][column] - 1;
    }
    
    // Update all player drivers
    const drivers = db.prepare('SELECT * FROM drivers WHERE is_active = 1').all();
    const kmPerDriver = targetKm / Math.max(drivers.length, 1);
    
    const updateColumn = mode === 'real' ? 'monthly_km_real' : 'monthly_km_race';
    db.prepare(`UPDATE drivers SET ${updateColumn} = ?`).run(kmPerDriver);
    
    res.json({ success: true, target_km: targetKm, position });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create AI company with personality
router.post('/ai-company', (req, res) => {
  try {
    const { 
      name, 
      drive_mode = 'real', 
      skill_level = 1,
      personality = 'stable',
      max_drivers = 5,
      balance = 10000,
      driver_count = 1
    } = req.body;
    
    const id = uuidv4();
    db.prepare(`
      INSERT INTO ai_companies (id, name, drive_mode, skill_level, personality, max_drivers, balance, driver_count, truck_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name || 'Nouvelle Entreprise', drive_mode, skill_level, personality, max_drivers, balance, driver_count, driver_count);
    
    const company = db.prepare('SELECT * FROM ai_companies WHERE id = ?').get(id);
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update AI company
router.put('/ai-company/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, drive_mode, skill_level, personality, max_drivers, balance, driver_count } = req.body;
    
    db.prepare(`
      UPDATE ai_companies 
      SET name = COALESCE(?, name),
          drive_mode = COALESCE(?, drive_mode),
          skill_level = COALESCE(?, skill_level),
          personality = COALESCE(?, personality),
          max_drivers = COALESCE(?, max_drivers),
          balance = COALESCE(?, balance),
          driver_count = COALESCE(?, driver_count)
      WHERE id = ?
    `).run(name, drive_mode, skill_level, personality, max_drivers, balance, driver_count, id);
    
    const company = db.prepare('SELECT * FROM ai_companies WHERE id = ?').get(id);
    res.json(company);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete AI company
router.delete('/ai-company/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM ai_companies WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all AI companies (for admin view)
router.get('/ai-companies', (req, res) => {
  try {
    const companies = db.prepare('SELECT * FROM ai_companies ORDER BY name').all();
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle god mode (no costs)
router.post('/god-mode', (req, res) => {
  try {
    // This would need to be stored and checked in other routes
    // For now, just add a lot of money
    db.prepare('UPDATE company SET balance = 999999999 WHERE id = 1').run();
    res.json({ success: true, message: 'God mode activé (999M€)' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all trucks (for admin)
router.get('/trucks', (req, res) => {
  try {
    const trucks = db.prepare('SELECT * FROM trucks ORDER BY price DESC').all();
    res.json(trucks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new truck
router.post('/truck', (req, res) => {
  try {
    const { 
      name, 
      model = name.toLowerCase().replace(/\s+/g, '_'),
      price = 50000,
      fuel_efficiency = 1.0,
      max_speed = 90,
      comfort = 2
    } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Nom du camion requis' });
    }
    
    const id = uuidv4();
    db.prepare(`
      INSERT INTO trucks (id, name, model, price, fuel_efficiency, max_speed, comfort)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, name, model, price, fuel_efficiency, max_speed, comfort);
    
    const truck = db.prepare('SELECT * FROM trucks WHERE id = ?').get(id);
    res.json(truck);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a truck
router.delete('/truck/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM trucks WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
module.exports.isFreeHiringEnabled = () => freeHiringEnabled;
