const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { v4: uuidv4 } = require('uuid');

// Get all trucks (available + owned)
router.get('/', (req, res) => {
  try {
    const trucks = db.prepare(`
      SELECT t.*, d.name as driver_name
      FROM trucks t
      LEFT JOIN drivers d ON t.assigned_driver_id = d.id
      ORDER BY t.owned DESC, t.price ASC
    `).all();
    res.json(trucks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get owned trucks only
router.get('/owned', (req, res) => {
  try {
    const trucks = db.prepare(`
      SELECT t.*, d.name as driver_name
      FROM trucks t
      LEFT JOIN drivers d ON t.assigned_driver_id = d.id
      WHERE t.owned = 1
      ORDER BY t.name
    `).all();
    res.json(trucks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buy a truck
router.post('/:id/buy', (req, res) => {
  try {
    const { id } = req.params;
    
    const truck = db.prepare('SELECT * FROM trucks WHERE id = ?').get(id);
    if (!truck) {
      return res.status(404).json({ error: 'Camion non trouvé' });
    }
    
    if (truck.owned) {
      return res.status(400).json({ error: 'Camion déjà possédé' });
    }
    
    const company = db.prepare('SELECT balance FROM company WHERE id = 1').get();
    if (company.balance < truck.price) {
      return res.status(400).json({ error: `Solde insuffisant (${truck.price}€ requis)` });
    }
    
    // Check garage capacity
    const garage = db.prepare('SELECT capacity FROM garage WHERE id = 1').get();
    const ownedCount = db.prepare('SELECT COUNT(*) as count FROM trucks WHERE owned = 1').get().count;
    
    if (ownedCount >= garage.capacity) {
      return res.status(400).json({ error: 'Garage plein! Agrandissez votre garage.' });
    }
    
    db.prepare('UPDATE trucks SET owned = 1 WHERE id = ?').run(id);
    db.prepare('UPDATE company SET balance = balance - ? WHERE id = 1').run(truck.price);
    
    const updatedTruck = db.prepare('SELECT * FROM trucks WHERE id = ?').get(id);
    res.json(updatedTruck);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rent a truck (cheaper alternative)
router.post('/:id/rent', (req, res) => {
  try {
    const { id } = req.params;
    
    const truck = db.prepare('SELECT * FROM trucks WHERE id = ?').get(id);
    if (!truck) {
      return res.status(404).json({ error: 'Camion non trouvé' });
    }
    
    if (truck.owned || truck.rented) {
      return res.status(400).json({ error: 'Camion déjà possédé ou loué' });
    }
    
    // Rent cost is 5% of price per month, paid upfront
    const rentCost = truck.price * 0.05;
    
    const company = db.prepare('SELECT balance FROM company WHERE id = 1').get();
    if (company.balance < rentCost) {
      return res.status(400).json({ error: `Solde insuffisant (${rentCost}€ requis pour la location)` });
    }
    
    db.prepare('UPDATE trucks SET rented = 1 WHERE id = ?').run(id);
    db.prepare('UPDATE company SET balance = balance - ? WHERE id = 1').run(rentCost);
    
    const updatedTruck = db.prepare('SELECT * FROM trucks WHERE id = ?').get(id);
    res.json(updatedTruck);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sell a truck
router.post('/:id/sell', (req, res) => {
  try {
    const { id } = req.params;
    
    const truck = db.prepare('SELECT * FROM trucks WHERE id = ?').get(id);
    if (!truck || !truck.owned) {
      return res.status(404).json({ error: 'Camion non trouvé ou non possédé' });
    }
    
    // Sell at 60% of original price
    const sellPrice = truck.price * 0.6;
    
    // Unassign driver
    db.prepare('UPDATE trucks SET owned = 0, assigned_driver_id = NULL WHERE id = ?').run(id);
    db.prepare('UPDATE company SET balance = balance + ? WHERE id = 1').run(sellPrice);
    
    res.json({ success: true, sell_price: sellPrice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Rename a truck
router.put('/:id/name', (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Nom invalide' });
    }
    
    db.prepare('UPDATE trucks SET name = ? WHERE id = ?').run(name.trim(), id);
    
    const truck = db.prepare('SELECT * FROM trucks WHERE id = ?').get(id);
    res.json(truck);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get truck details
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const truck = db.prepare(`
      SELECT t.*, d.name as driver_name
      FROM trucks t
      LEFT JOIN drivers d ON t.assigned_driver_id = d.id
      WHERE t.id = ?
    `).get(id);
    
    if (!truck) {
      return res.status(404).json({ error: 'Camion non trouvé' });
    }
    
    // Get upgrades
    const upgrades = db.prepare('SELECT * FROM truck_upgrades WHERE truck_id = ?').all(id);
    
    res.json({ ...truck, upgrades });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
