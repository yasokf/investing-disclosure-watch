const fs = require('fs');
const path = require('path');

const dataPath = path.join(process.cwd(), 'data.json');

const loadData = () => {
  try {
    const raw = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(raw);
  } catch (error) {
    return { watchlist: [] };
  }
};

const saveData = (data) => {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
};

const getWatchlist = () => {
  const data = loadData();
  return data.watchlist || [];
};

const addWatchlist = ({ code, name }) => {
  const data = loadData();
  const nextId = data.watchlist.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const entry = { id: nextId, code, name };
  data.watchlist = [entry, ...data.watchlist];
  saveData(data);
  return entry;
};

const removeWatchlist = (id) => {
  const data = loadData();
  data.watchlist = data.watchlist.filter((item) => item.id !== id);
  saveData(data);
};

module.exports = {
  getWatchlist,
  addWatchlist,
  removeWatchlist
};
