const fs = require('fs/promises');
const path = require('path');
const pdfParse = require('pdf-parse');

const BASE_DIR = 'G:\\マイドライブ\\python\\tanshin_auto\\pdf';
const MAX_FILES = 200;
const CACHE_PATH = path.join(process.cwd(), '.cache', 'tanshin_extract.json');

const isWithinBaseDir = (targetPath) => {
  const resolvedTarget = path.resolve(targetPath);
  const resolvedRoot = path.resolve(BASE_DIR);
  const relative = path.relative(resolvedRoot, resolvedTarget);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
};

const toHalfWidth = (value) =>
  value.replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0));

const normalizeLine = (line) => {
  const trimmed = line.replace(/\s+/g, ' ').trim();
  const halfWidth = toHalfWidth(trimmed);
  return {
    raw: trimmed,
    normalized: halfWidth,
    normalizedNoComma: halfWidth.replace(/,/g, '')
  };
};

const parseNumbers = (line) => {
  const matches = line.match(/-?\d[\d,]*/g);
  if (!matches) {
    return [];
  }
  return matches
    .map((entry) => Number(entry.replace(/,/g, '')))
    .filter((value) => Number.isFinite(value));
};

const detectUnit = (lines) => {
  const unitLine = lines.find((line) => line.normalized.includes('単位'));
  if (!unitLine) {
    return 'unknown';
  }
  if (unitLine.normalized.includes('百万円')) {
    return '百万円';
  }
  if (unitLine.normalized.includes('千円')) {
    return '千円';
  }
  if (unitLine.normalized.includes('億円')) {
    return '億円';
  }
  return 'unknown';
};

const findSectionIndices = (lines, keywords) => {
  const indices = [];
  lines.forEach((line, index) => {
    if (keywords.some((keyword) => line.normalized.includes(keyword))) {
      indices.push(index);
    }
  });
  return indices;
};

const sliceAround = (lines, indices, radius = 20) => {
  if (indices.length === 0) {
    return lines;
  }
  const slices = [];
  indices.forEach((index) => {
    const start = Math.max(index - radius, 0);
    const end = Math.min(index + radius + 1, lines.length);
    slices.push(...lines.slice(start, end));
  });
  return slices;
};

const findMetricLine = (lines, keyword) =>
  lines.find((line) => line.normalized.includes(keyword) && parseNumbers(line.normalized).length >= 2);

const findForecastLine = (lines, keyword) =>
  lines.find((line) => line.normalized.includes(keyword) && parseNumbers(line.normalized).length >= 1);

const formatEvidence = (line) => {
  if (!line) {
    return [];
  }
  return [line.raw].filter(Boolean).slice(0, 2);
};

const computeYoY = (currentValue, previousValue) => {
  if (!Number.isFinite(currentValue) || !Number.isFinite(previousValue) || previousValue === 0) {
    return null;
  }
  return ((currentValue - previousValue) / previousValue) * 100;
};

const computeProgress = (currentValue, forecastValue) => {
  if (!Number.isFinite(currentValue) || !Number.isFinite(forecastValue) || forecastValue === 0) {
    return null;
  }
  return (currentValue / forecastValue) * 100;
};

