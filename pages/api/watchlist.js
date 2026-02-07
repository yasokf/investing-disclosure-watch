const db = require('../../lib/db');

export default function handler(req, res) {
  if (req.method === 'GET') {
    const items = db.prepare('SELECT id, code, name FROM watchlist ORDER BY id DESC').all();
    res.status(200).json({ items });
    return;
  }

  if (req.method === 'POST') {
    const { code, name } = req.body || {};
    if (!code || !name) {
      res.status(400).json({ error: 'code and name are required' });
      return;
    }
    const result = db
      .prepare('INSERT INTO watchlist (code, name) VALUES (?, ?)')
      .run(code, name);
    res.status(201).json({ id: result.lastInsertRowid });
    return;
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) {
      res.status(400).json({ error: 'id is required' });
      return;
    }
    db.prepare('DELETE FROM watchlist WHERE id = ?').run(id);
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'method not allowed' });
}
