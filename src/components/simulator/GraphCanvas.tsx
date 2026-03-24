import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ReactFlow,
  Background,
  MiniMap,
  Controls,
  type Node,
  type Edge,
  type OnConnect,
  type Connection,
  type NodeChange,
  BackgroundVariant,
} from '@xyflow/react';
import { useGraphStore } from '../../stores/graphStore';
import { useSimulationStore } from '../../stores/simulationStore';
import type { ActorType } from '../../types';

import ProviderNode from '../graph/nodes/ProviderNode';
import NetworkNode from '../graph/nodes/NetworkNode';
import ClientPatientNode from '../graph/nodes/ClientPatientNode';
import ClientDelegatedNode from '../graph/nodes/ClientDelegatedNode';
import IdpNode from '../graph/nodes/IdpNode';

import TrustEdge from '../graph/edges/TrustEdge';
import DirectEdge from '../graph/edges/DirectEdge';
import IdentityEdge from '../graph/edges/IdentityEdge';

const nodeTypes = {
  provider: ProviderNode,
  network: NetworkNode,
  'client-patient': ClientPatientNode,
  'client-delegated': ClientDelegatedNode,
  idp: IdpNode,
};

const edgeTypes = {
  trust: TrustEdge,
  direct: DirectEdge,
  identity: IdentityEdge,
};

const CLIENT_TYPES: ActorType[] = ['client-patient', 'client-delegated'];

function isValidConnection(sourceType: ActorType, targetType: ActorType): boolean {
  const pair = [sourceType, targetType].sort().join('|');
  const allowed = new Set([
    'client-delegated|network',
    'client-patient|network',
    'network|provider',
    'network|network',
    'client-delegated|idp',
    'client-patient|idp',
  ]);
  return allowed.has(pair);
}

function determineEdgeType(sourceType: ActorType, targetType: ActorType): 'trust' | 'identity' {
  if (
    (sourceType === 'idp' && CLIENT_TYPES.includes(targetType)) ||
    (targetType === 'idp' && CLIENT_TYPES.includes(sourceType))
  ) {
    return 'identity';
  }
  return 'trust';
}

export default function GraphCanvas() {
  const actors = useGraphStore((s) => s.actors);
  const edges = useGraphStore((s) => s.edges);
  const directChannels = useGraphStore((s) => s.directChannels);
  const selectActor = useGraphStore((s) => s.selectActor);
  const addEdge = useGraphStore((s) => s.addEdge);

  const animatingEdges = useSimulationStore((s) => s.animatingEdges);
  const animatingNodes = useSimulationStore((s) => s.animatingNodes);

  const [positions, setPositions] = useState<Record<string, { x: number; y: number }>>({});

  // Sync positions when actors appear without positions (e.g. preset load or new actors)
  useEffect(() => {
    setPositions((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const actor of actors.values()) {
        if (!next[actor.id]) {
          next[actor.id] = { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 };
          changed = true;
        }
      }
      // Remove positions for actors that no longer exist
      for (const id of Object.keys(next)) {
        if (!actors.has(id)) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [actors]);

  /** Called by SimulatorPage / ControlsPanel to set preset positions */
  // Expose via a stable setter so parent can initialize positions
  const setPresetPositions = useCallback((p: Record<string, { x: number; y: number }>) => {
    setPositions(p);
  }, []);

  // Attach to window for SimulatorPage to call
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__setGraphPositions = setPresetPositions;
    return () => {
      delete (window as unknown as Record<string, unknown>).__setGraphPositions;
    };
  }, [setPresetPositions]);

  const flowNodes: Node[] = useMemo(() => {
    return Array.from(actors.values()).map((actor) => ({
      id: actor.id,
      type: actor.type,
      position: positions[actor.id] ?? { x: 0, y: 0 },
      data: {
        label: actor.name,
        shortId: actor.id.split('-').pop()?.toUpperCase() ?? actor.id,
        isAnimating: animatingNodes.has(actor.id),
      },
    }));
  }, [actors, positions, animatingNodes]);

  const flowEdges: Edge[] = useMemo(() => {
    const result: Edge[] = [];

    for (const edge of edges.values()) {
      result.push({
        id: edge.id,
        source: edge.sourceId,
        target: edge.targetId,
        type: edge.edgeType === 'trust' || edge.edgeType === 'trust-active' ? 'trust'
            : edge.edgeType === 'direct' || edge.edgeType === 'direct-active' ? 'direct'
            : edge.edgeType === 'identity' ? 'identity'
            : 'trust',
        data: { isActive: animatingEdges.has(edge.id) },
      });
    }

    for (const dc of directChannels.values()) {
      const dcEdgeId = `dc-${dc.providerId}-${dc.clientId}`;
      // Avoid duplicating if the same id exists in edges
      if (!edges.has(dcEdgeId)) {
        result.push({
          id: dcEdgeId,
          source: dc.providerId,
          target: dc.clientId,
          type: 'direct',
          data: { isActive: animatingEdges.has(dcEdgeId) },
        });
      }
    }

    return result;
  }, [edges, directChannels, animatingEdges]);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      // Apply react-flow node changes (drag, select, etc.)
      // We only care about position changes to persist in our state
      for (const change of changes) {
        if (change.type === 'position' && change.position) {
          setPositions((prev) => ({
            ...prev,
            [change.id]: change.position!,
          }));
        }
      }
      // We need to still let react-flow process changes for proper rendering
      // Using applyNodeChanges through a dummy to keep controlled mode working
    },
    [],
  );

  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: Node) => {
      selectActor(node.id);
    },
    [selectActor],
  );

  const onPaneClick = useCallback(() => {
    selectActor(null);
  }, [selectActor]);

  const onConnect: OnConnect = useCallback(
    (connection: Connection) => {
      const sourceActor = actors.get(connection.source);
      const targetActor = actors.get(connection.target);
      if (!sourceActor || !targetActor) return;

      if (!isValidConnection(sourceActor.type, targetActor.type)) return;

      const edgeType = determineEdgeType(sourceActor.type, targetActor.type);
      const edgeId = `e-${connection.source}-${connection.target}`;

      // Check for duplicate
      for (const existing of edges.values()) {
        if (
          (existing.sourceId === connection.source && existing.targetId === connection.target) ||
          (existing.sourceId === connection.target && existing.targetId === connection.source)
        ) {
          return;
        }
      }

      addEdge({
        id: edgeId,
        sourceId: connection.source,
        targetId: connection.target,
        edgeType,
      });
    },
    [actors, edges, addEdge],
  );

  // We use controlled nodes via key remapping to force updates
  const nodesWithPositions = useMemo(() => {
    return flowNodes.map((n) => ({
      ...n,
      position: positions[n.id] ?? n.position,
    }));
  }, [flowNodes, positions]);

  return (
    <div className="flex-1 relative" style={{ minHeight: 0 }}>
      <ReactFlow
        nodes={nodesWithPositions}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onConnect={onConnect}
        fitView
        minZoom={0.3}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
        <MiniMap
          nodeStrokeWidth={2}
          className="!bg-[var(--color-surface)]"
          maskColor="rgba(0,0,0,0.1)"
        />
        <Controls className="!bg-[var(--color-surface)] !border-[var(--color-border)] !shadow-sm" />
      </ReactFlow>
    </div>
  );
}
