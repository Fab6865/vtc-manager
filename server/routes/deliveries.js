const express = require('express');
const router = express.Router();
const { db } = require('../database');
const { v4: uuidv4 } = require('uuid');

// Cargo types and their bonuses
const CARGO_BONUSES = {
  standard: 1.0,
  fragile: 1.15,
  heavy: 1.20,
  dangerous: 1.40,
  exceptional: 1.50
};

// Get all deliveries
router.get('/', (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const deliveries = db.prepare(`
      SELECT d.*, dr.name as driver_name, t.name as truck_name
      FROM deliveries d
      LEFT JOIN drivers dr ON d.driver_id = dr.id
      LEFT JOIN trucks t ON d.truck_id = t.id
      ORDER BY d.delivered_at DESC
      LIMIT ? OFFSET ?
    `).all(parseInt(limit), parseInt(offset));
    
    const total = db.prepare('SELECT COUNT(*) as count FROM deliveries').get().count;
    
    res.json({ deliveries, total });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new delivery (manual entry)
router.post('/', (req, res) => {
  try {
    const {
      origin,
      destination,
      cargo,
      cargo_type = 'standard',
      distance_km,
      km_real = 0,
      km_race = 0,
      on_time = true,
      driver_id = null,
      truck_id = null
    } = req.body;
    
    // Validation
    if (!origin || !destination || !cargo || !distance_km) {
      return res.status(400).json({ error: 'Champs requis manquants' });
    }
    
    // Validate minimum distance (250 km)
    const totalKm = (km_real || 0) + (km_race || 0);
    if (totalKm < 250) {
      return res.status(400).json({ error: 'Distance minimum de 250 km requise' });
    }
    
    // Revenue calculation
    const revenueReal = km_real * 1.20; // 1.20€/km in real mode
    const revenueRace = km_race * 0.80; // 0.80€/km in race mode
    let baseRevenue = revenueReal + revenueRace;
    
    // Apply cargo bonus
    const cargoBonus = CARGO_BONUSES[cargo_type] || 1.0;
    baseRevenue *= cargoBonus;
    
    // Apply on-time bonus/malus
    if (on_time) {
      baseRevenue *= 1.10; // +10% for on-time
    } else {
      baseRevenue *= 0.80; // -20% for late
    }
    
    // Calculate costs
    const fuelCost = totalKm * 0.30;
    const wearCost = totalKm * 0.05;
    const costs = fuelCost + wearCost;
    
    const profit = baseRevenue - costs;
    
    // Create delivery record
    const id = uuidv4();
    db.prepare(`
      INSERT INTO deliveries (id, origin, destination, cargo, cargo_type, distance_km, km_real, km_race, revenue, costs, profit, on_time, driver_id, truck_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, origin, destination, cargo, cargo_type, distance_km, km_real, km_race, baseRevenue, costs, profit, on_time ? 1 : 0, driver_id, truck_id);
    
    // Update company balance AND km stats (always update company km for rankings)
    db.prepare(`
      UPDATE company 
      SET balance = balance + ?,
          total_km_real = total_km_real + ?,
          total_km_race = total_km_race + ?,
          monthly_km_real = monthly_km_real + ?,
          monthly_km_race = monthly_km_race + ?
      WHERE id = 1
    `).run(profit, km_real, km_race, km_real, km_race);
    
    // Update driver stats if specified
    if (driver_id) {
      db.prepare(`
        UPDATE drivers 
        SET total_km_real = total_km_real + ?,
            total_km_race = total_km_race + ?,
            monthly_km_real = monthly_km_real + ?,
            monthly_km_race = monthly_km_race + ?
        WHERE id = ?
      `).run(km_real, km_race, km_real, km_race, driver_id);
    }
    
    // Update truck stats if specified
    if (truck_id) {
      db.prepare('UPDATE trucks SET total_km = total_km + ? WHERE id = ?').run(totalKm, truck_id);
    }
    
    const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(id);
    res.json(delivery);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get delivery stats
router.get('/stats', (req, res) => {
  try {
    const totalDeliveries = db.prepare('SELECT COUNT(*) as count FROM deliveries').get().count;
    const totalRevenue = db.prepare('SELECT SUM(revenue) as total FROM deliveries').get().total || 0;
    const totalProfit = db.prepare('SELECT SUM(profit) as total FROM deliveries').get().total || 0;
    const totalKmReal = db.prepare('SELECT SUM(km_real) as total FROM deliveries').get().total || 0;
    const totalKmRace = db.prepare('SELECT SUM(km_race) as total FROM deliveries').get().total || 0;
    
    // Monthly stats
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    
    const monthlyDeliveries = db.prepare(`
      SELECT COUNT(*) as count FROM deliveries 
      WHERE delivered_at >= ?
    `).get(monthStart.toISOString()).count;
    
    const monthlyProfit = db.prepare(`
      SELECT SUM(profit) as total FROM deliveries 
      WHERE delivered_at >= ?
    `).get(monthStart.toISOString()).total || 0;
    
    res.json({
      total_deliveries: totalDeliveries,
      total_revenue: totalRevenue,
      total_profit: totalProfit,
      total_km_real: totalKmReal,
      total_km_race: totalKmRace,
      monthly_deliveries: monthlyDeliveries,
      monthly_profit: monthlyProfit
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a delivery
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const delivery = db.prepare('SELECT * FROM deliveries WHERE id = ?').get(id);
    if (!delivery) {
      return res.status(404).json({ error: 'Livraison non trouvée' });
    }
    
    // Reverse the balance change
    db.prepare('UPDATE company SET balance = balance - ? WHERE id = 1').run(delivery.profit);
    
    // Delete the delivery
    db.prepare('DELETE FROM deliveries WHERE id = ?').run(id);
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
