import { useState } from 'react';
import type { ServiceDeployments, BuildLog } from '../lib/api';
import { api } from '../lib/api';

interface Props {
  service: ServiceDeployments;
  platform: 'vercel';
}

const stateColors: Record<string, { dot: string; text: string; label: string }> = {
  READY: { dot: 'bg-success', text: 'text-success', label: 'Live' },
  BUILDING: { dot: 'bg-warning', text: 'text-warning', label: 'Building' },
  ERROR: { dot: 'bg-error', text: 'text-error', label: 'Failed' },
  CANCELED: { dot: 'bg-text-muted', text: 'text-text-muted', label: 'Canceled' },
  QUEUED: { dot: 'bg-info', text: 'text-info', label: 'Queued' },
};

function getStateConfig(state: string) {
  return stateColors[state] || { dot: 'bg-text-muted', text: 'text-text-muted', label: state };
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function buildDuration(building: number, ready: number): string {
  if (!building || !ready) return '';
  const secs = Math.round((ready - building) / 1000);
  return secs < 60 ? `${secs}s` : `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

export function ServiceCard({ service }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [logs, setLogs] = useState<BuildLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const latest = service.deployments[0];
  const state = latest ? getStateConfig(latest.state) : null;

  async function toggleLogs(deploymentId: string) {
    if (expandedId === deploymentId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(deploymentId);
    setLogsLoading(true);
    try {
      const data = await api.getBuildLogs(deploymentId);
      setLogs(data.logs);
    } catch {
      setLogs([{ type: 'stderr', text: 'Failed to load build logs', date: Date.now() }]);
    }
    setLogsLoading(false);
  }

  if (service.error) {
    return (
      <div className="rounded-xl bg-surface-raised border border-border p-5">
        <h3 className="text-sm font-medium text-text-primary mb-2">{service.label}</h3>
        <p className="text-sm text-error">{service.error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-surface-raised border border-border p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-text-muted" viewBox="0 0 76 65" fill="currentColor">
            <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
          </svg>
          <h3 className="text-sm font-medium text-text-primary">{service.label}</h3>
        </div>
        {state && (
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${state.dot}`} />
            <span className={`text-xs font-medium ${state.text}`}>{state.label}</span>
          </div>
        )}
      </div>

      {/* Latest deploy */}
      {latest && (
        <div className="mb-3">
          <p className="text-sm text-text-primary truncate" title={latest.meta.commit}>
            {latest.meta.commit || 'No commit message'}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-text-muted font-mono">{latest.meta.sha}</span>
            {latest.meta.branch && (
              <span className="text-xs text-accent/70 font-mono">{latest.meta.branch}</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs text-text-muted">{timeAgo(latest.createdAt)}</span>
            {latest.buildingAt && latest.ready && (
              <span className="text-xs text-text-muted">
                Built in {buildDuration(latest.buildingAt, latest.ready)}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Deploy history */}
      <div className="flex-1 border-t border-border-subtle pt-3 mt-auto">
        <p className="text-xs text-text-muted mb-2">Recent deploys</p>
        <div className="space-y-1.5">
          {service.deployments.slice(0, 5).map(d => {
            const s = getStateConfig(d.state);
            return (
              <button
                key={d.id}
                onClick={() => toggleLogs(d.id)}
                className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg hover:bg-surface-hover transition-colors text-left"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                  <span className="text-xs text-text-secondary truncate">
                    {d.meta.commit?.slice(0, 40) || d.meta.sha || d.id.slice(0, 8)}
                  </span>
                </div>
                <span className="text-xs text-text-muted shrink-0 ml-2">{timeAgo(d.createdAt)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Build logs expansion */}
      {expandedId && (
        <div className="mt-3 border-t border-border-subtle pt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-text-secondary">Build Logs</span>
            <button
              onClick={() => setExpandedId(null)}
              className="text-xs text-text-muted hover:text-text-primary"
            >
              Close
            </button>
          </div>
          <div className="max-h-48 overflow-y-auto rounded-lg bg-surface p-3 font-mono text-xs">
            {logsLoading ? (
              <p className="text-text-muted">Loading logs...</p>
            ) : logs.length === 0 ? (
              <p className="text-text-muted">No logs available</p>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  className={`whitespace-pre-wrap break-all ${
                    log.type === 'stderr' ? 'text-error' : 'text-text-secondary'
                  }`}
                >
                  {log.text}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
