const { getWatchlist } = require('../../lib/db');
const crypto = require('crypto');

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

const normalizePdfUrl = (value) => {
  const match = value.match(/href="([^"]+)"/i);
  if (!match) {
    return '';
  }
  try {
    return new URL(match[1], 'https://www.release.tdnet.info').toString();
  } catch (error) {
    return match[1];
  }
};

const normalizeCode = (value) => String(value ?? '').trim();

const buildDisclosureId = ({ date, time, code, title }) => {
  const hash = crypto
    .createHash('sha1')
    .update(`${date}|${time}|${code}|${title}`)
    .digest('hex')
    .slice(0, 12);
  return `${date}-${time}-${code}-${hash}`;
};

const parseDisclosures = (html) => {
  const items = [];
  const rowMatches = html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/g);
  for (const match of rowMatches) {
    const cells = [...match[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((cell) => cell[1]);
    if (cells.length >= 5) {
      const [dateCell, timeCell, codeCell, companyCell, titleCell] = cells;
      const date = stripTags(dateCell);
      const time = stripTags(timeCell);
      const code = stripTags(codeCell);
      const company = stripTags(companyCell);
      const title = stripTags(titleCell);
      const url = normalizePdfUrl(titleCell);
      if (date && time && code && title) {
        items.push({
          id: buildDisclosureId({ date, time, code, title }),
          date,
          time,
          code,
          company,
          title,
          url,
          published_at: `${date} ${time}`,
        });
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

    let codesWatchlist = [];
    const codesDisclosuresSample = items.slice(0, 20).map((item) => normalizeCode(item.code));

    if (req.query.watchlist === '1') {
      const watchlist = getWatchlist();
      codesWatchlist = watchlist.map((item) => normalizeCode(item.code));
      const codes = new Set(codesWatchlist);
      items = items.filter((item) => codes.has(normalizeCode(item.code)));
    }

    const responseBody = { items };
    if (req.query.debug === '1') {
      responseBody.meta = {
        codesWatchlist,
        codesDisclosuresSample,
        filteredCount: items.length,
      };
    }

    res.status(200).json(responseBody);
  } catch (error) {
    res.status(500).json({ error: 'unexpected error' });
  }
}
