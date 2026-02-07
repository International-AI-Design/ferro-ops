import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.VERCEL_API_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  const { deploymentId } = req.query;

  if (!token) return res.status(500).json({ error: 'VERCEL_API_TOKEN not configured' });
  if (!deploymentId || typeof deploymentId !== 'string') {
    return res.status(400).json({ error: 'deploymentId required' });
  }

  const teamParam = teamId ? `?teamId=${teamId}` : '';

  try {
    const url = `https://api.vercel.com/v7/deployments/${deploymentId}/events${teamParam}`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) return res.status(resp.status).json({ error: `Vercel API: ${resp.status}` });
    const events = await resp.json();

    const logs = events
      .filter((e: any) => e.type === 'stdout' || e.type === 'stderr' || e.type === 'command')
      .map((e: any) => ({
        type: e.type,
        text: e.payload?.text || e.text || '',
        date: e.date || e.created,
      }));

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    res.json({ logs });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
