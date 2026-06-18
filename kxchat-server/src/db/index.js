const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { DB_PATH } = require('../config');

const dbFile = path.resolve(process.cwd(), DB_PATH);

const db = new sqlite3.Database(dbFile, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('SQLite open error', err);
    process.exit(1);
  }
});

const run = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });

const get = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });

const all = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });

const initDb = async () => {
  const ensureColumn = async (tableName, columnName, columnSql) => {
    const columns = await all(`PRAGMA table_info(${tableName})`);
    const exists = columns.some(col => col && col.name === columnName);
    if (!exists) {
      await run(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnSql}`);
    }
  };

  await run('PRAGMA journal_mode = WAL');
  await run('PRAGMA foreign_keys = ON');

  await run(`CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT UNIQUE NOT NULL,
    visitor_name TEXT,
    visitor_phone TEXT,
    status TEXT NOT NULL DEFAULT 'new',
    source_page TEXT,
    source_title TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`);
  await ensureColumn('conversations', 'page_context_json', 'TEXT');

  await run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
  )`);
};

module.exports = {
  db,
  run,
  get,
  all,
  initDb,
};
