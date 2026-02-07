import type { RailwayService } from '../lib/api';

interface Props {
  service: RailwayService;
}

const statusColors: Record<string, { dot: string; text: string; label: string }> = {
  SUCCESS: { dot: 'bg-success', text: 'text-success', label: 'Live' },
  DEPLOYING: { dot: 'bg-warning', text: 'text-warning', label: 'Deploying' },
  BUILDING: { dot: 'bg-warning', text: 'text-warning', label: 'Building' },
  FAILED: { dot: 'bg-error', text: 'text-error', label: 'Failed' },
  CRASHED: { dot: 'bg-error', text: 'text-error', label: 'Crashed' },
  REMOVED: { dot: 'bg-text-muted', text: 'text-text-muted', label: 'Removed' },
  SLEEPING: { dot: 'bg-info', text: 'text-info', label: 'Sleeping' },
};

function getStatusConfig(status: string) {
  return statusColors[status] || { dot: 'bg-text-muted', text: 'text-text-muted', label: status };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function RailwayCard({ service }: Props) {
  const latest = service.deployments[0];
  const status = latest ? getStatusConfig(latest.status) : null;

  return (
    <div className="rounded-xl bg-surface-raised border border-border p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-text-muted" viewBox="0 0 24 24" fill="currentColor">
            <path d="M.002 20.216a1.4 1.4 0 0 0 1.39 1.273h3.795l.36-1.274H.003Zm23.994 0H13.39l.36 1.273h8.857a1.4 1.4 0 0 0 1.39-1.274ZM12 2.511l-9.793 16.33h19.586L12 2.512Z" />
          </svg>
          <h3 className="text-sm font-medium text-text-primary">{service.name}</h3>
        </div>
        {status && (
          <div className="flex items-center gap-1.5">
            <div className={`w-2 h-2 rounded-full ${status.dot}`} />
            <span className={`text-xs font-medium ${status.text}`}>{status.label}</span>
          </div>
        )}
      </div>

      {/* Latest deploy */}
      {latest && (
        <div className="mb-3">
          <p className="text-sm text-text-primary truncate">
            {(latest.meta as any)?.commitMessage || service.name}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {(latest.meta as any)?.commitHash && (
              <span className="text-xs text-text-muted font-mono">
                {String((latest.meta as any).commitHash).slice(0, 7)}
              </span>
            )}
          </div>
          <span className="text-xs text-text-muted mt-1.5 block">{timeAgo(latest.createdAt)}</span>
        </div>
      )}

      {/* Deploy history */}
      <div className="flex-1 border-t border-border-subtle pt-3 mt-auto">
        <p className="text-xs text-text-muted mb-2">Recent deploys</p>
        <div className="space-y-1.5">
          {service.deployments.slice(0, 5).map(d => {
            const s = getStatusConfig(d.status);
            return (
              <div
                key={d.id}
                className="flex items-center justify-between px-2 py-1.5 rounded-lg"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${s.dot}`} />
                  <span className="text-xs text-text-secondary truncate">
                    {(d.meta as any)?.commitMessage?.slice(0, 40) || d.id.slice(0, 8)}
                  </span>
                </div>
                <span className="text-xs text-text-muted shrink-0 ml-2">{timeAgo(d.createdAt)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
