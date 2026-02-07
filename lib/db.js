const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(process.cwd(), 'data.sqlite3');
const db = new Database(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    name TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS disclosures (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL,
    title TEXT NOT NULL,
    published_at TEXT NOT NULL
  );
`);

const disclosureCount = db.prepare('SELECT COUNT(*) as count FROM disclosures').get();
if (disclosureCount.count === 0) {
  const insert = db.prepare(
    'INSERT INTO disclosures (code, title, published_at) VALUES (?, ?, ?)'
  );
  insert.run('7203', '業績予想の修正に関するお知らせ', '2024-05-01');
  insert.run('9432', '自己株式取得に係る事項の決定について', '2024-05-02');
  insert.run('6758', '通期決算短信の開示', '2024-05-03');
}

module.exports = db;
