const { addWatchlist, getWatchlist, removeWatchlist } = require('../../lib/db');

export default function handler(req, res) {
  if (req.method === 'GET') {
    const items = getWatchlist();
    res.status(200).json({ items });
    return;
  }

  if (req.method === 'POST') {
    const { code, name } = req.body || {};
    if (!code || !name) {
      res.status(400).json({ error: 'code and name are required' });
      return;
    }
    const entry = addWatchlist({ code, name });
    res.status(201).json({ id: entry.id });
    return;
  }

  if (req.method === 'DELETE') {
    const { id } = req.body || {};
    if (!id) {
      res.status(400).json({ error: 'id is required' });
      return;
    }
    removeWatchlist(Number(id));
    res.status(200).json({ ok: true });
    return;
  }

  res.status(405).json({ error: 'method not allowed' });
}
