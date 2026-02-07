import type { HealthData } from '../lib/api';

interface Props {
  data: HealthData;
}

const statusConfig = {
  healthy: { dot: 'bg-success', bg: 'bg-success-bg', text: 'text-success', label: 'Healthy' },
  degraded: { dot: 'bg-warning', bg: 'bg-warning-bg', text: 'text-warning', label: 'Degraded' },
  down: { dot: 'bg-error', bg: 'bg-error-bg', text: 'text-error', label: 'Down' },
} as const;

export function HealthBar({ data }: Props) {
  const allHealthy = data.services.every(s => s.status === 'healthy');
  const anyDown = data.services.some(s => s.status === 'down');

  return (
    <div
      className={`rounded-xl border p-4 ${
        anyDown
          ? 'bg-error-bg border-error/20'
          : allHealthy
          ? 'bg-success-bg border-success/20'
          : 'bg-warning-bg border-warning/20'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              anyDown ? 'bg-error' : allHealthy ? 'bg-success' : 'bg-warning'
            }`}
            style={{ animation: 'pulse-dot 2s ease-in-out infinite' }}
          />
          <span className={`text-sm font-medium ${anyDown ? 'text-error' : allHealthy ? 'text-success' : 'text-warning'}`}>
            {anyDown ? 'Service Outage' : allHealthy ? 'All Systems Operational' : 'Partial Degradation'}
          </span>
        </div>
        {data.services.find(s => s.version) && (
          <span className="text-xs text-text-muted font-mono">
            API v{data.services.find(s => s.version)?.version}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {data.services.map(svc => {
          const cfg = statusConfig[svc.status];
          return (
            <div key={svc.label} className="flex items-center justify-between px-3 py-2 rounded-lg bg-surface/50">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                <span className="text-sm text-text-primary">{svc.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-text-muted font-mono">{svc.latency}ms</span>
                <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
