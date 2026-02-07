const fs = require('fs/promises');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');

const INPUT_DIR = path.join(process.cwd(), 'input');
const execFileAsync = promisify(execFile);

const sanitizeSegment = (segment) => segment.replace(/[^a-zA-Z0-9._-]/g, '_');
const sanitizeFileName = (name) => path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');
const sanitizeRelativePath = (relativePath) => {
  const segments = relativePath.split(/[\\/]/).filter(Boolean).map(sanitizeSegment);
  return segments.join(path.sep);
};
const isWithin = (target, root) => {
  const relative = path.relative(root, target);
  return relative && !relative.startsWith('..') && !path.isAbsolute(relative);
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '50mb'
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const { filename, data, files, runAnalyze } = req.body || {};

  const payloadFiles = Array.isArray(files) ? files : filename && data ? [{ filename, data }] : [];
  if (payloadFiles.length === 0) {
    res.status(400).json({ error: 'filename/data or files are required' });
    return;
  }

  try {
    await fs.mkdir(INPUT_DIR, { recursive: true });
    const saved = [];

    for (const item of payloadFiles) {
      if (!item || typeof item.filename !== 'string' || typeof item.data !== 'string') {
        continue;
      }
      if (!item.filename.toLowerCase().endsWith('.pdf')) {
        continue;
      }
      const relativePath = item.relativePath ? sanitizeRelativePath(item.relativePath) : '';
      const safeName = sanitizeFileName(item.filename);
      const targetDir = relativePath ? path.join(INPUT_DIR, relativePath) : INPUT_DIR;
      const targetPath = path.join(targetDir, safeName);
      if (!isWithin(targetPath, INPUT_DIR)) {
        continue;
      }
      await fs.mkdir(path.dirname(targetPath), { recursive: true });
      const buffer = Buffer.from(item.data, 'base64');
      await fs.writeFile(targetPath, buffer);
      saved.push(path.relative(INPUT_DIR, targetPath));
    }

    let analysis = null;
    if (runAnalyze) {
      try {
        const result = await execFileAsync('python', ['-m', 'ta', 'batch'], {
          cwd: process.cwd(),
          timeout: 5 * 60 * 1000
        });
        analysis = { ok: true, stdout: result.stdout, stderr: result.stderr };
      } catch (error) {
        analysis = {
          ok: false,
          stdout: error.stdout || '',
          stderr: error.stderr || '',
          message: error.message
        };
      }
    }

    res.status(200).json({ saved, analysis });
  } catch (error) {
    res.status(500).json({ error: 'failed to save file', detail: error.message });
  }
}
