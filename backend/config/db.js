const path    = require('path');
const fs      = require('fs');
const initSql = require('sql.js');

const DB_PATH = path.join(__dirname, '..', 'spendlens.db');

let db;

const connectDB = async () => {
  const SQL = await initSql();

  // Load existing DB file if it exists, else create fresh
  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Save helper — writes db back to file after every change
  db.save = () => {
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  };

  // Create tables
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      name         TEXT    NOT NULL,
      email        TEXT    NOT NULL UNIQUE,
      passwordHash TEXT    NOT NULL,
      budget       REAL    NOT NULL DEFAULT 3000,
      createdAt    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      userId    INTEGER NOT NULL,
      desc      TEXT    NOT NULL,
      amount    REAL    NOT NULL,
      date      TEXT    NOT NULL,
      category  TEXT    NOT NULL DEFAULT 'Other',
      note      TEXT    NOT NULL DEFAULT '',
      createdAt TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(userId, date);
  `);

  db.save();
  console.log('✅  sql.js connected — spendlens.db ready');
  return db;
};

// Helper: run a query and return all rows as objects
const query = (sql, params = []) => {
  const stmt   = db.prepare(sql);
  stmt.bind(params);
  const rows   = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
};

// Helper: run INSERT/UPDATE/DELETE and save to file
const run = (sql, params = []) => {
  db.run(sql, params);
  db.save();
  return db;
};

// Helper: get last inserted row id
const lastId = () => {
  const res = query('SELECT last_insert_rowid() as id');
  return res[0]?.id;
};

module.exports = { connectDB, query, run, lastId };
