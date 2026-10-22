import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  LayoutGrid,
  Layers,
  History,
  Sliders,
} from 'lucide-react';

export const LeftToolbar: React.FC = () => {
  const {
    isLayersPanelOpen,
    toggleLayersPanel,
    setIsSimulationDrawerOpen,
    setIsHistoryModalOpen,
    mockObjects,
    resetZoom,
    setPan,
    setActiveTool,
  } = useWorkspace();

  const [activeNav, setActiveNav] = useState<'canvas' | 'layers' | 'history'>('canvas');

  const handleNavCanvas = () => {
    setActiveNav('canvas');
    setActiveTool('select');
    resetZoom();
    setPan({ x: 0, y: 0 });
  };

  const handleNavLayers = () => {
    setActiveNav('layers');
    toggleLayersPanel();
  };

  const handleNavHistory = () => {
    setActiveNav('history');
    setIsHistoryModalOpen(true);
  };

  return (
    <aside
      className="fixed top-12 bottom-0 left-0 w-52 bg-white border-r border-slate-200 z-20 flex flex-col justify-between select-none shadow-xs"
      aria-label="Navigation sidebar"
    >
      {/* Top: Dedicated Navigation Sections */}
      <div className="p-3 space-y-4">
        {/* Section title */}
        <div>
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Navigation
          </div>

          <nav className="mt-1 space-y-1">
            {/* 1. Infinite Canvas */}
            <button
              onClick={handleNavCanvas}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition ${
                activeNav === 'canvas'
                  ? 'bg-[#EEF2FF] text-[#6366F1] shadow-2xs ring-1 ring-indigo-100'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title="Return to and center the main whiteboard canvas"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-1.5 rounded-lg transition ${
                    activeNav === 'canvas'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </div>
                <span className="truncate">Infinite Canvas</span>
              </div>
              <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-full font-semibold">
                Live
              </span>
            </button>

            {/* 2. Layer Tree */}
            <button
              onClick={handleNavLayers}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition ${
                isLayersPanelOpen
                  ? 'bg-[#EEF2FF] text-[#6366F1] shadow-2xs ring-1 ring-indigo-100'
                  : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title="View and focus the layers panel"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-1.5 rounded-lg transition ${
                    isLayersPanelOpen
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <span className="truncate">Layer Tree</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md font-medium">
                {mockObjects.length}
              </span>
            </button>

            {/* 3. Audit & Timeline */}
            <button
              onClick={handleNavHistory}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition"
              title="Review session version timeline and audit revisions"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-slate-100 text-slate-500">
                  <History className="w-3.5 h-3.5" />
                </div>
                <span className="truncate">Audit & Timeline</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md font-medium">
                Log
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Bottom-Most Area: Prominent Simulation Settings Button & Footer */}
      <div className="p-3 border-t border-slate-200/90 space-y-2.5 bg-slate-50/50">
        <button
          onClick={() => setIsSimulationDrawerOpen(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:text-indigo-600 hover:bg-white border border-slate-200 hover:border-indigo-300 transition shadow-2xs group"
          title="Open Simulation Settings"
          aria-label="Simulation Settings"
        >
          <div className="p-1.5 rounded-lg bg-slate-100 group-hover:bg-indigo-50 text-slate-600 group-hover:text-indigo-600 transition">
            <Sliders className="w-4 h-4" />
          </div>
          <span className="font-semibold text-slate-800 group-hover:text-indigo-600">
            Simulation Settings
          </span>
        </button>

        {/* Subtle Footer Version Info */}
        <div className="px-1 text-[10px] text-slate-400 flex items-center justify-between">
          <span>PixelForge v0.1</span>
          <span className="text-[9px] uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded text-slate-500 font-mono">
            SaaS Shell
          </span>
        </div>
      </div>
    </aside>
  );
};
