import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const repo = process.env.GITHUB_REPO || 'International-AI-Design/hthd-loyalty-app';

  try {
    const resp = await fetch(`https://api.github.com/repos/${repo}/commits?per_page=10`, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    });
    if (!resp.ok) return res.status(resp.status).json({ error: `GitHub API: ${resp.status}` });
    const commits = await resp.json();

    const result = commits.map((c: any) => ({
      sha: c.sha.slice(0, 7),
      message: c.commit.message.split('\n')[0],
      author: c.commit.author.name,
      date: c.commit.author.date,
      url: c.html_url,
    }));

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    res.json({ commits: result });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
