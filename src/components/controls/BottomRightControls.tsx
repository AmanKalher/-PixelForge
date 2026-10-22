import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  Grid,
  Maximize2,
  Minimize2,
  Copy,
  Map,
} from 'lucide-react';

export const BottomRightControls: React.FC = () => {
  const {
    isGridSnapEnabled,
    toggleGridSnap,
    duplicateSelected,
    selectedMockObjectId,
    isMinimapOpen,
    zoom,
    pan,
  } = useWorkspace();

  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const boxW = Math.max(30, Math.min(150, 130 / Math.max(0.2, zoom)));
  const boxH = Math.max(20, Math.min(80, 68 / Math.max(0.2, zoom)));
  const boxLeft = Math.max(4, Math.min(160 - boxW - 4, 14 - pan.x * 0.04));
  const boxTop = Math.max(4, Math.min(88 - boxH - 4, 10 - pan.y * 0.04));

  return (
    <>
      {/* 1. Bottom-Center Floating White Pill */}
      <div
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center select-none"
        aria-label="Canvas action controls"
      >
        <div className="bg-white border border-slate-200 rounded-full shadow-md px-3 py-1 flex items-center gap-1.5 text-slate-600">
          {/* Grid Toggle */}
          <button
            onClick={toggleGridSnap}
            className={`p-1.5 rounded-full transition ${
              isGridSnapEnabled
                ? 'bg-indigo-50 text-indigo-600 font-semibold'
                : 'hover:bg-slate-100 text-slate-600'
            }`}
            title={isGridSnapEnabled ? 'Disable Grid Snap' : 'Enable Grid Snap'}
            aria-label="Grid Snap"
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            aria-label="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </button>

          {/* Duplicate Object */}
          <button
            onClick={duplicateSelected}
            disabled={!selectedMockObjectId}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition ${
              selectedMockObjectId
                ? 'hover:bg-slate-100 text-slate-700 hover:text-slate-900 cursor-pointer font-medium'
                : 'text-slate-300 cursor-not-allowed'
            }`}
            title="Duplicate Selected Object (Ctrl+D)"
            aria-label="Duplicate"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Duplicate</span>
          </button>
        </div>
      </div>

      {/* 2. Bottom-Right: Clean, Compact White-Framed Minimap Card with Explicit Label */}
      {isMinimapOpen && (
        <div
          className="fixed bottom-4 right-76 z-20 w-48 bg-white border border-slate-200 rounded-xl shadow-md p-2 select-none animate-in fade-in zoom-in-95 duration-100"
          aria-label="Canvas Minimap"
        >
          {/* Clearly Visible "Minimap" Label */}
          <div className="flex items-center justify-between pb-1.5 px-0.5 text-slate-700">
            <div className="flex items-center gap-1.5">
              <Map className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[11px] font-bold tracking-tight text-slate-800">
                Minimap
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-mono">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <div
            className="w-full h-24 bg-[#F8FAFC] rounded-lg border border-slate-200 relative flex items-center justify-center overflow-hidden"
            style={{
              backgroundImage: `radial-gradient(circle, #CBD5E1 1px, transparent 1px)`,
              backgroundSize: '10px 10px',
            }}
          >
            {/* Miniature Object Footprints */}
            <div className="absolute w-5 h-4 bg-yellow-400/40 border border-yellow-500/50 rounded-xs left-3 top-3" />
            <div className="absolute w-5 h-4 bg-emerald-400/40 border border-emerald-500/50 rounded-xs left-3 top-8" />
            <div className="absolute w-12 h-6 bg-purple-400/35 border border-purple-500/50 rounded-xs left-10 top-9" />
            <div className="absolute w-3 h-3 rounded-full bg-indigo-400/50 border border-indigo-500/60 left-10 top-4" />
            <div className="absolute w-3 h-3 bg-purple-400/50 border border-purple-500/60 rotate-45 left-15 top-4" />
            <div className="absolute w-4 h-3 bg-emerald-400/50 border border-emerald-500/60 rounded-xs left-20 top-4" />

            {/* Viewport Boundary Indicator Box (Synchronized with Pan & Zoom) */}
            <div
              style={{
                width: `${boxW}px`,
                height: `${boxH}px`,
                left: `${boxLeft}px`,
                top: `${boxTop}px`,
              }}
              className="absolute border-2 border-[#6366F1] rounded-xs bg-indigo-500/10 pointer-events-none transition-all duration-75"
            />
          </div>
        </div>
      )}
    </>
  );
};
