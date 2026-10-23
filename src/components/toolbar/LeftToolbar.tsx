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
      className="fixed top-12 bottom-0 left-0 w-52 bg-white border-r border-[#EFE5D8] z-20 flex flex-col justify-between select-none shadow-xs"
      aria-label="Navigation sidebar"
    >
      {/* Top: Dedicated Navigation Sections */}
      <div className="p-3 space-y-4">
        {/* Section title */}
        <div>
          <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#302633]/40">
            Navigation
          </div>

          <nav className="mt-1 space-y-1">
            {/* 1. Infinite Canvas */}
            <button
              onClick={handleNavCanvas}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeNav === 'canvas'
                  ? 'bg-[#FFF0ED] text-[#F26B5B] shadow-2xs ring-1 ring-[#FCD9D3]'
                  : 'text-[#302633] hover:bg-[#FFF9F0] hover:text-[#302633]'
              }`}
              title="Return to and center the main whiteboard canvas"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-1.5 rounded-lg transition ${
                    activeNav === 'canvas'
                      ? 'bg-[#F26B5B] text-white'
                      : 'bg-[#FFF9F0] text-[#302633]/60'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </div>
                <span className="truncate">Infinite Canvas</span>
              </div>
              <span className="text-[10px] text-[#3B5B3E] bg-[#EAF0E8] px-1.5 py-0.5 rounded-full font-semibold">
                Live
              </span>
            </button>

            {/* 2. Layer Tree */}
            <button
              onClick={handleNavLayers}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                isLayersPanelOpen
                  ? 'bg-[#FFF0ED] text-[#F26B5B] shadow-2xs ring-1 ring-[#FCD9D3]'
                  : 'text-[#302633] hover:bg-[#FFF9F0] hover:text-[#302633]'
              }`}
              title="View and focus the layers panel"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`p-1.5 rounded-lg transition ${
                    isLayersPanelOpen
                      ? 'bg-[#F26B5B] text-white'
                      : 'bg-[#FFF9F0] text-[#302633]/60'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                </div>
                <span className="truncate">Layer Tree</span>
              </div>
              <span className="text-[10px] font-mono text-[#302633]/50 bg-[#FFF9F0] px-1.5 py-0.5 rounded-md font-medium">
                {mockObjects.length}
              </span>
            </button>

            {/* 3. Audit & Timeline */}
            <button
              onClick={handleNavHistory}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-semibold text-[#302633] hover:bg-[#FFF9F0] transition cursor-pointer"
              title="Review session version timeline and audit revisions"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-[#FFF9F0] text-[#302633]/60">
                  <History className="w-3.5 h-3.5" />
                </div>
                <span className="truncate">Audit & Timeline</span>
              </div>
              <span className="text-[10px] font-mono text-[#302633]/50 bg-[#FFF9F0] px-1.5 py-0.5 rounded-md font-medium">
                Log
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Bottom-Most Area: Prominent Simulation Settings Button & Footer */}
      <div className="p-3 border-t border-[#EFE5D8] space-y-2.5 bg-[#FFFDF9]">
        <button
          onClick={() => setIsSimulationDrawerOpen(true)}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#302633] hover:text-[#F26B5B] hover:bg-white border border-[#EFE5D8] hover:border-[#F26B5B]/30 transition shadow-2xs group cursor-pointer"
          title="Open Simulation Settings"
          aria-label="Simulation Settings"
        >
          <div className="p-1.5 rounded-lg bg-[#FFF9F0] group-hover:bg-[#FFF0ED] text-[#302633]/60 group-hover:text-[#F26B5B] transition">
            <Sliders className="w-4 h-4" />
          </div>
          <span className="font-semibold text-[#302633] group-hover:text-[#F26B5B]">
            Simulation Settings
          </span>
        </button>

        {/* Subtle Footer Version Info */}
        <div className="px-1 text-[10px] text-[#302633]/40 flex items-center justify-between">
          <span>PixelForge v0.1</span>
          <span className="text-[9px] uppercase tracking-wider bg-[#FFF9F0] border border-[#EFE5D8] px-1.5 py-0.5 rounded text-[#302633]/60 font-mono">
            SaaS Shell
          </span>
        </div>
      </div>
    </aside>
  );
};
