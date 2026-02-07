import { useState, useEffect, useCallback } from 'react';
import { api } from './lib/api';
import type { VercelData, RailwayData, HealthData, GitData } from './lib/api';
import { HealthBar } from './components/HealthBar';
import { ServiceCard } from './components/ServiceCard';
import { RailwayCard } from './components/RailwayCard';
import { CommitLog } from './components/CommitLog';

const REFRESH_INTERVAL = 30_000;

export default function App() {
  const [vercel, setVercel] = useState<VercelData | null>(null);
  const [railway, setRailway] = useState<RailwayData | null>(null);
  const [health, setHealth] = useState<HealthData | null>(null);
  const [github, setGithub] = useState<GitData | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState<string[]>([]);

  const refresh = useCallback(async () => {
    const errs: string[] = [];
    const results = await Promise.allSettled([
      api.getHealth().then(setHealth),
      api.getVercelDeployments().then(setVercel),
      api.getRailway().then(setRailway),
      api.getGitHub().then(setGithub),
    ]);
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        const labels = ['Health', 'Vercel', 'Railway', 'GitHub'];
        errs.push(`${labels[i]}: ${r.reason?.message || 'failed'}`);
      }
    });
    setErrors(errs);
    setLastRefresh(new Date());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(id);
  }, [refresh]);

  return (
    <div className="min-h-dvh p-4 md:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-accent/20 flex items-center justify-center">
            <span className="text-accent font-bold text-lg">F</span>
          </div>
          <div>
            <h1 className="text-xl font-semibold text-text-primary tracking-tight">Ferro Ops</h1>
            <p className="text-xs text-text-muted">Happy Tail Happy Dog</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-text-muted">
              Updated {lastRefresh.toLocaleTimeString()}
            </span>
          )}
          <button
            onClick={refresh}
            className="px-3 py-1.5 rounded-lg bg-surface-raised border border-border text-sm text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors"
          >
            Refresh
          </button>
        </div>
      </header>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="mb-4 p-3 rounded-xl bg-error-bg border border-error/20">
          {errors.map((e, i) => (
            <p key={i} className="text-sm text-error">{e}</p>
          ))}
        </div>
      )}

      {loading ? (
        <LoadingSkeleton />
      ) : (
        <div className="space-y-6 animate-slide-up">
          {/* Health Bar */}
          {health && <HealthBar data={health} />}

          {/* Service Deployments */}
          <section>
            <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
              Deployments
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {vercel && (
                <>
                  <ServiceCard service={vercel.customer} platform="vercel" />
                  <ServiceCard service={vercel.admin} platform="vercel" />
                </>
              )}
              {railway && railway.services.map(svc => (
                <RailwayCard key={svc.id} service={svc} />
              ))}
            </div>
          </section>

          {/* Git Log */}
          {github && (
            <section>
              <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
                Recent Commits
              </h2>
              <CommitLog commits={github.commits} />
            </section>
          )}

          {/* Quick Links */}
          <section>
            <h2 className="text-sm font-medium text-text-secondary uppercase tracking-wider mb-3">
              Quick Links
            </h2>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Customer App', url: 'https://hthd.internationalaidesign.com' },
                { label: 'Admin App', url: 'https://hthd-admin.internationalaidesign.com' },
                { label: 'API Health', url: 'https://hthd-api.internationalaidesign.com/api/health' },
                { label: 'GitHub', url: 'https://github.com/International-AI-Design/hthd-loyalty-app' },
                { label: 'Vercel', url: 'https://vercel.com' },
                { label: 'Railway', url: 'https://railway.app' },
              ].map(link => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 rounded-lg bg-surface-raised border border-border text-sm text-text-secondary hover:text-accent hover:border-accent/30 transition-colors"
                >
                  {link.label} ↗
                </a>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-16 rounded-xl bg-surface-raised animate-pulse" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-48 rounded-xl bg-surface-raised animate-pulse" />
        ))}
      </div>
      <div className="h-64 rounded-xl bg-surface-raised animate-pulse" />
    </div>
  );
}
