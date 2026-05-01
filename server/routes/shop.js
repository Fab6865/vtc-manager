const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { v4: uuidv4 } = require('uuid');

// Get all shop items
router.get('/', (req, res) => {
  try {
    const items = db.prepare('SELECT * FROM shop_items ORDER BY category, price').all();

    const grouped = {
      booster: items.filter(i => i.category === 'booster'),
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

// ============ BOOSTERS ============

// Buy a booster
// NOTE: nécessite que database.js ait la colonne 'duration' dans shop_items
router.post('/buy/booster/:itemId', (req, res) => {
  try {
    const { itemId } = req.params;

    const item = db.prepare('SELECT * FROM shop_items WHERE id = ? AND category = ?').get(itemId, 'booster');
    if (!item) {
      return res.status(404).json({ error: 'Booster non trouvé' });
    }

    const company = db.prepare('SELECT balance FROM company WHERE id = 1').get();
    if (company.balance < item.price) {
      return res.status(400).json({ error: `Solde insuffisant (${item.price}€ requis)` });
    }

    // item.duration vient maintenant correctement de la DB (colonne ajoutée dans database.js)
    const durationMinutes = item.duration || 60;
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();

    const id = uuidv4();
    db.prepare(`
      INSERT INTO active_boosters (id, booster_name, effect_value, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(id, item.name, item.effect_value, expiresAt);

    db.prepare('UPDATE company SET balance = balance - ? WHERE id = 1').run(item.price);

    res.json({
      success: true,
      booster: {
        id,
        name: item.name,
        effect_value: item.effect_value,
        expires_at: expiresAt,
        duration_minutes: durationMinutes
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get active boosters
router.get('/boosters/active', (req, res) => {
  try {
    db.prepare('DELETE FROM active_boosters WHERE expires_at < datetime("now")').run();

    const boosters = db.prepare('SELECT * FROM active_boosters ORDER BY expires_at').all();

    let totalBoost = 0;
    for (const booster of boosters) {
      totalBoost += booster.effect_value;
    }

    res.json({ boosters, total_boost: totalBoost });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ FORMATIONS (training) ============

// FIX: endpoint manquant pour acheter une formation via la boutique
router.post('/buy/training/:itemId', (req, res) => {
  try {
    const { itemId } = req.params;
    const { driver_id } = req.body;

    const item = db.prepare('SELECT * FROM shop_items WHERE id = ? AND category = ?').get(itemId, 'training');
    if (!item) {
      return res.status(404).json({ error: 'Formation non trouvée' });
    }

    if (!driver_id) {
      return res.status(400).json({ error: 'driver_id requis' });
    }

    const driver = db.prepare('SELECT * FROM drivers WHERE id = ? AND is_active = 1').get(driver_id);
    if (!driver) {
      return res.status(404).json({ error: 'Chauffeur non trouvé' });
    }

    const company = db.prepare('SELECT balance FROM company WHERE id = 1').get();
    if (company.balance < item.price) {
      return res.status(400).json({ error: `Solde insuffisant (${item.price}€ requis)` });
    }

    // Mapping effect_type → colonne driver (cohérent avec drivers.js)
    const columnMap = {
      driving: 'training_driving',
      eco: 'training_eco',
      endurance: 'training_endurance',
      adr: 'certification_adr',
      night: 'training_driving', // fallback sur conduite
      special: null              // permis convoi : pas de colonne, juste acheté
    };

    const column = columnMap[item.effect_type];

    if (column) {
      const current = driver[column] || 0;
      if (current < 100) {
        db.prepare(`UPDATE drivers SET ${column} = MIN(100, ${column} + ?) WHERE id = ?`)
          .run(item.effect_value, driver_id);
      }
    }

    db.prepare('UPDATE company SET balance = balance - ? WHERE id = 1').run(item.price);

    const updatedDriver = db.prepare('SELECT * FROM drivers WHERE id = ?').get(driver_id);
    res.json({ success: true, driver: updatedDriver });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ UPGRADES CAMION ============

// FIX: endpoint manquant pour acheter un upgrade camion via la boutique
router.post('/buy/truck-upgrade/:itemId', (req, res) => {
  try {
    const { itemId } = req.params;
    const { truck_id } = req.body;

    const item = db.prepare('SELECT * FROM shop_items WHERE id = ? AND category = ?').get(itemId, 'truck_upgrade');
    if (!item) {
      return res.status(404).json({ error: 'Upgrade non trouvé' });
    }

    if (!truck_id) {
      return res.status(400).json({ error: 'truck_id requis' });
    }

    // Accepte owned ET rented (cohérent avec drivers.js)
    const truck = db.prepare('SELECT * FROM trucks WHERE id = ? AND (owned = 1 OR rented = 1)').get(truck_id);
    if (!truck) {
      return res.status(404).json({ error: 'Camion non trouvé ou non possédé/loué' });
    }

    const company = db.prepare('SELECT balance FROM company WHERE id = 1').get();
    if (company.balance < item.price) {
      return res.status(400).json({ error: `Solde insuffisant (${item.price}€ requis)` });
    }

    // Appliquer l'effet selon le type
    if (item.effect_type === 'speed') {
      const newSpeed = Math.round(truck.max_speed * (1 + item.effect_value / 100));
      db.prepare('UPDATE trucks SET max_speed = ? WHERE id = ?').run(newSpeed, truck_id);
    } else if (item.effect_type === 'navigation') {
      // GPS : bonus km géré dans aiSimulator via truck_upgrades
    }

    // Enregistrer l'upgrade dans l'historique
    db.prepare(`
      INSERT INTO truck_upgrades (id, truck_id, upgrade_type, level)
      VALUES (?, ?, ?, 1)
    `).run(uuidv4(), truck_id, item.effect_type);

    db.prepare('UPDATE company SET balance = balance - ? WHERE id = 1').run(item.price);

    const updatedTruck = db.prepare('SELECT * FROM trucks WHERE id = ?').get(truck_id);
    res.json({ success: true, truck: updatedTruck });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get total active boost percentage (for simulation)
function getActiveBoostPercentage() {
  try {
    db.prepare('DELETE FROM active_boosters WHERE expires_at < datetime("now")').run();

    const boosters = db.prepare('SELECT effect_value FROM active_boosters').all();
    let totalBoost = 0;
    for (const booster of boosters) {
      totalBoost += booster.effect_value;
    }
    return totalBoost;
  } catch (e) {
    return 0;
  }
}

module.exports = router;
module.exports.getActiveBoostPercentage = getActiveBoostPercentage;