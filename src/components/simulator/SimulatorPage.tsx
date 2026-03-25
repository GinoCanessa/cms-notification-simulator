import { useEffect } from 'react';
import { SubHeader } from '../layout/SubHeader';
import { useGraphStore } from '../../stores/graphStore';
import { simplePreset } from '../../presets';
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
      loadPreset(simplePreset.actors, simplePreset.edges, simplePreset.positions);
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
