const fs = require('fs/promises');
const path = require('path');
const { spawn } = require('child_process');

const INPUT_DIR = path.join(process.cwd(), 'input');
const OUTPUT_DIR = path.join(process.cwd(), 'output');

const runPythonBatch = async (inputDir, outputDir) => {
  const candidates = ['python', 'python3'];

  const attempt = (commandIndex) =>
    new Promise((resolve, reject) => {
      if (commandIndex >= candidates.length) {
        reject(new Error('python interpreter not found'));
        return;
      }

      const command = candidates[commandIndex];
      const child = spawn(command, ['-m', 'ta', 'batch', '--input', inputDir, '--output', outputDir], {
        cwd: process.cwd()
      });
      let stderr = '';

      child.stderr.on('data', (chunk) => {
        stderr += chunk.toString();
      });

      child.on('error', (error) => {
        if (error.code === 'ENOENT') {
          attempt(commandIndex + 1).then(resolve).catch(reject);
          return;
        }
        reject(error);
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve();
          return;
        }
        reject(new Error(stderr || `python exited with code ${code}`));
      });
    });

  await attempt(0);
};

const loadExtractedPayloads = async (outputDir) => {
  const entries = await fs.readdir(outputDir, { withFileTypes: true });
  const payloads = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith('.json') || entry.name === '.done.json') {
      continue;
    }
    const fullPath = path.join(outputDir, entry.name);
    const content = await fs.readFile(fullPath, 'utf-8');
    const parsed = JSON.parse(content);
    const metadata = parsed._metadata || {};
    payloads.push({
      file: metadata.source_file || entry.name.replace(/\.json$/, ''),
      processedAt: metadata.processed_at || null,
      data: parsed
    });
  }

  return payloads;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  try {
    await fs.mkdir(INPUT_DIR, { recursive: true });
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    let analysisError = null;
    try {
      await runPythonBatch(INPUT_DIR, OUTPUT_DIR);
    } catch (error) {
      analysisError = error.message;
    }

    const extractedPayloads = await loadExtractedPayloads(OUTPUT_DIR);

    res.status(200).json({
      inputDir: INPUT_DIR,
      outputDir: OUTPUT_DIR,
      extractedCount: extractedPayloads.length,
      extracted: extractedPayloads,
      error: analysisError
    });
  } catch (error) {
    res.status(500).json({ error: 'failed to run analysis', detail: error.message });
  }
}
