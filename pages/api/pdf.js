export default async function handler(req, res) {
  const { url } = req.query;
  if (!url) {
    res.status(400).json({ error: 'url is required' });
    return;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (error) {
    res.status(400).json({ error: 'invalid url' });
    return;
  }

  if (parsedUrl.host !== 'www.release.tdnet.info') {
    res.status(400).json({ error: 'invalid host' });
    return;
  }

  try {
    const response = await fetch(parsedUrl.toString());
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
