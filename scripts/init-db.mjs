import Database from "bun:sqlite"
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

const dbPath = process.env.SQLITE_DB_PATH || "./data/clients.db";
mkdirSync(dirname(dbPath), { recursive: true });

const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS clients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT,
    address TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL
  );
`);

console.log("Base SQLite initialisée : " + dbPath);
db.close();