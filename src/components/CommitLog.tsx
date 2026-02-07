import type { GitCommit } from '../lib/api';

interface Props {
  commits: GitCommit[];
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

export function CommitLog({ commits }: Props) {
  return (
    <div className="rounded-xl bg-surface-raised border border-border overflow-hidden">
      <div className="divide-y divide-border-subtle">
        {commits.map(commit => (
          <a
            key={commit.sha}
            href={commit.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 px-4 py-3 hover:bg-surface-hover transition-colors"
          >
            <span className="text-xs text-accent font-mono mt-0.5 shrink-0">{commit.sha}</span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-text-primary truncate">{commit.message}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-text-muted">{commit.author}</span>
                <span className="text-xs text-text-muted">{timeAgo(commit.date)}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
