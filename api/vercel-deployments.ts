import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.VERCEL_API_TOKEN;
  const teamId = process.env.VERCEL_TEAM_ID;
  const customerProjectId = process.env.VERCEL_PROJECT_CUSTOMER;
  const adminProjectId = process.env.VERCEL_PROJECT_ADMIN;

  if (!token) return res.status(500).json({ error: 'VERCEL_API_TOKEN not configured' });

  const teamParam = teamId ? `&teamId=${teamId}` : '';

  async function fetchDeployments(projectId: string | undefined, label: string) {
    if (!projectId) return { label, error: 'Project ID not configured', deployments: [] };
    const url = `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=5${teamParam}`;
    const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!resp.ok) return { label, error: `API error: ${resp.status}`, deployments: [] };
    const data = await resp.json();
    return {
      label,
      deployments: data.deployments.map((d: any) => ({
        id: d.uid,
        url: d.url,
        state: d.state,
        target: d.target,
        createdAt: d.createdAt,
        buildingAt: d.buildingAt,
        ready: d.ready,
        meta: {
          commit: d.meta?.githubCommitMessage || '',
          sha: d.meta?.githubCommitSha?.slice(0, 7) || '',
          branch: d.meta?.githubCommitRef || '',
        },
      })),
    };
  }

  try {
    const [customer, admin] = await Promise.all([
      fetchDeployments(customerProjectId, 'Customer App'),
      fetchDeployments(adminProjectId, 'Admin App'),
    ]);
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');
    res.json({ customer, admin });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
