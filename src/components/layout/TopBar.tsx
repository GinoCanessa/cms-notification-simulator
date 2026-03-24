import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Layers, Upload, Download } from 'lucide-react';
import { useSimulationStore } from '../../stores/simulationStore';
import { useGraphStore } from '../../stores/graphStore';
import { allPresets } from '../../presets';
import { ThemeToggle } from '../shared/ThemeToggle';

export function TopBar() {
  const approach = useSimulationStore((s) => s.approach);
  const setApproach = useSimulationStore((s) => s.setApproach);

  const [presetOpen, setPresetOpen] = useState(false);
  const presetRef = useRef<HTMLDivElement>(null);

  // Close preset dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (presetRef.current && !presetRef.current.contains(e.target as Node)) {
        setPresetOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  function handlePresetSelect(presetId: string) {
    const preset = allPresets.find((p) => p.id === presetId);
    if (preset) {
      useGraphStore.getState().loadPreset(preset.actors, preset.edges);
    }
    setPresetOpen(false);
  }

  function handleExport() {
    const state = useGraphStore.getState();
    const data = {
      actors: Array.from(state.actors.values()),
      edges: Array.from(state.edges.values()),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cms-notification-graph.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          if (data.actors && data.edges) {
            useGraphStore.getState().loadPreset(data.actors, data.edges);
          }
        } catch {
          // ignore invalid JSON
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `block text-[13px] px-4 py-3 transition-colors border-b-2 ${
      isActive
        ? 'text-white border-white opacity-100'
        : 'text-white/65 border-transparent hover:text-white/90'
    }`;

  return (
    <header className="h-12 flex-shrink-0 flex items-center justify-between px-4 bg-[#0F4C81] dark:bg-[#1E3A5F]">
      {/* Left: Logo + Nav */}
      <div className="flex items-center gap-1 h-full">
        <NavLink to="/" className="flex items-center gap-2 text-white mr-4 no-underline">
          <Layers size={20} className="text-white/90" />
          <span className="text-sm font-semibold whitespace-nowrap hidden sm:inline">
            CMS Notification Simulator
          </span>
        </NavLink>

        <nav className="flex items-center h-full">
          <NavLink to="/" end className={navLinkClass}>
            Overview
          </NavLink>
          <NavLink to="/simulator" className={navLinkClass}>
            Simulator
          </NavLink>
        </nav>
      </div>

      {/* Center: Approach toggle */}
      <div className="flex items-center rounded-md p-0.5" style={{ background: 'rgba(255,255,255,.12)' }}>
        <button
          onClick={() => setApproach('routed')}
          className={`text-xs px-3 py-1 rounded cursor-pointer transition-colors ${
            approach === 'routed'
              ? 'text-white font-medium'
              : 'text-white/60 hover:text-white/80'
          }`}
          style={approach === 'routed' ? { background: 'rgba(255,255,255,.2)' } : undefined}
        >
          Routed
        </button>
        <button
          onClick={() => setApproach('direct')}
          className={`text-xs px-3 py-1 rounded cursor-pointer transition-colors ${
            approach === 'direct'
              ? 'text-white font-medium'
              : 'text-white/60 hover:text-white/80'
          }`}
          style={approach === 'direct' ? { background: 'rgba(255,255,255,.2)' } : undefined}
        >
          Direct
        </button>
      </div>

      {/* Right: Preset, Import/Export, Theme */}
      <div className="flex items-center gap-2">
        {/* Preset dropdown */}
        <div className="relative" ref={presetRef}>
          <button
            onClick={() => setPresetOpen((o) => !o)}
            className="text-xs px-3 py-1.5 rounded border cursor-pointer transition-colors"
            style={{ borderColor: 'rgba(255,255,255,.2)', color: 'rgba(255,255,255,.7)' }}
          >
            Presets ▾
          </button>
          {presetOpen && (
            <div className="absolute right-0 top-full mt-1 w-44 rounded-md shadow-lg z-50 border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              {allPresets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => handlePresetSelect(preset.id)}
                  className="block w-full text-left px-3 py-2 text-sm cursor-pointer
                    text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700
                    first:rounded-t-md last:rounded-b-md"
                >
                  {preset.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={handleImport}
          className="flex items-center gap-1 text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors"
          style={{ borderColor: 'rgba(255,255,255,.2)', color: 'rgba(255,255,255,.7)' }}
          title="Import graph"
        >
          <Upload size={14} />
          <span className="hidden md:inline">Import</span>
        </button>

        <button
          onClick={handleExport}
          className="flex items-center gap-1 text-xs px-2 py-1.5 rounded border cursor-pointer transition-colors"
          style={{ borderColor: 'rgba(255,255,255,.2)', color: 'rgba(255,255,255,.7)' }}
          title="Export graph"
        >
          <Download size={14} />
          <span className="hidden md:inline">Export</span>
        </button>

        <ThemeToggle />
      </div>
    </header>
  );
}
