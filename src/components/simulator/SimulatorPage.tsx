import { useEffect } from 'react';
import { SubHeader } from '../layout/SubHeader';
import { useGraphStore } from '../../stores/graphStore';
import { twoNetworksPreset } from '../../presets';
import GraphCanvas from './GraphCanvas';
import ControlsPanel from './ControlsPanel';
import ActorDetails from './ActorDetails';
import EventLog from './EventLog';

export default function SimulatorPage() {
  const actors = useGraphStore((s) => s.actors);
  const loadPreset = useGraphStore((s) => s.loadPreset);

  // Load default preset if graph is empty
  useEffect(() => {
    if (actors.size === 0) {
      loadPreset(twoNetworksPreset.actors, twoNetworksPreset.edges);
      // Set preset positions after load
      const setPositions = (window as unknown as Record<string, unknown>).__setGraphPositions as
        | ((p: Record<string, { x: number; y: number }>) => void)
        | undefined;
      if (setPositions) {
        setPositions(twoNetworksPreset.positions);
      } else {
        // Retry once after a tick to allow GraphCanvas to mount
        requestAnimationFrame(() => {
          const retry = (window as unknown as Record<string, unknown>).__setGraphPositions as
            | ((p: Record<string, { x: number; y: number }>) => void)
            | undefined;
          if (retry) retry(twoNetworksPreset.positions);
        });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <SubHeader />
      <div className="flex-1 flex overflow-hidden">
        <ControlsPanel />
        <GraphCanvas />
        <ActorDetails />
      </div>
      <EventLog />
    </>
  );
}
