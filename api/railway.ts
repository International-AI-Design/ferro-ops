import type { VercelRequest, VercelResponse } from '@vercel/node';

const RAILWAY_GQL = 'https://backboard.railway.app/graphql/v2';

async function gql(token: string, query: string, variables: Record<string, any> = {}) {
  const resp = await fetch(RAILWAY_GQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!resp.ok) throw new Error(`Railway API: ${resp.status}`);
  const json = await resp.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.RAILWAY_API_TOKEN;
  const projectId = process.env.RAILWAY_PROJECT_ID;

  if (!token) return res.status(500).json({ error: 'RAILWAY_API_TOKEN not configured' });
  if (!projectId) return res.status(500).json({ error: 'RAILWAY_PROJECT_ID not configured' });

  try {
    const data = await gql(token, `
      query ($projectId: String!) {
        project(id: $projectId) {
          name
          services {
            edges {
              node {
                id
                name
                deployments(first: 5) {
                  edges {
                    node {
                      id
                      status
                      createdAt
                      updatedAt
                      meta
                    }
                  }
                }
              }
            }
          }
          environments {
            edges {
              node {
                id
                name
              }
            }
          }
        }
      }
    `, { projectId });

    const services = data.project.services.edges.map((e: any) => ({
      id: e.node.id,
      name: e.node.name,
      deployments: e.node.deployments.edges.map((d: any) => ({
        id: d.node.id,
        status: d.node.status,
        createdAt: d.node.createdAt,
        updatedAt: d.node.updatedAt,
        meta: d.node.meta,
      })),
    }));

    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');
    res.json({
      project: data.project.name,
      services,
      environments: data.project.environments.edges.map((e: any) => e.node),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
}
