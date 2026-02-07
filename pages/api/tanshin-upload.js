const fs = require('fs/promises');
const path = require('path');

const INPUT_DIR = path.join(process.cwd(), 'input');

const sanitizeFileName = (name) => path.basename(name).replace(/[^a-zA-Z0-9._-]/g, '_');

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '25mb'
    }
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  const { filename, data } = req.body || {};

  if (!filename || typeof filename !== 'string' || !data || typeof data !== 'string') {
    res.status(400).json({ error: 'filename and data are required' });
    return;
  }

  if (!filename.toLowerCase().endsWith('.pdf')) {
    res.status(400).json({ error: 'only pdf files are supported' });
    return;
  }

  try {
    const safeName = sanitizeFileName(filename);
    const buffer = Buffer.from(data, 'base64');
    await fs.mkdir(INPUT_DIR, { recursive: true });
    const targetPath = path.join(INPUT_DIR, safeName);
    await fs.writeFile(targetPath, buffer);
    res.status(200).json({ saved: true, filename: safeName });
  } catch (error) {
    res.status(500).json({ error: 'failed to save file', detail: error.message });
  }
}