const extractMetricsFromText = (text) => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => normalizeLine(line))
    .filter((line) => line.normalized.length > 0);

  if (lines.length === 0 || text.trim().length < 30) {
    return { status: 'unreadable', metrics: null, confidence: 0 };
  }

  const unit = detectUnit(lines);
  const performanceSection = findSectionIndices(lines, ['連結経営成績', '経営成績']);
  const forecastSection = findSectionIndices(lines, ['業績予想', '通期予想']);
  const performanceLines = sliceAround(lines, performanceSection, 25);
  const forecastLines = sliceAround(lines, forecastSection, 25);

  const salesLine = findMetricLine(performanceLines, '売上高') || findMetricLine(lines, '売上高');
  const opLine =
    findMetricLine(performanceLines, '営業利益') || findMetricLine(lines, '営業利益');

  const salesNumbers = salesLine ? parseNumbers(salesLine.normalized) : [];
  const opNumbers = opLine ? parseNumbers(opLine.normalized) : [];

  const salesCurrent = salesNumbers[0] ?? null;
  const salesPrevious = salesNumbers[1] ?? null;
  const opCurrent = opNumbers[0] ?? null;
  const opPrevious = opNumbers[1] ?? null;

  const forecastSalesLine =
    findForecastLine(forecastLines, '売上高') || findForecastLine(lines, '売上高');
  const forecastOpLine =
    findForecastLine(forecastLines, '営業利益') || findForecastLine(lines, '営業利益');

  const forecastSales = forecastSalesLine
    ? parseNumbers(forecastSalesLine.normalized)[0] ?? null
    : null;
  const forecastOp = forecastOpLine ? parseNumbers(forecastOpLine.normalized)[0] ?? null : null;

  const backlogCandidates = lines.filter((line) =>
    ['受注残高合計', '受注残高', '受注残'].some((keyword) => line.normalized.includes(keyword))
  );
  const backlogLine =
    backlogCandidates.find((line) => line.normalized.includes('受注残高')) ||
    backlogCandidates[0];
  const backlogNumbers = backlogLine ? parseNumbers(backlogLine.normalized) : [];
  const backlogValue = backlogNumbers[0] ?? null;
  const backlogPrevious = backlogNumbers[1] ?? null;

  const ordersCandidates = lines.filter((line) =>
    ['受注高', '受注高合計'].some((keyword) => line.normalized.includes(keyword))
  );
  const ordersLine = ordersCandidates[0];
  const ordersNumbers = ordersLine ? parseNumbers(ordersLine.normalized) : [];
  const ordersValue = ordersNumbers[0] ?? null;
  const ordersPrevious = ordersNumbers[1] ?? null;

  const evidence = {
    sales: formatEvidence(salesLine),
    operatingProfit: formatEvidence(opLine),
    forecastSales: formatEvidence(forecastSalesLine),
    forecastOperatingProfit: formatEvidence(forecastOpLine),
    backlog: formatEvidence(backlogLine),
    orders: formatEvidence(ordersLine)
  };

  let confidence = 0;
  if (Number.isFinite(salesCurrent) && Number.isFinite(salesPrevious)) {
    confidence += 0.6;
  }
  if (Number.isFinite(opCurrent) && Number.isFinite(opPrevious)) {
    confidence += 0.6;
  }
  if (Number.isFinite(forecastSales) || Number.isFinite(forecastOp)) {
    confidence += 0.1;
  }
  if (Number.isFinite(backlogValue)) {
    confidence += 0.1;
  }
  confidence = Math.min(confidence, 1);

  const evidenceCount = Object.values(evidence).flat().length;
  if (evidenceCount === 0) {
    confidence = Math.min(confidence, 0.2);
  }

  return {
    status: 'ok',
    unit,
    metrics: {
      sales: {
        value: salesCurrent,
        previous: salesPrevious,
        yoyPct: computeYoY(salesCurrent, salesPrevious)
      },
      op: {
        value: opCurrent,
        previous: opPrevious,
        yoyPct: computeYoY(opCurrent, opPrevious)
      },
      orders: {
        value: ordersValue,
        previous: ordersPrevious,
        yoyPct: computeYoY(ordersValue, ordersPrevious)
      },
      backlog: {
        value: backlogValue,
        previous: backlogPrevious,
        yoyPct: computeYoY(backlogValue, backlogPrevious)
      },
      forecast: {
        sales: forecastSales,
        operatingProfit: forecastOp
      },
      progress: {
        salesPct: computeProgress(salesCurrent, forecastSales),
        opPct: computeProgress(opCurrent, forecastOp)
      }
    },
    evidence,
    confidence: Number(confidence.toFixed(2))
  };
};

const readCache = async () => {
  try {
    const content = await fs.readFile(CACHE_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return {};
  }
};

const writeCache = async (cache) => {
  await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true });
  await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2));
};

const collectPdfFiles = async (rootPath) => {
  const results = [];
  const queue = [rootPath];

  while (queue.length > 0 && results.length < MAX_FILES) {
    const currentDir = queue.shift();
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      if (results.length >= MAX_FILES) {
        break;
      }

      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name.toLowerCase().endsWith('.pdf')) {
        results.push(fullPath);
      }
    }
  }

  return results;
};

const extractFromFile = async (filePath, cache) => {
  const stats = await fs.stat(filePath);
  const cached = cache[filePath];
  if (cached && cached.mtimeMs === stats.mtimeMs) {
    return { ...cached.result, cached: true };
  }

  try {
    const buffer = await fs.readFile(filePath);
    const data = await pdfParse(buffer);
    const parsed = extractMetricsFromText(data.text || '');
    const result = {
      filePath,
      fileName: path.basename(filePath),
      name: path.basename(filePath),
      path: filePath,
      mtime: stats.mtime,
      size: stats.size,
      ...parsed
    };
    cache[filePath] = { mtimeMs: stats.mtimeMs, result };
    return { ...result, cached: false };
  } catch (error) {
    const result = {
      filePath,
      fileName: path.basename(filePath),
      name: path.basename(filePath),
      path: filePath,
      mtime: stats.mtime,
      size: stats.size,
      status: 'unreadable',
      metrics: null,
      evidence: {},
      confidence: 0,
      error: error.message
    };
    cache[filePath] = { mtimeMs: stats.mtimeMs, result };
    return { ...result, cached: false };
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const { path: targetPath } = req.body || {};

  if (!targetPath || typeof targetPath !== 'string') {
    res.status(400).json({ error: 'path is required' });
    return;
  }

  if (!isWithinBaseDir(targetPath)) {
    res.status(400).json({ error: 'path is outside of base dir' });
    return;
  }

  try {
    await fs.access(targetPath);

    const stat = await fs.stat(targetPath);
    if (!stat.isDirectory()) {
      res.status(400).json({ error: 'path is not a directory' });
      return;
    }

    const files = await collectPdfFiles(targetPath);
    const cache = await readCache();

    const results = [];
    for (const filePath of files) {
      const result = await extractFromFile(filePath, cache);
      results.push(result);
    }

    await writeCache(cache);

    res.status(200).json({
      baseDir: BASE_DIR,
      totalCount: results.length,
      maxFiles: MAX_FILES,
      items: results
    });
  } catch (error) {
    res.status(500).json({ error: 'failed to extract', detail: error.message });
  }
}
