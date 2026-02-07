const isAllowedPdfUrl = (value) => {
  try {
    const parsed = new URL(value);
    return (
      parsed.protocol === 'https:' &&
      parsed.host === 'www.release.tdnet.info' &&
      parsed.pathname.toLowerCase().endsWith('.pdf')
    );
  } catch (error) {
    return false;
  }
};

export default async function handler(req, res) {
  const { u } = req.query;

  if (!u || !isAllowedPdfUrl(u)) {
    res.status(400).json({ error: 'invalid url' });
    return;
  }

  try {
    const response = await fetch(u);
    if (!response.ok) {
      res.status(502).json({ error: 'failed to fetch pdf' });
      return;
    }

    const arrayBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'application/pdf');
    res.status(200).send(Buffer.from(arrayBuffer));
  } catch (error) {
    res.status(502).json({ error: 'failed to fetch pdf' });
  }
}
