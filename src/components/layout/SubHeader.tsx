import { useMemo } from 'react';
import { useGraphStore } from '../../stores/graphStore';
import { useSimulationStore } from '../../stores/simulationStore';

const STAT_DOT_COLORS: Record<string, string> = {
  network: '#22c55e',
  provider: '#ef4444',
  'client-patient': '#3b82f6',
  'client-delegated': '#a855f7',
  idp: '#eab308',
  edges: '#6b7280',
};

interface StatBadge {
  label: string;
  count: number;
  color: string;
}

export function SubHeader() {
  const actors = useGraphStore((s) => s.actors);
  const edges = useGraphStore((s) => s.edges);
  const approach = useSimulationStore((s) => s.approach);

  const stats = useMemo<StatBadge[]>(() => {
    const counts: Record<string, number> = {
      network: 0,
      provider: 0,
      client: 0,
      idp: 0,
    };
    for (const actor of actors.values()) {
      if (actor.type === 'network') counts.network++;
      else if (actor.type === 'provider') counts.provider++;
      else if (actor.type === 'client-patient' || actor.type === 'client-delegated') counts.client++;
      else if (actor.type === 'idp') counts.idp++;
    }
    return [
      { label: 'Networks', count: counts.network, color: STAT_DOT_COLORS.network },
      { label: 'Providers', count: counts.provider, color: STAT_DOT_COLORS.provider },
      { label: 'Clients', count: counts.client, color: STAT_DOT_COLORS['client-patient'] },
      { label: 'IDPs', count: counts.idp, color: STAT_DOT_COLORS.idp },
      { label: 'Trust Links', count: edges.size, color: STAT_DOT_COLORS.edges },
    ];
  }, [actors, edges]);

  // Derive current preset name from actors (best-effort match)
  const presetName = useMemo(() => {
    const count = actors.size;
    if (count === 0) return 'Empty Graph';
    if (count === 4) return 'Simple Preset';
    if (count === 7) return 'Two Networks Preset';
    if (count === 11) return 'Hub & Spoke Preset';
    if (count === 16) return 'Complex Preset';
    return `Custom (${count} actors)`;
  }, [actors]);

  return (
    <div
      className="h-9 flex-shrink-0 flex items-center justify-between px-4 text-xs border-b
        bg-[var(--color-surface,theme(colors.gray.50))] dark:bg-[var(--color-surface,theme(colors.gray.900))]
        border-[var(--color-border,theme(colors.gray.200))] dark:border-[var(--color-border,theme(colors.gray.700))]
        text-[var(--color-text,theme(colors.gray.600))] dark:text-[var(--color-text,theme(colors.gray.400))]"
    >
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-1">
        <span className="opacity-60">Simulator</span>
        <span className="opacity-40 mx-1">›</span>
        <span className="font-semibold">{presetName}</span>
        <span className="opacity-40 mx-1">·</span>
        <span className="capitalize">{approach} Mode</span>
      </div>

      {/* Right: Stats */}
      <div className="flex items-center gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-1.5">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: stat.color }}
            />
            <span className="font-bold text-xs">{stat.count}</span>
            <span className="opacity-50 text-xs">{stat.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
