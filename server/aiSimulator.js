const { db, resetMonthlyKm } = require('./database');
const { v4: uuidv4 } = require('uuid');

// Log a transaction for the player
function logTransaction(type, category, description, amount, driverId = null, truckId = null) {
  const id = uuidv4();
  db.prepare(`
    INSERT INTO transactions (id, type, category, description, amount, driver_id, truck_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, type, category, description, amount, driverId, truckId);
}

// Get free hiring status from admin routes
let isFreeHiringEnabled = () => false;
try {
  const adminRoutes = require('./routes/admin');
  if (adminRoutes.isFreeHiringEnabled) {
    isFreeHiringEnabled = adminRoutes.isFreeHiringEnabled;
  }
} catch (e) {
  // Admin routes not loaded yet, will use default
}

// Global tick counter for timing events
let globalTick = 0;

// Track current month for auto-reset
let currentMonth = new Date().getMonth();

// Configuration
const CONFIG = {
  // Heures d'activité (les chauffeurs ne roulent pas 24/7)
  ACTIVE_HOURS_START: 6,  // 6h du matin
  ACTIVE_HOURS_END: 22,   // 22h le soir
  // Probabilité de pause même pendant les heures actives (fatigue, repas, etc.)
  BREAK_PROBABILITY: 0.15, // 15% de chance de pause par tick
  // Distance minimum par livraison (pour les stats)
  MIN_DELIVERY_KM: 250,
  MAX_DELIVERY_KM: 2500,
  // Délai de recrutement après démission (en ticks = minutes)
  HIRE_COOLDOWN: 1440, // 24h réelles
  // Probabilité d'incident par jour (1440 ticks)
  INCIDENT_PROBABILITY: 0.0007, // ~1 incident par jour par chauffeur
  // Personnalités IA
  PERSONALITY: {
    passive: { hireChance: 0.05, fireChance: 0.05, maxDrivers: 3, breakBonus: 0.1 },
    stable: { hireChance: 0.15, fireChance: 0.1, maxDrivers: 6, breakBonus: 0 },
    aggressive: { hireChance: 0.4, fireChance: 0.25, maxDrivers: 10, breakBonus: -0.05 }
  }
};

// Check if current hour is within active driving hours
function isActiveHour() {
  const hour = new Date().getHours();
  return hour >= CONFIG.ACTIVE_HOURS_START && hour < CONFIG.ACTIVE_HOURS_END;
}

// Check for monthly reset (new month = reset km + redistribute modes)
function checkMonthlyReset() {
  const now = new Date();
  const newMonth = now.getMonth();
  
  if (newMonth !== currentMonth) {
    console.log(`🗓️ New month detected! Resetting monthly stats and redistributing AI modes...`);
    resetMonthlyKm();
    currentMonth = newMonth;
    return true;
  }
  return false;
}

// Simulate AI companies and player's AI drivers every minute
function simulateAll() {
  const now = new Date();
  
  // Check for monthly reset
  checkMonthlyReset();
  
  // Check if it's active hours (6h-22h)
  if (!isActiveHour()) {
    console.log(`[${now.toLocaleTimeString()}] Night time - drivers resting`);
    return; // Pas de simulation la nuit
  }
  
  // Simulate AI companies
  simulateAICompanies();
  
  // Simulate player's AI drivers
  simulatePlayerDrivers();
  
  console.log(`[${now.toLocaleTimeString()}] AI simulation tick completed`);
}

function simulateAICompanies() {
  globalTick++;
  const companies = db.prepare('SELECT * FROM ai_companies').all();
  
  for (const company of companies) {
    // Get personality config (default to stable if not set)
    const personality = CONFIG.PERSONALITY[company.personality] || CONFIG.PERSONALITY.stable;
    
    // Check if company is on break (adjusted by personality)
    const breakChance = CONFIG.BREAK_PROBABILITY + personality.breakBonus;
    if (Math.random() < breakChance) {
      continue; // This company is on break this tick
    }
    
    // Check for incidents (affects all drivers)
    if (Math.random() < CONFIG.INCIDENT_PROBABILITY * company.driver_count) {
      handleIncident(company);
      continue; // Skip this tick due to incident
    }
    
    // Base km per minute per driver (scaled by skill)
    const baseKmPerMin = company.drive_mode === 'real' ? 1.2 : 2.2;
    const skillMultiplier = 1 + (company.skill_level - 1) * 0.15;
    
    // Random factor for variability
    const randomFactor = 0.8 + Math.random() * 0.6;
    
    // Total km this tick
    const kmThisTick = baseKmPerMin * skillMultiplier * randomFactor * company.driver_count * 1.5;
    
    // Revenue calculation
    const revenuePerKm = company.drive_mode === 'real' ? 1.20 : 0.80;
    const costPerKm = 0.35; // fuel + wear
    const profit = kmThisTick * (revenuePerKm - costPerKm);
    
    // Update company stats
    if (company.drive_mode === 'real') {
      db.prepare(`
        UPDATE ai_companies 
        SET total_km_real = total_km_real + ?,
            monthly_km_real = monthly_km_real + ?,
            balance = balance + ?
        WHERE id = ?
      `).run(kmThisTick, kmThisTick, profit, company.id);
    } else {
      db.prepare(`
        UPDATE ai_companies 
        SET total_km_race = total_km_race + ?,
            monthly_km_race = monthly_km_race + ?,
            balance = balance + ?
        WHERE id = ?
      `).run(kmThisTick, kmThisTick, profit, company.id);
    }
    
    // AI company decisions (every ~10 minutes on average)
    if (Math.random() < 0.1) {
      makeAIDecision(company, personality);
    }
  }
}

// Handle random incidents for AI companies
function handleIncident(company) {
  const incidents = [
    { type: 'breakdown', cost: 2000, message: 'panne de camion' },
    { type: 'accident', cost: 5000, message: 'accident mineur' },
    { type: 'fine', cost: 500, message: 'amende' },
    { type: 'fuel_spike', cost: 1000, message: 'hausse carburant' }
  ];
  
  const incident = incidents[Math.floor(Math.random() * incidents.length)];
  
  db.prepare('UPDATE ai_companies SET balance = balance - ? WHERE id = ?')
    .run(incident.cost, company.id);
  
  console.log(`[INCIDENT] ${company.name}: ${incident.message} (-${incident.cost}€)`);
}

function makeAIDecision(company, personality) {
  // Get max drivers based on personality (or use max_drivers from DB)
  const maxDrivers = company.max_drivers || personality.maxDrivers;
  
  // Check hire cooldown
  const canHire = !company.hire_cooldown || company.hire_cooldown <= globalTick;
  
  // Hire new driver if profitable and under max (or free hiring enabled)
  const canAfford = isFreeHiringEnabled() || company.balance > 5000;
  if (canHire && canAfford && company.driver_count < maxDrivers && Math.random() < personality.hireChance) {
    db.prepare(`
      UPDATE ai_companies 
      SET driver_count = driver_count + 1,
          balance = balance - 500,
          last_hire_tick = ?
      WHERE id = ?
    `).run(globalTick, company.id);
    console.log(`[AI] ${company.name} hired a new driver (${company.driver_count + 1}/${maxDrivers})`);
  }
  
  // Fire/Resignation DISABLED - AI companies don't fire drivers anymore
  // const shouldFire = (company.balance < 1000 && company.driver_count > 1) || 
  //                    (Math.random() < personality.fireChance * 0.01);
  // if (shouldFire && company.driver_count > 1) { ... }
  
  // Buy truck if can afford
  if (company.balance > 50000 && company.truck_count < company.driver_count && Math.random() < 0.2) {
    db.prepare(`
      UPDATE ai_companies 
      SET truck_count = truck_count + 1,
          balance = balance - 45000
      WHERE id = ?
    `).run(company.id);
    console.log(`[AI] ${company.name} bought a new truck`);
  }
  
  // Upgrade skill (training)
  if (company.balance > 10000 && company.skill_level < 5 && Math.random() < 0.1) {
    db.prepare(`
      UPDATE ai_companies 
      SET skill_level = skill_level + 1,
          balance = balance - 5000
      WHERE id = ?
    `).run(company.id);
    console.log(`[AI] ${company.name} upgraded their skill level`);
  }
}

function simulatePlayerDrivers() {
  const company = db.prepare('SELECT * FROM company WHERE id = 1').get();
  if (!company) return;
  
  const drivers = db.prepare('SELECT * FROM drivers WHERE is_active = 1').all();
  
  for (const driver of drivers) {
    // Check if driver is on break (15% chance per tick)
    if (Math.random() < CONFIG.BREAK_PROBABILITY) {
      continue; // Driver is on break this tick
    }
    
    // Check if driver has an assigned truck
    const truck = db.prepare('SELECT * FROM trucks WHERE assigned_driver_id = ? AND owned = 1').get(driver.id);
    if (!truck) continue; // No truck, can't drive
    
    // Base km per minute (increased for longer deliveries)
    const baseKmPerMin = company.drive_mode === 'real' ? 1.2 : 2.2;
    
    // Skill multiplier from training
    const drivingBonus = 1 + (driver.training_driving * 0.01);
    const enduranceBonus = 1 + (driver.training_endurance * 0.005);
    
    // Truck bonus
    const truckSpeedBonus = truck.max_speed / 90;
    
    // Random factor
    const randomFactor = 0.7 + Math.random() * 0.6;
    
    // Total km this tick
    const kmThisTick = baseKmPerMin * drivingBonus * enduranceBonus * truckSpeedBonus * randomFactor;
    
    // Revenue calculation
    const revenuePerKm = company.drive_mode === 'real' ? 1.20 : 0.80;
    const fuelCostPerKm = 0.30 * truck.fuel_efficiency * (1 - driver.training_eco * 0.01);
    const wearCostPerKm = 0.05;
    const profit = kmThisTick * (revenuePerKm - fuelCostPerKm - wearCostPerKm);
    
    // Salary cost per minute (monthly salary / 43200 minutes per month)
    const salaryPerMin = 1500 / 43200;
    const netProfit = profit - salaryPerMin;
    
    // Update driver stats AND company km
    if (company.drive_mode === 'real') {
      db.prepare(`
        UPDATE drivers 
        SET total_km_real = total_km_real + ?,
            monthly_km_real = monthly_km_real + ?
        WHERE id = ?
      `).run(kmThisTick, kmThisTick, driver.id);
      
      // Also update company km for rankings
      db.prepare(`
        UPDATE company 
        SET total_km_real = total_km_real + ?,
            monthly_km_real = monthly_km_real + ?
        WHERE id = 1
      `).run(kmThisTick, kmThisTick);
    } else {
      db.prepare(`
        UPDATE drivers 
        SET total_km_race = total_km_race + ?,
            monthly_km_race = monthly_km_race + ?
        WHERE id = ?
      `).run(kmThisTick, kmThisTick, driver.id);
      
      // Also update company km for rankings
      db.prepare(`
        UPDATE company 
        SET total_km_race = total_km_race + ?,
            monthly_km_race = monthly_km_race + ?
        WHERE id = 1
      `).run(kmThisTick, kmThisTick);
    }
    
    // Update truck km
    db.prepare('UPDATE trucks SET total_km = total_km + ? WHERE id = ?').run(kmThisTick, truck.id);
    
    // Calculate costs
    const fuelCost = kmThisTick * fuelCostPerKm;
    const wearCost = kmThisTick * wearCostPerKm;
    const revenue = kmThisTick * revenuePerKm;
    
    // Update company balance
    db.prepare('UPDATE company SET balance = balance + ? WHERE id = 1').run(netProfit);
    
    // Log transactions every ~60 ticks (1 hour) to avoid spam
    if (globalTick % 60 === 0) {
      const hourlyRevenue = revenue * 60;
      const hourlyFuel = fuelCost * 60;
      const hourlySalary = salaryPerMin * 60;
      
      if (hourlyRevenue > 0) {
        logTransaction('income', 'delivery', `Revenus de ${driver.name}`, hourlyRevenue, driver.id, truck.id);
      }
      if (hourlyFuel > 0) {
        logTransaction('expense', 'fuel', `Carburant - ${driver.name}`, hourlyFuel, driver.id, truck.id);
      }
      if (hourlySalary > 0) {
        logTransaction('expense', 'salary', `Salaire - ${driver.name}`, hourlySalary, driver.id, null);
      }
    }
  }
  
  // Player incidents (random, ~0.5% chance per tick with drivers)
  const activeDrivers = db.prepare('SELECT * FROM drivers WHERE is_active = 1').all();
  if (activeDrivers.length > 0 && Math.random() < 0.005) {
    handlePlayerIncident(activeDrivers);
  }
}

// Handle random incidents for player
function handlePlayerIncident(drivers) {
  const incidents = [
    { type: 'breakdown', cost: 1500, message: 'Panne mécanique' },
    { type: 'accident', cost: 3000, message: 'Accident mineur' },
    { type: 'fine', cost: 500, message: 'Amende routière' },
    { type: 'fuel_spike', cost: 800, message: 'Hausse du carburant' }
  ];
  
  const incident = incidents[Math.floor(Math.random() * incidents.length)];
  const driver = drivers[Math.floor(Math.random() * drivers.length)];
  
  db.prepare('UPDATE company SET balance = balance - ? WHERE id = 1').run(incident.cost);
  logTransaction('expense', 'incident', `${incident.message} - ${driver.name}`, incident.cost, driver.id, null);
  
  console.log(`[INCIDENT JOUEUR] ${driver.name}: ${incident.message} (-${incident.cost}€)`);
}

// Force simulation (ignores time restrictions - for admin/testing)
function forceSimulateAll() {
  simulateAICompanies();
  simulatePlayerDrivers();
}

module.exports = {
  simulateAll,
  forceSimulateAll,
  simulateAICompanies,
  simulatePlayerDrivers
};
