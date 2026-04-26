const express = require('express');
const router = express.Router();
const { db } = require('../database');

// Get real mode rankings
router.get('/real', (req, res) => {
  try {
    // Get AI companies in real mode only
    const aiCompanies = db.prepare(`
      SELECT id, name, logo, monthly_km_real as monthly_km, total_km_real as total_km, 
             driver_count, truck_count, 'ai' as type
      FROM ai_companies
      WHERE drive_mode = 'real'
      ORDER BY monthly_km_real DESC
    `).all();
    
    // Get player company (use company km directly - includes player's own km + drivers)
    const company = db.prepare('SELECT * FROM company WHERE id = 1').get();
    const driverCount = db.prepare('SELECT COUNT(*) as count FROM drivers WHERE is_active = 1').get().count;
    const truckCount = db.prepare('SELECT COUNT(*) as count FROM trucks WHERE owned = 1').get().count;
    
    // Only include player if they are in real mode
    let allCompanies = [...aiCompanies];
    
    if (company.drive_mode === 'real') {
      const playerEntry = {
        id: 'player',
        name: company.name,
        logo: company.logo,
        monthly_km: company.monthly_km_real || 0,
        total_km: company.total_km_real || 0,
        driver_count: driverCount,
        truck_count: truckCount,
        type: 'player'
      };
      allCompanies.push(playerEntry);
    }
    
    // Sort by monthly km
    allCompanies.sort((a, b) => b.monthly_km - a.monthly_km);
    
    // Add rank
    allCompanies.forEach((c, i) => {
      c.rank = i + 1;
    });
    
    res.json({
      rankings: allCompanies,
      player_rank: allCompanies.findIndex(c => c.type === 'player') + 1,
      total: allCompanies.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get race mode rankings
router.get('/race', (req, res) => {
  try {
    // Get AI companies in race mode only
    const aiCompanies = db.prepare(`
      SELECT id, name, logo, monthly_km_race as monthly_km, total_km_race as total_km,
             driver_count, truck_count, 'ai' as type
      FROM ai_companies
      WHERE drive_mode = 'race'
      ORDER BY monthly_km_race DESC
    `).all();
    
    // Get player company (use company km directly - includes player's own km + drivers)
    const company = db.prepare('SELECT * FROM company WHERE id = 1').get();
    const driverCount = db.prepare('SELECT COUNT(*) as count FROM drivers WHERE is_active = 1').get().count;
    const truckCount = db.prepare('SELECT COUNT(*) as count FROM trucks WHERE owned = 1').get().count;
    
    // Only include player if they are in race mode
    let allCompanies = [...aiCompanies];
    
    if (company.drive_mode === 'race') {
      const playerEntry = {
        id: 'player',
        name: company.name,
        logo: company.logo,
        monthly_km: company.monthly_km_race || 0,
        total_km: company.total_km_race || 0,
        driver_count: driverCount,
        truck_count: truckCount,
        type: 'player'
      };
      allCompanies.push(playerEntry);
    }
    
    // Sort by monthly km
    allCompanies.sort((a, b) => b.monthly_km - a.monthly_km);
    
    // Add rank
    allCompanies.forEach((c, i) => {
      c.rank = i + 1;
    });
    
    res.json({
      rankings: allCompanies,
      player_rank: allCompanies.findIndex(c => c.type === 'player') + 1,
      total: allCompanies.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get combined overview
router.get('/overview', (req, res) => {
  try {
    // Get player company
    const company = db.prepare('SELECT * FROM company WHERE id = 1').get();
    const playerReal = { name: company.name, km: company.monthly_km_real || 0, type: 'player' };
    const playerRace = { name: company.name, km: company.monthly_km_race || 0, type: 'player' };
    
    // Get AI companies for real mode
    const aiReal = db.prepare(`
      SELECT name, monthly_km_real as km, 'ai' as type FROM ai_companies
      ORDER BY monthly_km_real DESC
    `).all();
    
    // Get AI companies for race mode
    const aiRace = db.prepare(`
      SELECT name, monthly_km_race as km, 'ai' as type FROM ai_companies
      ORDER BY monthly_km_race DESC
    `).all();
    
    // Combine and sort for real mode, take top 3
    const allReal = [...aiReal, playerReal].sort((a, b) => b.km - a.km).slice(0, 3);
    
    // Combine and sort for race mode, take top 3
    const allRace = [...aiRace, playerRace].sort((a, b) => b.km - a.km).slice(0, 3);
    
    res.json({
      top3_real: allReal,
      top3_race: allRace,
      player: {
        name: company.name,
        km_real: company.monthly_km_real || 0,
        km_race: company.monthly_km_race || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
