const fs = require('fs/promises');
const path = require('path');

const MAX_FILES = 500;
const ALLOWED_ROOTS = ['G:\\マイドライブ\\python\\tanshin_auto\\pdf'];

const isWithinAllowedRoots = (targetPath) => {
  const resolvedTarget = path.resolve(targetPath);
  return ALLOWED_ROOTS.some((root) => {
    const resolvedRoot = path.resolve(root);
    const relative = path.relative(resolvedRoot, resolvedTarget);
    return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
  });
};

const formatEntry = (entryPath, stats) => ({
  path: entryPath,
  name: path.basename(entryPath),
  size: stats.size,
  mtime: stats.mtime
});

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
        const stats = await fs.stat(fullPath);
        results.push(formatEntry(fullPath, stats));
      }
    }
  }

  return results;
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

  if (!isWithinAllowedRoots(targetPath)) {
    res.status(400).json({ error: 'path is outside of allowed roots' });
    return;
  }

  try {
    await fs.access(targetPath);
    const files = await collectPdfFiles(targetPath);
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    res.status(200).json({
      path: targetPath,
      totalCount: files.length,
      totalSize,
      maxFiles: MAX_FILES,
      items: files
    });
  } catch (error) {
    res.status(500).json({
      error: 'failed to read path',
      detail: error.message
    });
  }
}
