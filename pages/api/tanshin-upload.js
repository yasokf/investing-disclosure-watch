const fs = require('fs/promises');
const path = require('path');

const INPUT_DIR = path.join(process.cwd(), 'input');

const sanitizeFileName = (name) => path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');

const sanitizePathSegment = (segment) => segment.replace(/[^a-zA-Z0-9._-]/g, '_');

const sanitizeRelativePath = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }
  const normalized = value.replace(/\\/g, '/');
  const segments = normalized.split('/').filter(Boolean);
  const safeSegments = segments
    .filter((segment) => segment !== '.' && segment !== '..')
    .map((segment) => sanitizePathSegment(segment));

  if (safeSegments.length === 0) {
    return null;
  }

  return path.join(...safeSegments);
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb'
    }
  }
};

const extractBase64 = (value) => {
  if (!value || typeof value !== 'string') return null;
  if (value.startsWith('data:')) {
    return value.split(',')[1] || null;
  }
  return value;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const { filename, data, dataUrl, relativePath } = req.body || {};
  const base64 = extractBase64(data || dataUrl);
  const preferredPath = sanitizeRelativePath(relativePath) || filename;

  if (!preferredPath || typeof preferredPath !== 'string' || !base64) {
    res.status(400).json({ error: 'filename and data are required' });
    return;
  }

  if (!preferredPath.toLowerCase().endsWith('.pdf')) {
    res.status(400).json({ error: 'only pdf files are supported' });
    return;
  }

  try {
    const safeRelativePath = sanitizeRelativePath(preferredPath) || sanitizeFileName(filename);
    const buffer = Buffer.from(base64, 'base64');
    await fs.mkdir(INPUT_DIR, { recursive: true });
    const targetPath = path.join(INPUT_DIR, safeRelativePath);
    await fs.mkdir(path.dirname(targetPath), { recursive: true });
    await fs.writeFile(targetPath, buffer);
    res.status(200).json({ saved: true, filename: path.basename(safeRelativePath), path: safeRelativePath });
  } catch (error) {
    res.status(500).json({ error: 'failed to save file', detail: error.message });
  }
}
