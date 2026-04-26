const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'vtc.db');
let db = null;

// Wrapper to make sql.js API similar to better-sqlite3
class DatabaseWrapper {
  constructor(database) {
    this.database = database;
  }

  prepare(sql) {
    const self = this;
    return {
      run: (...params) => {
        self.database.run(sql, params);
        self.save();
        return { changes: self.database.getRowsModified() };
      },
      get: (...params) => {
        const stmt = self.database.prepare(sql);
        stmt.bind(params);
        if (stmt.step()) {
          const row = stmt.getAsObject();
          stmt.free();
          return row;
        }
        stmt.free();
        return undefined;
      },
      all: (...params) => {
        const results = [];
        const stmt = self.database.prepare(sql);
        stmt.bind(params);
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
      }
    };
  }

  exec(sql) {
    this.database.run(sql);
    this.save();
  }

  save() {
    const data = this.database.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  }
}

async function initDatabase() {
  const SQL = await initSqlJs();
  
  let database;
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    database = new SQL.Database(fileBuffer);
  } else {
    database = new SQL.Database();
  }
  
  db = new DatabaseWrapper(database);
  return db;
}

function getDb() {
  return db;
}

function initialize() {
  // Player company
  db.exec(`
    CREATE TABLE IF NOT EXISTS company (
      id INTEGER PRIMARY KEY DEFAULT 1,
      name TEXT DEFAULT 'Ma VTC',
      logo TEXT DEFAULT NULL,
      balance REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      drive_mode TEXT DEFAULT 'real' CHECK(drive_mode IN ('real', 'race')),
      total_km_real REAL DEFAULT 0,
      total_km_race REAL DEFAULT 0,
      monthly_km_real REAL DEFAULT 0,
      monthly_km_race REAL DEFAULT 0,
      driver_count INTEGER DEFAULT 0,
      truck_count INTEGER DEFAULT 0
    )
  `);

  // Drivers (player's AI drivers)
  db.exec(`
    CREATE TABLE IF NOT EXISTS drivers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatar TEXT DEFAULT NULL,
      skill_level INTEGER DEFAULT 1,
      training_driving INTEGER DEFAULT 0,
      training_eco INTEGER DEFAULT 0,
      training_endurance INTEGER DEFAULT 0,
      certification_adr INTEGER DEFAULT 0,
      hired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      total_km_real REAL DEFAULT 0,
      total_km_race REAL DEFAULT 0,
      monthly_km_real REAL DEFAULT 0,
      monthly_km_race REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1
    )
  `);

  // Trucks
  db.exec(`
    CREATE TABLE IF NOT EXISTS trucks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      model TEXT NOT NULL,
      price REAL NOT NULL,
      image TEXT DEFAULT NULL,
      fuel_efficiency REAL DEFAULT 1.0,
      max_speed INTEGER DEFAULT 90,
      comfort INTEGER DEFAULT 1,
      owned INTEGER DEFAULT 0,
      rented INTEGER DEFAULT 0,
      assigned_driver_id TEXT DEFAULT NULL,
      total_km REAL DEFAULT 0,
      FOREIGN KEY (assigned_driver_id) REFERENCES drivers(id)
    )
  `);

  // Truck upgrades
  db.exec(`
    CREATE TABLE IF NOT EXISTS truck_upgrades (
      id TEXT PRIMARY KEY,
      truck_id TEXT NOT NULL,
      upgrade_type TEXT NOT NULL,
      level INTEGER DEFAULT 1,
      FOREIGN KEY (truck_id) REFERENCES trucks(id)
    )
  `);

  // Garage
  db.exec(`
    CREATE TABLE IF NOT EXISTS garage (
      id INTEGER PRIMARY KEY DEFAULT 1,
      name TEXT DEFAULT 'Mon Garage',
      capacity INTEGER DEFAULT 2,
      rent_cost REAL DEFAULT 500,
      level INTEGER DEFAULT 1
    )
  `);

  // Garage decorations
  db.exec(`
    CREATE TABLE IF NOT EXISTS garage_decorations (
      id TEXT PRIMARY KEY,
      decoration_type TEXT NOT NULL,
      name TEXT NOT NULL,
      purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Deliveries (player's deliveries)
  db.exec(`
    CREATE TABLE IF NOT EXISTS deliveries (
      id TEXT PRIMARY KEY,
      driver_id TEXT DEFAULT NULL,
      truck_id TEXT DEFAULT NULL,
      origin TEXT NOT NULL,
      destination TEXT NOT NULL,
      cargo TEXT NOT NULL,
      cargo_type TEXT DEFAULT 'standard',
      distance_km REAL NOT NULL,
      km_real REAL DEFAULT 0,
      km_race REAL DEFAULT 0,
      revenue REAL NOT NULL,
      costs REAL DEFAULT 0,
      profit REAL DEFAULT 0,
      status TEXT DEFAULT 'completed',
      delivered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      on_time INTEGER DEFAULT 1,
      FOREIGN KEY (driver_id) REFERENCES drivers(id),
      FOREIGN KEY (truck_id) REFERENCES trucks(id)
    )
  `);

  // AI Companies (competitors)
  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_companies (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      logo TEXT DEFAULT NULL,
      balance REAL DEFAULT 10000,
      driver_count INTEGER DEFAULT 1,
      truck_count INTEGER DEFAULT 1,
      max_drivers INTEGER DEFAULT 5,
      drive_mode TEXT DEFAULT 'real' CHECK(drive_mode IN ('real', 'race')),
      skill_level INTEGER DEFAULT 1,
      personality TEXT DEFAULT 'stable' CHECK(personality IN ('passive', 'stable', 'aggressive')),
      total_km_real REAL DEFAULT 0,
      total_km_race REAL DEFAULT 0,
      monthly_km_real REAL DEFAULT 0,
      monthly_km_race REAL DEFAULT 0,
      last_hire_tick INTEGER DEFAULT 0,
      hire_cooldown INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Transaction history (expenses/income log)
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      amount REAL NOT NULL,
      driver_id TEXT DEFAULT NULL,
      truck_id TEXT DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Gallery photos
  db.exec(`
    CREATE TABLE IF NOT EXISTS gallery (
      id TEXT PRIMARY KEY,
      title TEXT DEFAULT '',
      image_path TEXT NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Shop items
  db.exec(`
    CREATE TABLE IF NOT EXISTS shop_items (
      id TEXT PRIMARY KEY,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      price REAL NOT NULL,
      effect_type TEXT DEFAULT NULL,
      effect_value REAL DEFAULT 0,
      image TEXT DEFAULT NULL
    )
  `);

  // Initialize player company if not exists
  const company = db.prepare('SELECT * FROM company WHERE id = 1').get();
  if (!company) {
    db.prepare('INSERT INTO company (id, balance) VALUES (1, 50000)').run();
  }

  // Initialize garage if not exists
  const garage = db.prepare('SELECT * FROM garage WHERE id = 1').get();
  if (!garage) {
    db.prepare('INSERT INTO garage (id) VALUES (1)').run();
  }

  // Initialize shop items
  initializeShopItems();

  // Initialize AI companies
  initializeAICompanies();

  // Initialize default trucks available for purchase
  initializeTrucks();

  console.log('✅ Database initialized');
}

function initializeShopItems() {
  const count = db.prepare('SELECT COUNT(*) as count FROM shop_items').get().count;
  if (count > 0) return;

  const items = [
    // Driver trainings
    { id: uuidv4(), category: 'training', name: 'Formation conduite base', description: '+5% km/jour', price: 500, effect_type: 'driving', effect_value: 5 },
    { id: uuidv4(), category: 'training', name: 'Formation conduite avancée', description: '+15% km/jour', price: 1500, effect_type: 'driving', effect_value: 15 },
    { id: uuidv4(), category: 'training', name: 'Formation éco-conduite', description: '-10% carburant', price: 800, effect_type: 'eco', effect_value: 10 },
    { id: uuidv4(), category: 'training', name: 'Certification ADR', description: 'Transport matières dangereuses +40% revenus', price: 2000, effect_type: 'adr', effect_value: 40 },
    { id: uuidv4(), category: 'training', name: 'Formation longue distance', description: '+endurance', price: 1200, effect_type: 'endurance', effect_value: 20 },
    
    // Truck upgrades
    { id: uuidv4(), category: 'truck_upgrade', name: 'Pneus premium', description: '-5% carburant', price: 800, effect_type: 'fuel', effect_value: 5 },
    { id: uuidv4(), category: 'truck_upgrade', name: 'Déflecteurs', description: '-8% carburant', price: 600, effect_type: 'fuel', effect_value: 8 },
    { id: uuidv4(), category: 'truck_upgrade', name: 'Lit confort', description: '+efficacité chauffeur', price: 400, effect_type: 'comfort', effect_value: 10 },
    { id: uuidv4(), category: 'truck_upgrade', name: 'Frigo cabine', description: 'Confort +5%', price: 300, effect_type: 'comfort', effect_value: 5 },
    { id: uuidv4(), category: 'truck_upgrade', name: 'Lightbox toit', description: 'Affiche ton logo', price: 700, effect_type: 'aesthetic', effect_value: 0 },
    { id: uuidv4(), category: 'truck_upgrade', name: 'Klaxon custom', description: 'Style!', price: 150, effect_type: 'aesthetic', effect_value: 0 },
    
    // Garage decorations
    { id: uuidv4(), category: 'garage_deco', name: 'Plantes', description: 'Esthétique', price: 50, effect_type: 'aesthetic', effect_value: 0 },
    { id: uuidv4(), category: 'garage_deco', name: 'Néons LED', description: 'Ambiance gaming', price: 200, effect_type: 'aesthetic', effect_value: 0 },
    { id: uuidv4(), category: 'garage_deco', name: 'Trophées', description: 'Affiche tes victoires', price: 500, effect_type: 'aesthetic', effect_value: 0 },
    { id: uuidv4(), category: 'garage_deco', name: 'Distributeur café', description: '+moral chauffeurs', price: 300, effect_type: 'morale', effect_value: 5 },
    { id: uuidv4(), category: 'garage_deco', name: 'TV écran géant', description: 'Flex!', price: 800, effect_type: 'aesthetic', effect_value: 0 },
    { id: uuidv4(), category: 'garage_deco', name: 'Sol époxy', description: 'Garage premium', price: 1500, effect_type: 'aesthetic', effect_value: 0 },
    { id: uuidv4(), category: 'garage_deco', name: 'Enseigne lumineuse', description: 'Avec ton logo', price: 1000, effect_type: 'aesthetic', effect_value: 0 },
    { id: uuidv4(), category: 'garage_deco', name: 'Canapé lounge', description: 'Espace détente', price: 600, effect_type: 'morale', effect_value: 3 },
    
    // Garage upgrades
    { id: uuidv4(), category: 'garage_upgrade', name: 'Agrandissement +2 slots', description: '+2 places camion', price: 5000, effect_type: 'capacity', effect_value: 2 },
    { id: uuidv4(), category: 'garage_upgrade', name: 'Atelier', description: '-20% coûts réparation', price: 8000, effect_type: 'repair', effect_value: 20 },
    { id: uuidv4(), category: 'garage_upgrade', name: 'Station carburant', description: '-15% coûts carburant', price: 12000, effect_type: 'fuel', effect_value: 15 },
  ];

  for (const item of items) {
    db.prepare(`
      INSERT INTO shop_items (id, category, name, description, price, effect_type, effect_value)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(item.id, item.category, item.name, item.description, item.price, item.effect_type, item.effect_value);
  }
}

function initializeAICompanies() {
  const count = db.prepare('SELECT COUNT(*) as count FROM ai_companies').get().count;
  if (count > 0) return;

  const companies = [
    // Real mode companies
    { id: uuidv4(), name: 'TransEuropa', drive_mode: 'real', skill_level: 2, balance: 50000, driver_count: 3, truck_count: 3 },
    { id: uuidv4(), name: 'Nordic Freight', drive_mode: 'real', skill_level: 3, balance: 80000, driver_count: 5, truck_count: 4 },
    { id: uuidv4(), name: 'Alpine Transport', drive_mode: 'real', skill_level: 1, balance: 15000, driver_count: 1, truck_count: 1 },
    { id: uuidv4(), name: 'Baltic Logistics', drive_mode: 'real', skill_level: 2, balance: 35000, driver_count: 2, truck_count: 2 },
    { id: uuidv4(), name: 'Mediterranean Cargo', drive_mode: 'real', skill_level: 1, balance: 20000, driver_count: 2, truck_count: 1 },
    
    // Race mode companies
    { id: uuidv4(), name: 'Speed Demons', drive_mode: 'race', skill_level: 3, balance: 60000, driver_count: 4, truck_count: 3 },
    { id: uuidv4(), name: 'Turbo Truckers', drive_mode: 'race', skill_level: 2, balance: 40000, driver_count: 3, truck_count: 2 },
    { id: uuidv4(), name: 'Highway Kings', drive_mode: 'race', skill_level: 2, balance: 45000, driver_count: 3, truck_count: 3 },
    { id: uuidv4(), name: 'Nitro Express', drive_mode: 'race', skill_level: 1, balance: 18000, driver_count: 1, truck_count: 1 },
    { id: uuidv4(), name: 'Thunder Road', drive_mode: 'race', skill_level: 3, balance: 75000, driver_count: 4, truck_count: 4 },
  ];

  for (const company of companies) {
    db.prepare(`
      INSERT INTO ai_companies (id, name, drive_mode, skill_level, balance, driver_count, truck_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(company.id, company.name, company.drive_mode, company.skill_level, company.balance, company.driver_count, company.truck_count);
  }
}

function initializeTrucks() {
  const count = db.prepare('SELECT COUNT(*) as count FROM trucks').get().count;
  if (count > 0) return;

  const trucks = [
    { id: uuidv4(), name: 'Volvo FH16', model: 'volvo_fh16', price: 95000, fuel_efficiency: 0.95, max_speed: 90, comfort: 3 },
    { id: uuidv4(), name: 'Scania R730', model: 'scania_r730', price: 120000, fuel_efficiency: 0.90, max_speed: 95, comfort: 4 },
    { id: uuidv4(), name: 'Mercedes Actros', model: 'mercedes_actros', price: 85000, fuel_efficiency: 1.0, max_speed: 90, comfort: 3 },
    { id: uuidv4(), name: 'MAN TGX', model: 'man_tgx', price: 75000, fuel_efficiency: 1.05, max_speed: 88, comfort: 2 },
    { id: uuidv4(), name: 'DAF XF', model: 'daf_xf', price: 70000, fuel_efficiency: 1.0, max_speed: 90, comfort: 2 },
    { id: uuidv4(), name: 'Renault T', model: 'renault_t', price: 65000, fuel_efficiency: 1.1, max_speed: 85, comfort: 2 },
    { id: uuidv4(), name: 'Iveco S-Way', model: 'iveco_sway', price: 60000, fuel_efficiency: 1.15, max_speed: 85, comfort: 1 },
    { id: uuidv4(), name: 'Volvo FH (Entrée)', model: 'volvo_fh_entry', price: 45000, fuel_efficiency: 1.2, max_speed: 85, comfort: 1 },
  ];

  for (const truck of trucks) {
    db.prepare(`
      INSERT INTO trucks (id, name, model, price, fuel_efficiency, max_speed, comfort)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(truck.id, truck.name, truck.model, truck.price, truck.fuel_efficiency, truck.max_speed, truck.comfort);
  }
}

function resetMonthlyKm() {
  db.prepare('UPDATE company SET monthly_km_real = 0, monthly_km_race = 0').run();
  db.prepare('UPDATE drivers SET monthly_km_real = 0, monthly_km_race = 0').run();
  db.prepare('UPDATE ai_companies SET monthly_km_real = 0, monthly_km_race = 0').run();
  
  // Redistribute AI modes (50/50 balanced)
  redistributeAIModes();
}

function redistributeAIModes() {
  const companies = db.prepare('SELECT id FROM ai_companies').all();
  if (companies.length === 0) return;
  
  // Shuffle the companies randomly
  const shuffled = companies.sort(() => Math.random() - 0.5);
  
  // Half real, half race (balanced)
  const halfPoint = Math.ceil(shuffled.length / 2);
  
  for (let i = 0; i < shuffled.length; i++) {
    const newMode = i < halfPoint ? 'real' : 'race';
    db.prepare('UPDATE ai_companies SET drive_mode = ? WHERE id = ?').run(newMode, shuffled[i].id);
  }
  
  console.log(`🔄 AI modes redistributed: ${halfPoint} real, ${shuffled.length - halfPoint} race`);
}

module.exports = {
  get db() { return db; },
  initDatabase,
  initialize,
  resetMonthlyKm,
  redistributeAIModes
};
