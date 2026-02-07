const { getWatchlist } = require('../../lib/db');

const getDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

const stripTags = (value) =>
  value
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

const parseDisclosures = (html) => {
  const items = [];
  const rowMatches = html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g);
  for (const match of rowMatches) {
    const cells = [...match[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((cell) =>
      stripTags(cell[1])
    );
    if (cells.length >= 4) {
      const [date, time, code, title] = cells;
      if (date && time && code && title) {
        items.push({ date, time, code, title });
      }
    }
  }
  return items;
};

export default async function handler(req, res) {
  const dateString = getDateString();
  const url = `https://www.release.tdnet.info/inbs/I_list_001_${dateString}.html`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      res.status(502).json({ error: 'failed to fetch tdnet list' });
      return;
    }
    const html = await response.text();
    let items = parseDisclosures(html);

    if (req.query.watchlist === '1') {
      const watchlist = getWatchlist();
      const codes = new Set(watchlist.map((item) => item.code));
      items = items.filter((item) => codes.has(item.code));
    }

    res.status(200).json({ items });
  } catch (error) {
    res.status(500).json({ error: 'unexpected error' });
  }
}
