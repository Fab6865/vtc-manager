const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { v4: uuidv4 } = require('uuid');

// Get all shop items
router.get('/', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM shop_items ORDER BY category, price').all();
    
    // Group by category
    const grouped = {
      training: items.filter(i => i.category === 'training'),
      truck_upgrade: items.filter(i => i.category === 'truck_upgrade'),
      garage_deco: items.filter(i => i.category === 'garage_deco'),
      garage_upgrade: items.filter(i => i.category === 'garage_upgrade')
    };
    
    res.json(grouped);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get items by category
router.get('/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    const items = db.prepare('SELECT * FROM shop_items WHERE category = ? ORDER BY price').all(category);
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buy a garage decoration
router.post('/buy/decoration/:itemId', (req, res) => {
  try {
    const { itemId } = req.params;
    
    const item = db.prepare('SELECT * FROM shop_items WHERE id = ? AND category = ?').get(itemId, 'garage_deco');
    if (!item) {
      return res.status(404).json({ error: 'Décoration non trouvée' });
    }
    
    const company = db.prepare('SELECT balance FROM company WHERE id = 1').get();
    if (company.balance < item.price) {
      return res.status(400).json({ error: `Solde insuffisant (${item.price}€ requis)` });
    }
    
    // Check if already owned
    const existing = db.prepare('SELECT * FROM garage_decorations WHERE decoration_type = ?').get(item.name);
    if (existing) {
      return res.status(400).json({ error: 'Décoration déjà possédée' });
    }
    
    // Purchase
    const id = uuidv4();
    db.prepare(`
      INSERT INTO garage_decorations (id, decoration_type, name)
      VALUES (?, ?, ?)
    `).run(id, item.name, item.name);
    
    db.prepare('UPDATE company SET balance = balance - ? WHERE id = 1').run(item.price);
    
    res.json({ success: true, decoration: item });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Buy a garage upgrade
router.post('/buy/garage-upgrade/:itemId', (req, res) => {
  try {
    const { itemId } = req.params;
    
    const item = db.prepare('SELECT * FROM shop_items WHERE id = ? AND category = ?').get(itemId, 'garage_upgrade');
    if (!item) {
      return res.status(404).json({ error: 'Amélioration non trouvée' });
    }
    
    const company = db.prepare('SELECT balance FROM company WHERE id = 1').get();
    if (company.balance < item.price) {
      return res.status(400).json({ error: `Solde insuffisant (${item.price}€ requis)` });
    }
    
    // Apply upgrade
    if (item.effect_type === 'capacity') {
      db.prepare('UPDATE garage SET capacity = capacity + ? WHERE id = 1').run(item.effect_value);
    } else if (item.effect_type === 'repair' || item.effect_type === 'fuel') {
      db.prepare('UPDATE garage SET level = level + 1 WHERE id = 1').run();
    }
    
    db.prepare('UPDATE company SET balance = balance - ? WHERE id = 1').run(item.price);
    
    const garage = db.prepare('SELECT * FROM garage WHERE id = 1').get();
    res.json({ success: true, garage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get owned decorations
router.get('/decorations', (req, res) => {
  try {
    const decorations = db.prepare('SELECT * FROM garage_decorations ORDER BY purchased_at DESC').all();
    res.json(decorations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get garage info
router.get('/garage', (req, res) => {
  try {
    const garage = db.prepare('SELECT * FROM garage WHERE id = 1').get();
    const decorations = db.prepare('SELECT * FROM garage_decorations').all();
    const trucksCount = db.prepare('SELECT COUNT(*) as count FROM trucks WHERE owned = 1').get().count;
    
    res.json({
      ...garage,
      decorations,
      trucks_count: trucksCount
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update garage name
router.put('/garage/name', (req, res) => {
  try {
    const { name } = req.body;
    db.prepare('UPDATE garage SET name = ? WHERE id = 1').run(name || 'Mon Garage');
    
    const garage = db.prepare('SELECT * FROM garage WHERE id = 1').get();
    res.json(garage);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
