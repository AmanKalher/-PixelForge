import React from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';

/**
 * CanvasCoordinateIndicator
 * Compact live coordinate readout in the upper-left of the board viewport.
 * Clearly labeled as preview coordinates until Member 2's Fabric.js engine integration hook is attached.
 */
export const CanvasCoordinateIndicator: React.FC = () => {
  const { pointerCoords } = useWorkspace();

  return (
    <div
      className="fixed top-14 left-56 sm:left-60 z-20 pointer-events-none select-none flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-xs border border-slate-200/90 shadow-2xs text-[11px] font-mono text-slate-600 animate-in fade-in duration-100"
      aria-label="Canvas coordinates indicator"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
      <span className="text-[10px] text-slate-400 font-sans uppercase tracking-wider font-semibold">
        Preview
      </span>
      <span className="text-slate-300">|</span>
      <span>
        X: <strong className="text-slate-800 font-bold">{pointerCoords.x}</strong>
      </span>
      <span>
        Y: <strong className="text-slate-800 font-bold">{pointerCoords.y}</strong>
      </span>
    </div>
  );
};

