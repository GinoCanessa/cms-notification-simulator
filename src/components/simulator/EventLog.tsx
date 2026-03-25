import { useMemo, useState } from 'react';
import { Download, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { useEventLogStore, type LogTab } from '../../stores/eventLogStore';
import { useGraphStore } from '../../stores/graphStore';
import { formatTimestamp, exportLogAsJson, exportLogAsCsv } from '../../utils/exportUtils';
import type { MessageType } from '../../types';
import { ACTOR_TYPE_ICONS } from '../../types';

function getMessagePillStyle(messageType: MessageType): { bg: string; text: string } {
  if (messageType.startsWith('encounter-')) {
    return { bg: 'var(--color-warning-light)', text: 'var(--color-warning)' };
  }
  if (messageType.startsWith('new-care-relationship') || messageType === 'new-care-relationship') {
    return { bg: 'var(--color-purple-light)', text: 'var(--color-purple)' };
  }
  if (
    messageType.includes('registration') ||
    messageType.includes('subscriber')
  ) {
    return { bg: 'var(--color-accent-light)', text: 'var(--color-accent)' };
  }
  if (
    messageType.includes('network') ||
    messageType.includes('provider-catalog') ||
    messageType === 'new-providers-available' ||
    messageType === 'new-providers-available-relay'
  ) {
    return { bg: 'var(--color-success-light)', text: 'var(--color-success)' };
  }
  if (
    messageType === 'new-provider-available' ||
    messageType === 'new-provider-relay' ||
    messageType === 'provider-removed' ||
    messageType === 'provider-removed-relay'
  ) {
    return { bg: 'var(--color-danger-light)', text: 'var(--color-danger)' };
  }
  if (messageType.startsWith('direct-channel-')) {
    return { bg: 'var(--color-teal-light)', text: 'var(--color-teal)' };
  }
  if (messageType.startsWith('idp-identity-')) {
    return { bg: 'var(--color-warning-light)', text: 'var(--color-warning)' };
  }
  return { bg: 'var(--color-surface-alt)', text: 'var(--color-text-secondary)' };
}

const TABS: { id: LogTab; label: string }[] = [
  { id: 'events', label: 'Event Log' },
  { id: 'messages', label: 'Message Log' },
  { id: 'raw', label: 'Raw Data' },
  { id: 'metrics', label: 'Metrics' },
];

export default function EventLog() {
  const events = useEventLogStore((s) => s.events);
  const entries = useEventLogStore((s) => s.entries);
  const filters = useEventLogStore((s) => s.filters);
  const activeTab = useEventLogStore((s) => s.activeTab);
  const isCollapsed = useEventLogStore((s) => s.isCollapsed);
  const clearAll = useEventLogStore((s) => s.clearAll);
  const setFilter = useEventLogStore((s) => s.setFilter);
  const setActiveTab = useEventLogStore((s) => s.setActiveTab);
  const setCollapsed = useEventLogStore((s) => s.setCollapsed);
  const selectedEntryId = useEventLogStore((s) => s.selectedEntryId);
  const selectEntry = useEventLogStore((s) => s.selectEntry);
  const actors = useGraphStore((s) => s.actors);

  const [exportOpen, setExportOpen] = useState(false);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (filters.eventType && e.eventType !== filters.eventType) return false;
      if (filters.actorId && e.from.id !== filters.actorId && e.to.id !== filters.actorId) return false;
      if (filters.channel && e.channel !== filters.channel) return false;
      return true;
    });
  }, [entries, filters]);

  // Unique event types for filter dropdown
  const eventTypes = useMemo(() => {
    const types = new Set(entries.map((e) => e.eventType));
    return Array.from(types).sort();
  }, [entries]);

  // Metrics
  const metrics = useMemo(() => {
    if (entries.length === 0) return null;
    const totalHops = entries.length;
    const trustHops = entries.filter((e) => e.channel === 'trust').length;
    const directHops = entries.filter((e) => e.channel === 'direct').length;
    const uniqueEvents = new Set(entries.map((e) => e.eventId)).size;
    const avgHopsPerEvent = totalHops / (uniqueEvents || 1);
    return { totalHops, trustHops, directHops, uniqueEvents, avgHopsPerEvent };
  }, [entries]);

  return (
    <div
      className="flex-shrink-0 border-t bg-[var(--color-surface)] border-[var(--color-border)]
        flex flex-col transition-all"
      style={{ height: isCollapsed ? 32 : 200 }}
    >
      {/* Toolbar */}
      <div
        className="h-8 flex-shrink-0 flex items-center justify-between px-3 border-b
          border-[var(--color-border)] bg-[var(--color-surface-alt)]"
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCollapsed(!isCollapsed)}
            className="p-0.5 hover:bg-[var(--color-border)] rounded transition-colors text-[var(--color-text-tertiary)]"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            {isCollapsed ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`text-[11px] font-medium pb-0.5 transition-colors ${
                activeTab === tab.id
                  ? 'text-[var(--color-brand)] border-b border-[var(--color-brand)]'
                  : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filters.channel ?? ''}
            onChange={(e) => setFilter({ channel: (e.target.value || null) as 'trust' | 'direct' | null })}
            className="text-[10px] px-1 py-0.5 rounded border border-[var(--color-border)]
              bg-[var(--color-surface)] text-[var(--color-text)] outline-none"
          >
            <option value="">All channels</option>
            <option value="trust">Trust</option>
            <option value="direct">Direct</option>
          </select>
          <select
            value={filters.eventType ?? ''}
            onChange={(e) => setFilter({ eventType: e.target.value || null })}
            className="text-[10px] px-1 py-0.5 rounded border border-[var(--color-border)]
              bg-[var(--color-surface)] text-[var(--color-text)] outline-none"
          >
            <option value="">All events</option>
            {eventTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <div className="relative">
            <button
              onClick={() => setExportOpen(!exportOpen)}
              className="p-1 rounded hover:bg-[var(--color-border)] text-[var(--color-text-tertiary)] transition-colors"
              title="Export"
            >
              <Download size={12} />
            </button>
            {exportOpen && (
              <div
                className="absolute right-0 bottom-full mb-1 w-24 rounded border border-[var(--color-border)]
                  bg-[var(--color-surface)] shadow-md z-10"
              >
                <button
                  onClick={() => { exportLogAsJson(entries); setExportOpen(false); }}
                  className="block w-full text-left text-[10px] px-2 py-1 hover:bg-[var(--color-surface-alt)]
                    text-[var(--color-text)]"
                >
                  Export JSON
                </button>
                <button
                  onClick={() => { exportLogAsCsv(entries); setExportOpen(false); }}
                  className="block w-full text-left text-[10px] px-2 py-1 hover:bg-[var(--color-surface-alt)]
                    text-[var(--color-text)]"
                >
                  Export CSV
                </button>
              </div>
            )}
          </div>
          <button
            onClick={clearAll}
            className="p-1 rounded hover:bg-[var(--color-danger-light)] text-[var(--color-text-tertiary)]
              hover:text-[var(--color-danger)] transition-colors"
            title="Clear all logs"
          >
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="flex-1 overflow-auto">
          {activeTab === 'events' && (
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-[var(--color-surface-alt)] text-[var(--color-text-tertiary)] sticky top-0">
                  <th className="text-left px-2 py-1 font-medium w-8">#</th>
                  <th className="text-left px-2 py-1 font-medium">Event Type</th>
                  <th className="text-left px-2 py-1 font-medium">Source</th>
                  <th className="text-left px-2 py-1 font-medium">Target</th>
                </tr>
              </thead>
              <tbody>
                {events.map((ev, i) => {
                  const sourceActor = actors.get(ev.sourceActorId);
                  const targetActor = ev.targetActorId ? actors.get(ev.targetActorId) : null;
                  const icon = sourceActor ? ACTOR_TYPE_ICONS[sourceActor.type] : '';
                  return (
                    <tr
                      key={ev.id}
                      className="border-b border-[var(--color-border)] hover:bg-[var(--color-surface-alt)] transition-colors"
                    >
                      <td className="px-2 py-1 font-mono text-[var(--color-text-tertiary)]">{i + 1}</td>
                      <td className="px-2 py-1">
                        <span
                          className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: 'var(--color-purple-light)', color: 'var(--color-purple)' }}
                        >
                          {ev.eventType}
                        </span>
                      </td>
                      <td className="px-2 py-1 text-[var(--color-text)]">
                        {icon} {ev.sourceActorName}
                      </td>
                      <td className="px-2 py-1 text-[var(--color-text-tertiary)]">
                        {targetActor ? targetActor.name : ev.targetActorName ?? '—'}
                      </td>
                    </tr>
                  );
                })}
                {events.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-[var(--color-text-tertiary)]">
                      No events yet. Trigger an event from the controls panel.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'messages' && (
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-[var(--color-surface-alt)] text-[var(--color-text-tertiary)] sticky top-0">
                  <th className="text-left px-2 py-1 font-medium">Time</th>
                  <th className="text-left px-2 py-1 font-medium">Source</th>
                  <th className="text-center px-1 py-1 font-medium">→</th>
                  <th className="text-left px-2 py-1 font-medium">Destination</th>
                  <th className="text-left px-2 py-1 font-medium">Message Type</th>
                  <th className="text-left px-2 py-1 font-medium">Channel</th>
                  <th className="text-right px-2 py-1 font-medium">Hop</th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => {
                  const pillStyle = getMessagePillStyle(entry.messageType);
                  const isSelected = entry.id === selectedEntryId;
                  return (
                    <tr
                      key={entry.id}
                      onClick={() => selectEntry(isSelected ? null : entry.id)}
                      className={`border-b border-[var(--color-border)] cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-[var(--color-brand-light)]'
                          : 'hover:bg-[var(--color-surface-alt)]'
                      }`}
                      style={isSelected ? { boxShadow: 'inset 3px 0 0 var(--color-brand)' } : undefined}
                    >
                      <td className="px-2 py-1 font-mono text-[var(--color-text-tertiary)]">
                        {formatTimestamp(entry.timestamp)}
                      </td>
                      <td className="px-2 py-1 text-[var(--color-text)]">{entry.from.name}</td>
                      <td className="px-1 py-1 text-center text-[var(--color-text-tertiary)]">→</td>
                      <td className="px-2 py-1 text-[var(--color-text)]">{entry.to.name}</td>
                      <td className="px-2 py-1">
                        <span
                          className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                          style={{ backgroundColor: pillStyle.bg, color: pillStyle.text }}
                        >
                          {entry.messageType}
                        </span>
                      </td>
                      <td className="px-2 py-1">
                        <span
                          className="inline-block text-[10px] px-1 py-0.5 rounded"
                          style={{
                            backgroundColor: entry.channel === 'direct' ? 'var(--color-teal-light)' : 'var(--color-surface-alt)',
                            color: entry.channel === 'direct' ? 'var(--color-teal)' : 'var(--color-text-tertiary)',
                          }}
                        >
                          {entry.channel}
                        </span>
                      </td>
                      <td className="px-2 py-1 text-right font-mono text-[var(--color-text-tertiary)]">
                        {entry.hopCount}/{entry.totalHops}
                      </td>
                    </tr>
                  );
                })}
                {filteredEntries.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-[var(--color-text-tertiary)]">
                      No messages yet. Trigger an event to see message hops.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'raw' && (
            <pre className="p-3 text-[10px] font-mono text-[var(--color-text-secondary)] whitespace-pre-wrap">
              {filteredEntries.length > 0
                ? JSON.stringify(filteredEntries, null, 2)
                : 'No data to display.'}
            </pre>
          )}

          {activeTab === 'metrics' && (
            <div className="p-3">
              {metrics ? (
                <div className="grid grid-cols-5 gap-3">
                  <MetricCard label="Total Hops" value={metrics.totalHops} />
                  <MetricCard label="Trust Hops" value={metrics.trustHops} />
                  <MetricCard label="Direct Hops" value={metrics.directHops} />
                  <MetricCard label="Unique Events" value={metrics.uniqueEvents} />
                  <MetricCard label="Avg Hops/Event" value={metrics.avgHopsPerEvent.toFixed(1)} />
                </div>
              ) : (
                <p className="text-xs text-[var(--color-text-tertiary)] text-center py-4">
                  No data yet.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border border-[var(--color-border)] bg-[var(--color-surface-alt)] p-2 text-center">
      <div className="text-lg font-bold text-[var(--color-text)]">{value}</div>
      <div className="text-[10px] text-[var(--color-text-tertiary)]">{label}</div>
    </div>
  );
}
