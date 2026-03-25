import { useMemo } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { useGraphStore } from '../../stores/graphStore';
import { ACTOR_TYPE_LABELS, ACTOR_TYPE_COLORS, ACTOR_TYPE_ICONS } from '../../types';

export default function ActorDetails() {
  const actors = useGraphStore((s) => s.actors);
  const edges = useGraphStore((s) => s.edges);
  const providerIdpEdges = useGraphStore((s) => s.providerIdpEdges);
  const directChannels = useGraphStore((s) => s.directChannels);
  const selectedActorId = useGraphStore((s) => s.selectedActorId);
  const removeActor = useGraphStore((s) => s.removeActor);

  const actor = selectedActorId ? actors.get(selectedActorId) ?? null : null;

  const connections = useMemo(() => {
    if (!actor) return [];
    const connected: { id: string; name: string; type: string; via: string }[] = [];

    for (const edge of edges.values()) {
      if (edge.sourceId === actor.id) {
        const target = actors.get(edge.targetId);
        if (target) connected.push({ id: target.id, name: target.name, type: target.type, via: edge.edgeType });
      } else if (edge.targetId === actor.id) {
        const source = actors.get(edge.sourceId);
        if (source) connected.push({ id: source.id, name: source.name, type: source.type, via: edge.edgeType });
      }
    }

    for (const edge of providerIdpEdges.values()) {
      if (edge.sourceId === actor.id) {
        const target = actors.get(edge.targetId);
        if (target && !connected.some((c) => c.id === target.id))
          connected.push({ id: target.id, name: target.name, type: target.type, via: edge.edgeType });
      } else if (edge.targetId === actor.id) {
        const source = actors.get(edge.sourceId);
        if (source && !connected.some((c) => c.id === source.id))
          connected.push({ id: source.id, name: source.name, type: source.type, via: edge.edgeType });
      }
    }

    for (const dc of directChannels.values()) {
      if (dc.providerId === actor.id) {
        const client = actors.get(dc.clientId);
        if (client && !connected.some((c) => c.id === client.id))
          connected.push({ id: client.id, name: client.name, type: client.type, via: 'direct' });
      } else if (dc.clientId === actor.id) {
        const provider = actors.get(dc.providerId);
        if (provider && !connected.some((c) => c.id === provider.id))
          connected.push({ id: provider.id, name: provider.name, type: provider.type, via: 'direct' });
      }
    }

    return connected;
  }, [actor, actors, edges, providerIdpEdges, directChannels]);

  const stats = useMemo(() => {
    if (!actor) return [];
    const items: { label: string; value: string | number }[] = [];

    if (actor.type === 'network') {
      const peerCount = connections.filter((c) => c.type === 'network').length;
      const providerCount = connections.filter((c) => c.type === 'provider').length;
      const clientCount = connections.filter(
        (c) => c.type === 'client-patient' || c.type === 'client-delegated',
      ).length;
      items.push({ label: 'Peer Networks', value: peerCount });
      items.push({ label: 'Providers', value: providerCount });
      items.push({ label: 'Clients', value: clientCount });
    } else if (actor.type === 'provider') {
      const dcCount = Array.from(directChannels.values()).filter(
        (dc) => dc.providerId === actor.id,
      ).length;
      items.push({ label: 'Direct Channels', value: dcCount });
    } else if (actor.type === 'client-patient' || actor.type === 'client-delegated') {
      const dcCount = Array.from(directChannels.values()).filter(
        (dc) => dc.clientId === actor.id,
      ).length;
      items.push({ label: 'Direct Channels', value: dcCount });
    } else if (actor.type === 'idp') {
      const clientCount = connections.filter(
        (c) => c.type === 'client-patient' || c.type === 'client-delegated',
      ).length;
      items.push({ label: 'Clients', value: clientCount });
    }
    return items;
  }, [actor, connections, directChannels]);

  if (!actor) {
    return (
      <div
        className="w-60 flex-shrink-0 flex items-center justify-center border-l
          bg-[var(--color-surface)] border-[var(--color-border)]"
      >
        <p className="text-xs text-[var(--color-text-tertiary)] text-center px-4">
          Click an actor to view details
        </p>
      </div>
    );
  }

  const colors = ACTOR_TYPE_COLORS[actor.type];

  return (
    <div
      className="w-60 flex-shrink-0 flex flex-col overflow-y-auto border-l
        bg-[var(--color-surface)] border-[var(--color-border)]"
    >
      {/* Header */}
      <div className="px-3 py-3 border-b border-[var(--color-border)]">
        <div className="flex items-start gap-2">
          <span className="text-lg">{ACTOR_TYPE_ICONS[actor.type]}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-[var(--color-text)] truncate">{actor.name}</h3>
            <span
              className="inline-block mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: colors.light, color: colors.main }}
            >
              {ACTOR_TYPE_LABELS[actor.type]}
            </span>
          </div>
        </div>
      </div>

      {/* Properties */}
      <div className="px-3 py-2 border-b border-[var(--color-border)]">
        <h4 className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-1.5">
          Properties
        </h4>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--color-text-secondary)]">ID</span>
            <span className="font-mono text-[10px] text-[var(--color-text-tertiary)]">{actor.id}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--color-text-secondary)]">Status</span>
            <span className="flex items-center gap-1 text-[var(--color-success)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)]" />
              Active
            </span>
          </div>
          {actor.networkId && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-text-secondary)]">Network</span>
              <span className="text-[var(--color-text)]">
                {actors.get(actor.networkId)?.name ?? actor.networkId}
              </span>
            </div>
          )}
          {stats.map((stat) => (
            <div key={stat.label} className="flex items-center justify-between text-xs">
              <span className="text-[var(--color-text-secondary)]">{stat.label}</span>
              <span className="font-medium text-[var(--color-text)]">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Connections */}
      <div className="px-3 py-2 flex-1">
        <h4 className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)] mb-1.5">
          Connections ({connections.length})
        </h4>
        <div className="space-y-0.5">
          {connections.map((conn) => (
            <div
              key={conn.id}
              className="flex items-center gap-1.5 px-1.5 py-1 rounded text-xs
                hover:bg-[var(--color-surface-alt)] cursor-pointer transition-colors"
              onClick={() => useGraphStore.getState().selectActor(conn.id)}
            >
              <span className="text-xs">{ACTOR_TYPE_ICONS[conn.type as keyof typeof ACTOR_TYPE_ICONS]}</span>
              <span className="flex-1 truncate text-[var(--color-text)]">{conn.name}</span>
              <span
                className="text-[9px] px-1 py-0.5 rounded"
                style={{
                  backgroundColor:
                    conn.via === 'direct' ? 'var(--color-teal-light)' :
                    conn.via === 'identity' ? 'var(--color-warning-light)' :
                    'var(--color-surface-alt)',
                  color:
                    conn.via === 'direct' ? 'var(--color-teal)' :
                    conn.via === 'identity' ? 'var(--color-warning)' :
                    'var(--color-text-tertiary)',
                }}
              >
                {conn.via}
              </span>
            </div>
          ))}
          {connections.length === 0 && (
            <p className="text-[10px] text-[var(--color-text-tertiary)] italic">No connections</p>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-[var(--color-border)] flex gap-2">
        <button
          className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded
            border border-[var(--color-border)] text-[var(--color-text-secondary)]
            hover:bg-[var(--color-surface-alt)] transition-colors"
        >
          <Edit2 size={11} />
          Edit
        </button>
        <button
          onClick={() => removeActor(actor.id)}
          className="flex-1 flex items-center justify-center gap-1 text-xs py-1.5 rounded
            border border-[var(--color-danger)] text-[var(--color-danger)]
            hover:bg-[var(--color-danger-light)] transition-colors"
        >
          <Trash2 size={11} />
          Remove
        </button>
      </div>
    </div>
  );
}
