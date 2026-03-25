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
import { computeAllDirectChannels, computeProviderIdpTrustEdges } from '../../engine/PathFinder';

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
  const selectedActorId = useGraphStore((s) => s.selectedActorId);
  const selectActor = useGraphStore((s) => s.selectActor);
  const addActor = useGraphStore((s) => s.addActor);
  const removeActor = useGraphStore((s) => s.removeActor);
  const addEdge = useGraphStore((s) => s.addEdge);
  const addDirectChannel = useGraphStore((s) => s.addDirectChannel);
  const clearDirectChannels = useGraphStore((s) => s.clearDirectChannels);
  const setDirectChannels = useGraphStore((s) => s.setDirectChannels);
  const setProviderIdpEdges = useGraphStore((s) => s.setProviderIdpEdges);
  const clearProviderIdpEdges = useGraphStore((s) => s.clearProviderIdpEdges);

  const approach = useSimulationStore((s) => s.approach);
  const speed = useSimulationStore((s) => s.speed);
  const isPlaying = useSimulationStore((s) => s.isPlaying);
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
  const addEvent = useEventLogStore((s) => s.addEvent);
  const clearAll = useEventLogStore((s) => s.clearAll);
  const clearMessages = useEventLogStore((s) => s.clearMessages);
  const incrementMessageCounts = useSimulationStore((s) => s.incrementMessageCounts);
  const resetMessageCounts = useSimulationStore((s) => s.resetMessageCounts);

  const [addForm, setAddForm] = useState<AddActorForm | null>(null);
  const [hoveredActorId, setHoveredActorId] = useState<string | null>(null);
  const [eventSource, setEventSource] = useState<string>('');
  const [networkTarget, setNetworkTarget] = useState<string>('');
  const compareAbortRef = useRef(false);
  const playbackAbortRef = useRef(false);

  const actorList = useMemo(() => Array.from(actors.values()), [actors]);
  const networks = useMemo(() => actorList.filter((a) => a.type === 'network'), [actorList]);
  const sourceActor = actors.get(eventSource) ?? null;

  // Sync direct channels: present in Direct mode, absent in Routed mode
  const syncDirectChannelsNow = useCallback(() => {
    const currentApproach = useSimulationStore.getState().approach;
    const { actors: a, edges: e } = useGraphStore.getState();
    if (currentApproach === 'direct') {
      const channels = computeAllDirectChannels({ actors: a, edges: e });
      setDirectChannels(channels);
      const idpEdges = computeProviderIdpTrustEdges(channels, { actors: a, edges: e });
      setProviderIdpEdges(idpEdges);
    } else {
      clearDirectChannels();
      clearProviderIdpEdges();
    }
  }, [setDirectChannels, clearDirectChannels, setProviderIdpEdges, clearProviderIdpEdges]);

  // Automatically sync direct channels when approach or graph topology changes
  useEffect(() => {
    syncDirectChannelsNow();
  }, [approach, actors, edges, syncDirectChannelsNow]);

  // Find the edge between two actors (reads fresh state to work during animations)
  const findEdgeId = useCallback(
    (fromId: string, toId: string): string | null => {
      const { edges: currentEdges, directChannels: currentDC, providerIdpEdges: currentIdpEdges } = useGraphStore.getState();
      for (const edge of currentEdges.values()) {
        if (
          (edge.sourceId === fromId && edge.targetId === toId) ||
          (edge.sourceId === toId && edge.targetId === fromId)
        ) {
          return edge.id;
        }
      }
      for (const dc of currentDC.values()) {
        if (
          (dc.providerId === fromId && dc.clientId === toId) ||
          (dc.providerId === toId && dc.clientId === fromId)
        ) {
          return `dc-${dc.providerId}-${dc.clientId}`;
        }
      }
      for (const edge of currentIdpEdges.values()) {
        if (
          (edge.sourceId === fromId && edge.targetId === toId) ||
          (edge.sourceId === toId && edge.targetId === fromId)
        ) {
          return edge.id;
        }
      }
      return null;
    },
    [],
  );

  const runAnimation = useCallback(
    async (hops: NotificationHop[], onBeforeGroup?: (group: NotificationHop[]) => void) => {
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
        if (playbackAbortRef.current) break;

        onBeforeGroup?.(group);

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
    },
    [findEdgeId, addAnimatingEdge, removeAnimatingEdge, addAnimatingNode, removeAnimatingNode, incrementMessageCounts],
  );

  const triggerEventForApproach = useCallback(
    async (eventType: EventType, sourceId: string, forApproach: 'routed' | 'direct', targetId?: string, recordEvent = true) => {
      const { actors: currentActors, edges: currentEdges, directChannels: currentDC } = useGraphStore.getState();
      const graph = { actors: currentActors, edges: currentEdges };
      const event = {
        id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: eventType,
        sourceActorId: sourceId,
        targetActorId: targetId,
        timestamp: Date.now(),
      };

      // For new-care-relationship in direct mode, remove the provider's
      // pre-existing direct channels — they are established via the
      // direct-channel-handshake flow during this event
      if (forApproach === 'direct' && eventType === 'new-care-relationship') {
        const filtered = Array.from(currentDC.values()).filter(
          (ch) => ch.providerId !== sourceId,
        );
        setDirectChannels(filtered);
        setProviderIdpEdges(computeProviderIdpTrustEdges(filtered, graph));
      }

      if (recordEvent) {
        addEvent({
          id: event.id,
          eventType,
          sourceActorId: sourceId,
          sourceActorName: currentActors.get(sourceId)?.name || sourceId,
          targetActorId: targetId,
          targetActorName: targetId ? (currentActors.get(targetId)?.name || targetId) : undefined,
          timestamp: event.timestamp,
        });
      }

      // Re-read channels after potential removal
      const { directChannels: activeDC } = useGraphStore.getState();

      const hops =
        forApproach === 'routed'
          ? computeRoutedFlow(event, graph)
          : computeDirectFlow(event, graph, Array.from(activeDC.values()));

      const entries = hops.map((hop, i) => ({
        id: hop.id,
        eventId: event.id,
        timestamp: hop.timestamp,
        eventType: event.type,
        approach: forApproach,
        step: hop.step,
        from: {
          id: hop.fromId,
          type: currentActors.get(hop.fromId)?.type || '',
          name: currentActors.get(hop.fromId)?.name || hop.fromId,
        },
        to: {
          id: hop.toId,
          type: currentActors.get(hop.toId)?.type || '',
          name: currentActors.get(hop.toId)?.name || hop.toId,
        },
        channel: hop.channel,
        messageType: hop.messageType,
        hopCount: i + 1,
        totalHops: hops.length,
      }));

      addEntries(entries);
      setActiveHops(hops);
      setPendingHops([...hops]);

      // For new-care-relationship in direct mode, create the direct
      // channels right before the handshake step so the relationship
      // edges appear on the graph as the handshake is exchanged.
      let onBeforeGroup: ((group: NotificationHop[]) => void) | undefined;
      if (forApproach === 'direct' && eventType === 'new-care-relationship') {
        let channelsCreated = false;
        onBeforeGroup = (group: NotificationHop[]) => {
          if (channelsCreated) return;
          if (group.some((h) => h.messageType === 'direct-channel-handshake')) {
            channelsCreated = true;
            const newChannels = getNewDirectChannels(event, graph);
            newChannels.forEach((ch) => addDirectChannel(ch));
            const { directChannels: updatedDC } = useGraphStore.getState();
            setProviderIdpEdges(computeProviderIdpTrustEdges(Array.from(updatedDC.values()), graph));
          }
        };
      }

      await runAnimation(hops, onBeforeGroup);

      // After animation, add any new direct channels established by this event
      // (skip new-care-relationship — channels were already created above)
      if (forApproach === 'direct' && eventType !== 'new-care-relationship') {
        const newChannels = getNewDirectChannels(event, graph);
        newChannels.forEach((ch) => addDirectChannel(ch));
        const { directChannels: updatedDC } = useGraphStore.getState();
        const idpEdges = computeProviderIdpTrustEdges(Array.from(updatedDC.values()), graph);
        setProviderIdpEdges(idpEdges);
      }
    },
    [addEntries, addEvent, setActiveHops, setPendingHops, addDirectChannel, setDirectChannels, setProviderIdpEdges, runAnimation],
  );

  const triggerEvent = useCallback(
    async (eventType: EventType, sourceId: string, targetId?: string) => {
      if (isPlaying) return;
      playbackAbortRef.current = false;
      setPlaying(true);
      resetMessageCounts();
      clearMessages();
      await triggerEventForApproach(eventType, sourceId, approach, targetId, true);
      setPlaying(false);
    },
    [isPlaying, approach, triggerEventForApproach, setPlaying, resetMessageCounts, clearMessages],
  );

  const replayAllEvents = useCallback(
    async (forApproach?: 'routed' | 'direct') => {
      const events = useEventLogStore.getState().events;
      if (events.length === 0) return;

      playbackAbortRef.current = false;
      const targetApproach = forApproach ?? useSimulationStore.getState().approach;
      resetMessageCounts();
      clearMessages();
      // Clear channels so they build up incrementally as events are replayed
      clearDirectChannels();
      clearProviderIdpEdges();
      setPlaying(true);

      for (const ev of events) {
        if (playbackAbortRef.current) break;
        await triggerEventForApproach(ev.eventType, ev.sourceActorId, targetApproach, ev.targetActorId, false);
        if (!playbackAbortRef.current && events.indexOf(ev) < events.length - 1) {
          await new Promise((r) => setTimeout(r, 300 / useSimulationStore.getState().speed));
        }
      }

      setPlaying(false);
    },
    [triggerEventForApproach, resetMessageCounts, clearMessages, clearDirectChannels, clearProviderIdpEdges, setPlaying],
  );

  const handleAddActorSubmit = useCallback(() => {
    if (!addForm || !addForm.name.trim()) return;
    const id = `${addForm.type}-${Date.now()}`;
    const actor: Actor = {
      id,
      name: addForm.name.trim(),
      type: addForm.type,
    };
    const hasNetwork =
      (addForm.type === 'client-patient' || addForm.type === 'client-delegated' || addForm.type === 'provider') &&
      addForm.networkId;
    if (hasNetwork) {
      actor.networkId = addForm.networkId;
    }
    addActor(actor);

    // Auto-create trust edge to the selected network
    if (hasNetwork) {
      addEdge({
        id: `e-${id}-${addForm.networkId}`,
        sourceId: id,
        targetId: addForm.networkId,
        edgeType: 'trust',
      });
    }
    setAddForm(null);

    // Trigger event to establish relationships via existing channels
    if (hasNetwork && !isPlaying) {
      syncDirectChannelsNow();
      const currentApproach = useSimulationStore.getState().approach;
      playbackAbortRef.current = false;
      setPlaying(true);
      resetMessageCounts();
      clearMessages();
      const triggerAndFinish = async () => {
        if (actor.type === 'provider') {
          await triggerEventForApproach('new-care-relationship', id, currentApproach);
        } else if (actor.type === 'client-patient' || actor.type === 'client-delegated') {
          await triggerEventForApproach('new-client-registration', id, currentApproach);
        }
        setPlaying(false);
      };
      triggerAndFinish();
    }
  }, [addForm, addActor, addEdge, isPlaying, syncDirectChannelsNow, triggerEventForApproach, setPlaying, resetMessageCounts, clearMessages]);

  const needsNetwork = addForm
    ? ['client-patient', 'client-delegated', 'provider'].includes(addForm.type)
    : false;

  const startCompareLoop = useCallback(() => {
    const events = useEventLogStore.getState().events;
    if (events.length === 0) return;

    compareAbortRef.current = false;
    playbackAbortRef.current = false;
    setCompare({
      active: true,
      eventType: null,
      sourceId: '',
      currentApproach: 'routed',
    });
    setApproach('routed');
  }, [setCompare, setApproach]);

  const stopCompareLoop = useCallback(() => {
    compareAbortRef.current = true;
    playbackAbortRef.current = true;
    setCompare({ active: false });
    setPlaying(false);
  }, [setCompare, setPlaying]);

  // Run the compare loop when active — replays all events, alternating approaches
  useEffect(() => {
    if (!compare.active) return;
    if (isPlaying) return;
    if (compareAbortRef.current) return;

    const events = useEventLogStore.getState().events;
    if (events.length === 0) return;

    const currentApproach = compare.currentApproach;
    const pauseMs = 1500 / useSimulationStore.getState().speed;

    const timer = setTimeout(async () => {
      if (compareAbortRef.current || !useSimulationStore.getState().compare.active) return;

      setApproach(currentApproach);
      await replayAllEvents(currentApproach);

      // After replay completes, flip approach for next iteration
      if (!compareAbortRef.current && useSimulationStore.getState().compare.active) {
        const nextApproach = currentApproach === 'routed' ? 'direct' : 'routed';
        setCompare({ currentApproach: nextApproach });
      }
    }, pauseMs);

    return () => clearTimeout(timer);
  }, [compare.active, compare.currentApproach, isPlaying, setApproach, setCompare, replayAllEvents]);

  const eventCount = useEventLogStore((s) => s.events.length);
  const canCompare = eventCount > 0;

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
              disabled={eventCount === 0 && !isPlaying}
              onClick={() => {
                if (isPlaying) {
                  playbackAbortRef.current = true;
                  compareAbortRef.current = true;
                  setPlaying(false);
                } else {
                  replayAllEvents();
                }
              }}
              className={`p-2 rounded-full transition-colors ${
                eventCount === 0 && !isPlaying
                  ? 'bg-[var(--color-border)] text-[var(--color-text-tertiary)] cursor-not-allowed'
                  : 'bg-[var(--color-brand)] text-white hover:bg-[var(--color-brand-dark)]'
              }`}
              title={isPlaying ? 'Stop' : 'Replay all events'}
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <button
              className="p-1.5 rounded hover:bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)]
                transition-colors opacity-30 cursor-not-allowed"
              title="Step Forward"
              disabled
            >
              <SkipForward size={14} />
            </button>
          </div>

          <button
            onClick={() => { stopCompareLoop(); simulationReset(); clearAll(); }}
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
                {canCompare ? 'Auto-loop between Routed & Direct' : 'Trigger events first to compare'}
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
