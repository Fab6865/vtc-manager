const express = require('express');
const router = express.Router();
const { db } = require('../database');

// Get real mode rankings
router.get('/real', (req, res) => {
  try {
    const aiCompanies = db.prepare(`
      SELECT id, name, logo, monthly_km_real as monthly_km, total_km_real as total_km, 
             driver_count, truck_count, 'ai' as type
      FROM ai_companies
      WHERE drive_mode = 'real'
      ORDER BY monthly_km_real DESC
    `).all();

    const company = db.prepare('SELECT * FROM company WHERE id = 1').get();
    const driverCount = db.prepare('SELECT COUNT(*) as count FROM drivers WHERE is_active = 1').get().count;
    const truckCount = db.prepare('SELECT COUNT(*) as count FROM trucks WHERE owned = 1').get().count;

    let allCompanies = [...aiCompanies];

    if (company.drive_mode === 'real') {
      allCompanies.push({
        id: 'player',
        name: company.name,
        logo: company.logo,
        monthly_km: company.monthly_km_real || 0,
        total_km: company.total_km_real || 0,
        driver_count: driverCount,
        truck_count: truckCount,
        type: 'player'
      });
    }

    allCompanies.sort((a, b) => b.monthly_km - a.monthly_km);
    allCompanies.forEach((c, i) => { c.rank = i + 1; });

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
    const aiCompanies = db.prepare(`
      SELECT id, name, logo, monthly_km_race as monthly_km, total_km_race as total_km,
             driver_count, truck_count, 'ai' as type
      FROM ai_companies
      WHERE drive_mode = 'race'
      ORDER BY monthly_km_race DESC
    `).all();

    const company = db.prepare('SELECT * FROM company WHERE id = 1').get();
    const driverCount = db.prepare('SELECT COUNT(*) as count FROM drivers WHERE is_active = 1').get().count;
    const truckCount = db.prepare('SELECT COUNT(*) as count FROM trucks WHERE owned = 1').get().count;

    let allCompanies = [...aiCompanies];

    if (company.drive_mode === 'race') {
      allCompanies.push({
        id: 'player',
        name: company.name,
        logo: company.logo,
        monthly_km: company.monthly_km_race || 0,
        total_km: company.total_km_race || 0,
        driver_count: driverCount,
        truck_count: truckCount,
        type: 'player'
      });
    }

    allCompanies.sort((a, b) => b.monthly_km - a.monthly_km);
    allCompanies.forEach((c, i) => { c.rank = i + 1; });

    res.json({
      rankings: allCompanies,
      player_rank: allCompanies.findIndex(c => c.type === 'player') + 1,
      total: allCompanies.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get drivers ranking
router.get('/drivers', (req, res) => {
  try {
    const company = db.prepare('SELECT * FROM company WHERE id = 1').get();
    const isRealMode = company.drive_mode === 'real';

    const drivers = db.prepare(`
      SELECT 
        id, name, avatar,
        monthly_km_real, monthly_km_race,
        total_km_real, total_km_race,
        training_driving, training_eco, training_endurance,
        'employee' as type
      FROM drivers
      WHERE is_active = 1
    `).all();

    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    const playerMonthlyKm = db.prepare(`
      SELECT 
        COALESCE(SUM(km_real), 0) as km_real,
        COALESCE(SUM(km_race), 0) as km_race,
        COALESCE(SUM(distance_km), 0) as distance_km
      FROM deliveries
      WHERE (driver_id IS NULL OR driver_id = '')
        AND delivered_at >= ?
    `).get(firstDayOfMonth);

    const playerTotalKm = db.prepare(`
      SELECT 
        COALESCE(SUM(km_real), 0) as km_real,
        COALESCE(SUM(km_race), 0) as km_race,
        COALESCE(SUM(distance_km), 0) as distance_km
      FROM deliveries
      WHERE (driver_id IS NULL OR driver_id = '')
    `).get();

    // Le patron apparaît toujours avec ses km de livraisons manuelles
    const playerDriver = {
      id: 'player',
      name: 'Le Patron',
      avatar: '👑',
      monthly_km_real: playerMonthlyKm.km_real || playerMonthlyKm.distance_km || 0,
      monthly_km_race: playerMonthlyKm.km_race || 0,
      total_km_real: playerTotalKm.km_real || playerTotalKm.distance_km || 0,
      total_km_race: playerTotalKm.km_race || 0,
      training_driving: 100,
      training_eco: 100,
      training_endurance: 100,
      type: 'player'
    };

    const allDrivers = [playerDriver, ...drivers];

    allDrivers.sort((a, b) => {
      const kmA = isRealMode ? a.monthly_km_real : a.monthly_km_race;
      const kmB = isRealMode ? b.monthly_km_real : b.monthly_km_race;
      return kmB - kmA;
    });

    const rankedDrivers = allDrivers.map((d, i) => ({
      ...d,
      rank: i + 1,
      monthly_km: isRealMode ? d.monthly_km_real : d.monthly_km_race,
      total_km: isRealMode ? d.total_km_real : d.total_km_race
    }));

    res.json({
      drivers: rankedDrivers,
      mode: company.drive_mode,
      total: rankedDrivers.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get combined overview
router.get('/overview', (req, res) => {
  try {
    const company = db.prepare('SELECT * FROM company WHERE id = 1').get();

    // FIX: filtrer les IA par mode pour éviter que les IA race apparaissent dans le top real avec 0 km
    const aiReal = db.prepare(`
      SELECT name, monthly_km_real as km, 'ai' as type 
      FROM ai_companies
      WHERE drive_mode = 'real'
      ORDER BY monthly_km_real DESC
    `).all();

    const aiRace = db.prepare(`
      SELECT name, monthly_km_race as km, 'ai' as type 
      FROM ai_companies
      WHERE drive_mode = 'race'
      ORDER BY monthly_km_race DESC
    `).all();

    const playerReal = { name: company.name, km: company.monthly_km_real || 0, type: 'player' };
    const playerRace = { name: company.name, km: company.monthly_km_race || 0, type: 'player' };

    const allReal = [...aiReal, playerReal].sort((a, b) => b.km - a.km).slice(0, 3);
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