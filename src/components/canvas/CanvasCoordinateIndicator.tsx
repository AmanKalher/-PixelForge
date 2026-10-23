import React from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';

/**
 * CanvasCoordinateIndicator
 * Compact live coordinate readout in the upper-left of the board viewport.
 */
export const CanvasCoordinateIndicator: React.FC = () => {
  const { pointerCoords } = useWorkspace();

  return (
    <div
      className="fixed top-14 left-56 sm:left-60 z-20 pointer-events-none select-none flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-xs border border-[#EFE5D8] shadow-2xs text-[11px] font-mono text-[#302633] animate-in fade-in duration-100"
      aria-label="Canvas coordinates indicator"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-[#5D8B55] animate-pulse" />
      <span className="text-[10px] text-[#3B5B3E] font-sans uppercase tracking-wider font-semibold">
        Canvas
      </span>
      <span className="text-[#EFE5D8]">|</span>
      <span>
        X: <strong className="text-[#302633] font-bold">{pointerCoords.x}</strong>
      </span>
      <span>
        Y: <strong className="text-[#302633] font-bold">{pointerCoords.y}</strong>
      </span>
    </div>
  );
};
