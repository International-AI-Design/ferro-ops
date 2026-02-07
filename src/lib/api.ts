const BASE = import.meta.env.DEV ? '' : '';

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json();
}

export interface Deployment {
  id: string;
  url: string;
  state: string;
  target: string;
  createdAt: number;
  buildingAt: number;
  ready: number;
  meta: { commit: string; sha: string; branch: string };
}

export interface ServiceDeployments {
  label: string;
  error?: string;
  deployments: Deployment[];
}

export interface VercelData {
  customer: ServiceDeployments;
  admin: ServiceDeployments;
}

export interface RailwayDeployment {
  id: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  meta: Record<string, unknown>;
}

export interface RailwayService {
  id: string;
  name: string;
  deployments: RailwayDeployment[];
}

export interface RailwayData {
  project: string;
  services: RailwayService[];
  environments: { id: string; name: string }[];
}

export interface HealthService {
  label: string;
  url: string;
  status: 'healthy' | 'degraded' | 'down';
  httpStatus: number;
  latency: number;
  version: string | null;
  error?: string;
}

export interface HealthData {
  services: HealthService[];
  checkedAt: string;
}

export interface GitCommit {
  sha: string;
  message: string;
  author: string;
  date: string;
  url: string;
}

export interface GitData {
  commits: GitCommit[];
}

export interface BuildLog {
  type: string;
  text: string;
  date: number;
}

export const api = {
  getVercelDeployments: () => get<VercelData>('/api/vercel-deployments'),
  getRailway: () => get<RailwayData>('/api/railway'),
  getHealth: () => get<HealthData>('/api/health'),
  getGitHub: () => get<GitData>('/api/github'),
  getBuildLogs: (deploymentId: string) =>
    get<{ logs: BuildLog[] }>(`/api/vercel-logs?deploymentId=${deploymentId}`),
};
