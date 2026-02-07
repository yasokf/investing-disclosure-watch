const db = require('../../lib/db');

export default function handler(req, res) {
  const rows = db
    .prepare('SELECT id, code, title, published_at FROM disclosures ORDER BY published_at DESC')
    .all();
  res.status(200).json({ items: rows });
}
