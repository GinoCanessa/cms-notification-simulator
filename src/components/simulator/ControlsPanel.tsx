import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  X,
  Edit2,
  Plus,
  ChevronDown,
  ChevronRight,
  Repeat,
  RotateCcw,
} from 'lucide-react';
import { useGraphStore } from '../../stores/graphStore';
import { useSimulationStore } from '../../stores/simulationStore';
import { useEventLogStore } from '../../stores/eventLogStore';
import {
  ACTOR_TYPE_LABELS,
  ACTOR_TYPE_ICONS,
  type ActorType,
  type EventType,
  type NotificationHop,
  type Actor,
} from '../../types';
import { computeRoutedFlow } from '../../engine/RoutedEngine';
import { computeDirectFlow, getNewDirectChannels } from '../../engine/DirectEngine';

interface AddActorForm {
  type: ActorType;
  name: string;
  networkId: string;
}

const ACTOR_CHIPS: { type: ActorType; label: string }[] = [
  { type: 'client-patient', label: '+ Patient' },
  { type: 'client-delegated', label: '+ Delegated' },
  { type: 'idp', label: '+ IDP' },
  { type: 'network', label: '+ Network' },
  { type: 'provider', label: '+ Provider' },
];

function CollapsibleSection({
  title,
  badge,
  defaultOpen = true,
  children,
}: {
  title: string;
  badge?: string | number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[var(--color-border)]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-1 px-3 py-2 text-xs font-semibold
          text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] transition-colors"
      >
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
        <span>{title}</span>
        {badge !== undefined && (
          <span className="ml-auto text-[10px] font-normal opacity-60">{badge}</span>
        )}
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}

