import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const urls = [
    {
      label: 'Customer App',
      url: 'https://hthd.internationalaidesign.com',
    },
    {
      label: 'Admin App',
      url: 'https://hthd-admin.internationalaidesign.com',
    },
    {
      label: 'API Server',
      url: process.env.HEALTH_CHECK_URL || 'https://hthd-api.internationalaidesign.com/api/health',
    },
  ];

  const results = await Promise.all(
    urls.map(async ({ label, url }) => {
      const start = Date.now();
      try {
        const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
        const latency = Date.now() - start;
        const body = url.includes('/api/health') ? await resp.json().catch(() => null) : null;
        return {
          label,
          url,
          status: resp.ok ? 'healthy' : 'degraded',
          httpStatus: resp.status,
          latency,
          version: body?.version || null,
        };
      } catch (err: any) {
        return {
          label,
          url,
          status: 'down',
          httpStatus: 0,
          latency: Date.now() - start,
          error: err.message,
          version: null,
        };
      }
    })
  );

  res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate=20');
  res.json({ services: results, checkedAt: new Date().toISOString() });
}