export default function ControlsPanel() {
  const actors = useGraphStore((s) => s.actors);
  const edges = useGraphStore((s) => s.edges);
  const directChannels = useGraphStore((s) => s.directChannels);
  const selectedActorId = useGraphStore((s) => s.selectedActorId);
  const selectActor = useGraphStore((s) => s.selectActor);
  const addActor = useGraphStore((s) => s.addActor);
  const removeActor = useGraphStore((s) => s.removeActor);
  const addDirectChannel = useGraphStore((s) => s.addDirectChannel);
  const clearDirectChannels = useGraphStore((s) => s.clearDirectChannels);

  const approach = useSimulationStore((s) => s.approach);
  const speed = useSimulationStore((s) => s.speed);
  const isPlaying = useSimulationStore((s) => s.isPlaying);
  const pendingHops = useSimulationStore((s) => s.pendingHops);
  const compare = useSimulationStore((s) => s.compare);
  const setApproach = useSimulationStore((s) => s.setApproach);
  const setSpeed = useSimulationStore((s) => s.setSpeed);
  const setPlaying = useSimulationStore((s) => s.setPlaying);
  const setActiveHops = useSimulationStore((s) => s.setActiveHops);
  const setPendingHops = useSimulationStore((s) => s.setPendingHops);
  const addAnimatingEdge = useSimulationStore((s) => s.addAnimatingEdge);
  const removeAnimatingEdge = useSimulationStore((s) => s.removeAnimatingEdge);
  const addAnimatingNode = useSimulationStore((s) => s.addAnimatingNode);
  const removeAnimatingNode = useSimulationStore((s) => s.removeAnimatingNode);
  const setCompare = useSimulationStore((s) => s.setCompare);
  const simulationReset = useSimulationStore((s) => s.reset);

  const addEntries = useEventLogStore((s) => s.addEntries);
  const clearLog = useEventLogStore((s) => s.clearLog);
  const incrementMessageCounts = useSimulationStore((s) => s.incrementMessageCounts);
  const resetMessageCounts = useSimulationStore((s) => s.resetMessageCounts);

  const [addForm, setAddForm] = useState<AddActorForm | null>(null);
  const [hoveredActorId, setHoveredActorId] = useState<string | null>(null);
  const [eventSource, setEventSource] = useState<string>('');
  const [networkTarget, setNetworkTarget] = useState<string>('');
  const compareAbortRef = useRef(false);

  const actorList = useMemo(() => Array.from(actors.values()), [actors]);
  const networks = useMemo(() => actorList.filter((a) => a.type === 'network'), [actorList]);
  const sourceActor = actors.get(eventSource) ?? null;

  // Find the edge between two actors (trust or direct channel)
  const findEdgeId = useCallback(
    (fromId: string, toId: string): string | null => {
      for (const edge of edges.values()) {
        if (
          (edge.sourceId === fromId && edge.targetId === toId) ||
          (edge.sourceId === toId && edge.targetId === fromId)
        ) {
          return edge.id;
        }
      }
      for (const dc of directChannels.values()) {
        if (
          (dc.providerId === fromId && dc.clientId === toId) ||
          (dc.providerId === toId && dc.clientId === fromId)
        ) {
          return `dc-${dc.providerId}-${dc.clientId}`;
        }
      }
      return null;
    },
    [edges, directChannels],
  );

  const runAnimation = useCallback(
    async (hops: NotificationHop[]) => {
      setPlaying(true);
      const currentSpeed = useSimulationStore.getState().speed;
      const hopDuration = 500 / currentSpeed;

      // Group hops by step
      const groups: NotificationHop[][] = [];
      let currentStep = -1;
      for (const hop of hops) {
        if (hop.step !== currentStep) {
          groups.push([]);
          currentStep = hop.step;
        }
        groups[groups.length - 1].push(hop);
      }

      for (const group of groups) {
        // Collect unique sender and receiver IDs involved in this group
        const senderIds: string[] = [];
        const receiverIds: string[] = [];
        for (const hop of group) {
          senderIds.push(hop.fromId);
          receiverIds.push(hop.toId);
          const edgeId = findEdgeId(hop.fromId, hop.toId);
          if (edgeId) addAnimatingEdge(edgeId);
          addAnimatingNode(hop.toId);
        }
        incrementMessageCounts(senderIds, receiverIds);

        await new Promise((resolve) => setTimeout(resolve, hopDuration));

        for (const hop of group) {
          const edgeId = findEdgeId(hop.fromId, hop.toId);
          if (edgeId) removeAnimatingEdge(edgeId);
        }

        await new Promise((resolve) => setTimeout(resolve, 200 / currentSpeed));

        for (const hop of group) {
          removeAnimatingNode(hop.toId);
        }
      }

      setPlaying(false);
    },
    [findEdgeId, addAnimatingEdge, removeAnimatingEdge, addAnimatingNode, removeAnimatingNode, setPlaying, incrementMessageCounts],
  );

  const triggerEventForApproach = useCallback(
    async (eventType: EventType, sourceId: string, forApproach: 'routed' | 'direct', targetId?: string) => {
      const graph = { actors, edges };
      const event = {
        id: `evt-${Date.now()}`,
        type: eventType,
        sourceActorId: sourceId,
        targetActorId: targetId,
        timestamp: Date.now(),
      };

      // Reset message counts at the start of each workflow
      resetMessageCounts();

      const hops =
        forApproach === 'routed'
          ? computeRoutedFlow(event, graph)
          : computeDirectFlow(event, graph, Array.from(directChannels.values()));

      const entries = hops.map((hop, i) => ({
        id: hop.id,
        eventId: event.id,
        timestamp: hop.timestamp,
        eventType: event.type,
        approach: forApproach,
        step: hop.step,
        from: {
          id: hop.fromId,
          type: actors.get(hop.fromId)?.type || '',
          name: actors.get(hop.fromId)?.name || hop.fromId,
        },
        to: {
          id: hop.toId,
          type: actors.get(hop.toId)?.type || '',
          name: actors.get(hop.toId)?.name || hop.toId,
        },
        channel: hop.channel,
        messageType: hop.messageType,
        hopCount: i + 1,
        totalHops: hops.length,
      }));

      addEntries(entries);
      setActiveHops(hops);
      setPendingHops([...hops]);

      if (forApproach === 'direct') {
        const newChannels = getNewDirectChannels(event, graph);
        newChannels.forEach((ch) => addDirectChannel(ch));
      }

      await runAnimation(hops);
    },
    [actors, edges, directChannels, addEntries, setActiveHops, setPendingHops, addDirectChannel, runAnimation, resetMessageCounts],
  );

  const triggerEvent = useCallback(
    (eventType: EventType, sourceId: string, targetId?: string) => {
      if (isPlaying) return;
      triggerEventForApproach(eventType, sourceId, approach, targetId);
    },
    [isPlaying, approach, triggerEventForApproach],
  );

  const handleAddActorSubmit = useCallback(() => {
    if (!addForm || !addForm.name.trim()) return;
    const id = `${addForm.type}-${Date.now()}`;
    const actor: Actor = {
      id,
      name: addForm.name.trim(),
      type: addForm.type,
    };
    if (
      (addForm.type === 'client-patient' || addForm.type === 'client-delegated' || addForm.type === 'provider') &&
      addForm.networkId
    ) {
      actor.networkId = addForm.networkId;
    }
    addActor(actor);
    setAddForm(null);
  }, [addForm, addActor]);

  const needsNetwork = addForm
    ? ['client-patient', 'client-delegated', 'provider'].includes(addForm.type)
    : false;

  const startCompareLoop = useCallback(() => {
    if (!eventSource) return;
    const sourceActor = actors.get(eventSource);
    if (!sourceActor) return;

    // Determine which event type to use based on actor type
    let eventType: EventType;
    if (sourceActor.type === 'provider') {
      eventType = 'encounter-update';
    } else if (sourceActor.type === 'client-patient' || sourceActor.type === 'client-delegated') {
      eventType = 'new-client-registration';
    } else if (sourceActor.type === 'network') {
      if (!networkTarget) return;
      eventType = 'new-network-peer';
    } else {
      return;
    }

    compareAbortRef.current = false;
    setCompare({
      active: true,
      eventType,
      sourceId: eventSource,
      targetId: sourceActor.type === 'network' ? networkTarget : undefined,
      currentApproach: 'routed',
    });
    setApproach('routed');
  }, [eventSource, networkTarget, actors, setCompare, setApproach]);

  const stopCompareLoop = useCallback(() => {
    compareAbortRef.current = true;
    setCompare({ active: false });
    setPlaying(false);
  }, [setCompare, setPlaying]);

  // Run the compare loop when active
  useEffect(() => {
    if (!compare.active || !compare.eventType || !compare.sourceId) return;
    if (isPlaying) return; // wait for current animation to finish

    // If aborted, bail out
    if (compareAbortRef.current) return;

    const currentApproach = compare.currentApproach;
    const pauseMs = 1500 / useSimulationStore.getState().speed;

    const timer = setTimeout(async () => {
      if (compareAbortRef.current || !useSimulationStore.getState().compare.active) return;

      setApproach(currentApproach);
      setCompare({ currentApproach });

      await triggerEventForApproach(
        compare.eventType!,
        compare.sourceId,
        currentApproach,
        compare.targetId,
      );

      // After animation completes, flip approach for next iteration
      if (!compareAbortRef.current && useSimulationStore.getState().compare.active) {
        const nextApproach = currentApproach === 'routed' ? 'direct' : 'routed';
        setCompare({ currentApproach: nextApproach });
      }
    }, pauseMs);

    return () => clearTimeout(timer);
  }, [compare.active, compare.eventType, compare.sourceId, compare.targetId, compare.currentApproach, isPlaying, setApproach, setCompare, triggerEventForApproach]);

  const hasSource = !!eventSource && !!actors.get(eventSource);
  const canCompare = hasSource && (actors.get(eventSource)?.type !== 'network' || !!networkTarget);

  return (
    <div
      className="w-60 flex-shrink-0 flex flex-col overflow-y-auto border-r
        bg-[var(--color-surface)] border-[var(--color-border)]"
    >
      {/* Approach toggle */}
      <div className="px-3 py-2 border-b border-[var(--color-border)]">
        <label className="text-[10px] font-semibold uppercase tracking-wide text-[var(--color-text-tertiary)]">
          Approach
        </label>
        <div className="flex mt-1 rounded overflow-hidden border border-[var(--color-border)]">
          <button
            onClick={() => setApproach('routed')}
            className={`flex-1 text-xs py-1 font-medium transition-colors ${
              approach === 'routed'
                ? 'bg-[var(--color-brand)] text-white'
                : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
            }`}
          >
            Routed
          </button>
          <button
            onClick={() => setApproach('direct')}
            className={`flex-1 text-xs py-1 font-medium transition-colors ${
              approach === 'direct'
                ? 'bg-[var(--color-brand)] text-white'
                : 'bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
            }`}
          >
            Direct
          </button>
        </div>
      </div>

      {/* Section 1: Actors */}
      <CollapsibleSection title="Actors" badge={actorList.length}>
        <div className="space-y-0.5">
          {actorList.map((actor) => (
            <div
              key={actor.id}
              className={`flex items-center gap-2 px-2 py-1 rounded text-xs cursor-pointer transition-colors group ${
                selectedActorId === actor.id
                  ? 'bg-[var(--color-brand-light)] text-[var(--color-brand)]'
                  : 'hover:bg-[var(--color-surface-alt)] text-[var(--color-text)]'
              }`}
              onClick={() => selectActor(actor.id)}
              onMouseEnter={() => setHoveredActorId(actor.id)}
              onMouseLeave={() => setHoveredActorId(null)}
            >
              <span className="text-sm">{ACTOR_TYPE_ICONS[actor.type]}</span>
              <div className="flex-1 min-w-0">
                <div className="truncate font-medium">{actor.name}</div>
                <div className="text-[10px] opacity-50">{ACTOR_TYPE_LABELS[actor.type]}</div>
              </div>
              {hoveredActorId === actor.id && (
                <div className="flex items-center gap-0.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Edit functionality placeholder
                    }}
                    className="p-0.5 rounded hover:bg-[var(--color-border)] text-[var(--color-text-tertiary)]"
                    title="Edit"
                  >
                    <Edit2 size={11} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeActor(actor.id);
                    }}
                    className="p-0.5 rounded hover:bg-[var(--color-danger-light)] text-[var(--color-danger)]"
                    title="Remove"
                  >
                    <X size={11} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Add actor chips */}
        <div className="flex flex-wrap gap-1 mt-2">
          {ACTOR_CHIPS.map((chip) => (
            <button
              key={chip.type}
              onClick={() => setAddForm({ type: chip.type, name: '', networkId: '' })}
              className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded
                border border-dashed border-[var(--color-border)] text-[var(--color-text-secondary)]
                hover:border-[var(--color-brand)] hover:text-[var(--color-brand)] transition-colors"
            >
              <Plus size={9} />
              {chip.label}
            </button>
          ))}
        </div>

        {/* Inline add form */}
        {addForm && (
          <div className="mt-2 p-2 rounded border border-[var(--color-border)] bg-[var(--color-surface-alt)]">
            <input
              autoFocus
              type="text"
              placeholder={`${ACTOR_TYPE_LABELS[addForm.type]} name`}
              value={addForm.name}
              onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddActorSubmit();
                if (e.key === 'Escape') setAddForm(null);
              }}
              className="w-full text-xs px-2 py-1 rounded border border-[var(--color-border)]
                bg-[var(--color-surface)] text-[var(--color-text)] outline-none
                focus:border-[var(--color-brand)]"
            />
            {needsNetwork && (
              <select
                value={addForm.networkId}
                onChange={(e) => setAddForm({ ...addForm, networkId: e.target.value })}
                className="w-full mt-1 text-xs px-2 py-1 rounded border border-[var(--color-border)]
                  bg-[var(--color-surface)] text-[var(--color-text)] outline-none"
              >
                <option value="">No network</option>
                {networks.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.name}
                  </option>
                ))}
              </select>
            )}
            <div className="flex justify-end gap-1 mt-1">
              <button
                onClick={() => setAddForm(null)}
                className="text-[10px] px-2 py-0.5 rounded text-[var(--color-text-secondary)]
                  hover:bg-[var(--color-border)]"
              >
                Cancel
              </button>
              <button
                onClick={handleAddActorSubmit}
                className="text-[10px] px-2 py-0.5 rounded bg-[var(--color-brand)] text-white
                  hover:bg-[var(--color-brand-dark)]"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </CollapsibleSection>

      {/* Section 2: Trigger Event */}
      <CollapsibleSection title="Trigger Event">
        <div className="space-y-2">
          <select
            value={eventSource}
            onChange={(e) => {
              setEventSource(e.target.value);
              setNetworkTarget('');
            }}
            className="w-full text-xs px-2 py-1 rounded border border-[var(--color-border)]
              bg-[var(--color-surface)] text-[var(--color-text)] outline-none"
          >
            <option value="">Select source actor…</option>
            {actorList
              .filter((a) => ['provider', 'client-patient', 'client-delegated', 'network'].includes(a.type))
              .map((a) => (
                <option key={a.id} value={a.id}>
                  {ACTOR_TYPE_ICONS[a.type]} {a.name}
                </option>
              ))}
          </select>

          {sourceActor && (
            <div className="space-y-1">
              {sourceActor.type === 'provider' && (
                <>
                  <EventButton
                    label="Encounter Update"
                    disabled={isPlaying}
                    onClick={() => triggerEvent('encounter-update', eventSource)}
                  />
                  <EventButton
                    label="New Care Relationship"
                    disabled={isPlaying}
                    onClick={() => triggerEvent('new-care-relationship', eventSource)}
                  />
                </>
              )}
              {(sourceActor.type === 'client-patient' || sourceActor.type === 'client-delegated') && (
                <EventButton
                  label="New Client Registration"
                  disabled={isPlaying}
                  onClick={() => triggerEvent('new-client-registration', eventSource)}
                />
              )}
              {sourceActor.type === 'network' && (
                <>
                  <div className="flex items-center gap-1">
                    <select
                      value={networkTarget}
                      onChange={(e) => setNetworkTarget(e.target.value)}
                      className="flex-1 text-[10px] px-1 py-0.5 rounded border border-[var(--color-border)]
                        bg-[var(--color-surface)] text-[var(--color-text)] outline-none"
                    >
                      <option value="">Peer network…</option>
                      {networks
                        .filter((n) => n.id !== eventSource)
                        .map((n) => (
                          <option key={n.id} value={n.id}>
                            {n.name}
                          </option>
                        ))}
                    </select>
                  </div>
                  <EventButton
                    label="New Network Peer"
                    disabled={isPlaying || !networkTarget}
                    onClick={() => triggerEvent('new-network-peer', eventSource, networkTarget)}
                  />
                </>
              )}
              <EventButton
                label="New Provider Registration"
                disabled={isPlaying || sourceActor.type !== 'provider'}
                onClick={() => triggerEvent('new-provider-registration', eventSource)}
              />
            </div>
          )}
        </div>
      </CollapsibleSection>

      {/* Section 3: Playback */}
      <CollapsibleSection title="Playback">
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => { stopCompareLoop(); simulationReset(); }}
              className="p-1.5 rounded hover:bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]
                transition-colors"
              title="Reset"
            >
              <SkipBack size={14} />
            </button>
            <button
              disabled={pendingHops.length === 0 && !isPlaying}
              onClick={() => setPlaying(!isPlaying)}
              className={`p-2 rounded-full transition-colors ${
                pendingHops.length === 0 && !isPlaying
                  ? 'bg-[var(--color-border)] text-[var(--color-text-tertiary)] cursor-not-allowed'
                  : 'bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-dark)]'
              }`}
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              className="p-1.5 rounded hover:bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]
                transition-colors"
              title="Step Forward"
            >
              <SkipForward size={14} />
            </button>
          </div>

          <button
            onClick={() => { stopCompareLoop(); simulationReset(); clearLog(); clearDirectChannels(); }}
            disabled={isPlaying}
            className={`w-full flex items-center justify-center gap-1.5 text-xs px-2 py-1.5 rounded
              border transition-colors ${
              isPlaying
                ? 'border-[var(--color-border)] text-[var(--color-text-tertiary)] bg-[var(--color-surface-alt)] cursor-not-allowed opacity-50'
                : 'border-[var(--color-border)] text-[var(--color-text-secondary)] bg-[var(--color-surface-alt)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]'
            }`}
            title="Reset all events, logs, and message counts without removing actors"
          >
            <RotateCcw size={12} />
            Reset Events
          </button>
          <div className="pt-1 border-t border-[var(--color-border)]">
            <button
              disabled={!canCompare && !compare.active}
              onClick={() => compare.active ? stopCompareLoop() : startCompareLoop()}
              className={`w-full flex items-center justify-center gap-1.5 text-xs px-2 py-1.5 rounded
                border transition-colors ${
                compare.active
                  ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)] hover:bg-[var(--color-brand-dark)]'
                  : !canCompare
                    ? 'border-[var(--color-border)] text-[var(--color-text-tertiary)] bg-[var(--color-surface-alt)] cursor-not-allowed opacity-50'
                    : 'border-[var(--color-border)] text-[var(--color-text-secondary)] bg-[var(--color-surface-alt)] hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]'
              }`}
            >
              <Repeat size={12} />
              {compare.active ? 'Stop Compare' : 'Compare Loop'}
            </button>
            {compare.active && (
              <div className="mt-1 text-[10px] text-center text-[var(--color-text-tertiary)]">
                Showing: <span className="font-semibold text-[var(--color-brand)]">{compare.currentApproach}</span>
              </div>
            )}
            {!compare.active && (
              <div className="mt-1 text-[10px] text-center text-[var(--color-text-tertiary)]">
                {canCompare ? 'Auto-loop between Routed & Direct' : 'Select a source actor first'}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between text-[10px] text-[var(--color-text-tertiary)] mb-1">
              <span>Speed</span>
              <span className="font-mono">{speed.toFixed(1)}×</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={5}
              step={0.5}
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full h-1 accent-[var(--color-brand)]"
            />
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
}

function EventButton({
  label,
  disabled,
  onClick,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="w-full text-left text-xs px-2 py-1.5 rounded border border-[var(--color-border)]
        bg-[var(--color-surface-alt)] text-[var(--color-text)]
        hover:border-[var(--color-brand)] hover:text-[var(--color-brand)]
        disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {label}
    </button>
  );
}
