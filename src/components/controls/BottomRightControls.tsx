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
    hasActiveObject,
    isMinimapOpen,
    zoom,
    pan,
    mockObjects,
    selectedMockObjectId,
    canvasEngine,
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

  const handleMinimapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    const worldX = (px / rect.width) * 1400;
    const worldY = (py / rect.height) * 900;
    if (canvasEngine.panTo) {
      canvasEngine.panTo(worldX, worldY);
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
        <div className="bg-white border border-[#EFE5D8] rounded-full shadow-md px-3 py-1 flex items-center gap-1.5 text-[#302633]">
          {/* Grid Toggle */}
          <button
            onClick={toggleGridSnap}
            className={`p-1.5 rounded-full transition cursor-pointer ${
              isGridSnapEnabled
                ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold'
                : 'hover:bg-[#FFF9F0] text-[#302633]/70 hover:text-[#302633]'
            }`}
            title={isGridSnapEnabled ? 'Disable Grid Snap' : 'Enable Grid Snap'}
            aria-label="Grid Snap"
          >
            <Grid className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-full hover:bg-[#FFF9F0] text-[#302633]/70 hover:text-[#302633] transition cursor-pointer"
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
            disabled={!hasActiveObject}
            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition ${
              hasActiveObject
                ? 'hover:bg-[#FFF9F0] text-[#302633] cursor-pointer font-medium'
                : 'text-[#302633]/30 cursor-not-allowed'
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
          className="fixed bottom-4 right-76 z-20 w-48 bg-white border border-[#EFE5D8] rounded-2xl shadow-md p-2.5 select-none animate-in fade-in zoom-in-95 duration-100"
          aria-label="Canvas Minimap"
        >
          {/* Visible "Minimap" Label */}
          <div className="flex items-center justify-between pb-2 px-0.5 text-[#302633]">
            <div className="flex items-center gap-1.5">
              <Map className="w-3.5 h-3.5 text-[#6D3B67]" />
              <span className="text-[11px] font-bold tracking-tight text-[#302633]">
                Minimap
              </span>
            </div>
            <span className="text-[10px] text-[#302633]/50 font-mono">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          <div
            onClick={handleMinimapClick}
            className="w-full h-24 bg-[#FFFDF9] rounded-xl border border-[#EFE5D8] relative flex items-center justify-center overflow-hidden cursor-crosshair"
            style={{
              backgroundImage: `radial-gradient(circle, #E0D6C8 1px, transparent 1px)`,
              backgroundSize: '10px 10px',
            }}
            title="Click to navigate canvas viewport"
          >
            {/* Miniature Object Footprints */}
            {mockObjects && mockObjects.length > 0 ? (
              mockObjects.map((obj) => {
                if (obj.visible === false) return null;
                const left = Math.max(2, Math.min(160, (obj.x / 1400) * 160 + 10));
                const top = Math.max(2, Math.min(76, (obj.y / 900) * 80 + 8));
                const width = Math.max(4, Math.min(36, ((obj.width ?? 100) / 1400) * 160));
                const height = Math.max(3, Math.min(24, ((obj.height ?? 80) / 900) * 80));
                const isSelected = obj.id === selectedMockObjectId;

                let bgClass = 'bg-[#F26B5B]/40 border-[#F26B5B]/60 rounded-xs';
                if (obj.type === 'sticky') {
                  bgClass = 'bg-[#F7D774]/70 border-[#F7D774] rounded-xs';
                } else if (obj.type === 'circle') {
                  bgClass = 'bg-[#6D3B67]/40 border-[#6D3B67]/60 rounded-full';
                } else if (obj.type === 'rectangle') {
                  bgClass = 'bg-[#A8B9A0]/50 border-[#A8B9A0] rounded-xs';
                } else if (obj.type === 'text') {
                  bgClass = 'bg-[#302633]/30 border-[#302633]/40';
                }

                return (
                  <div
                    key={obj.id}
                    className={`absolute border transition-all duration-75 ${bgClass} ${
                      isSelected ? 'ring-2 ring-[#F26B5B] ring-offset-0.5' : ''
                    }`}
                    style={{
                      left: `${left}px`,
                      top: `${top}px`,
                      width: `${width}px`,
                      height: `${height}px`,
                    }}
                  />
                );
              })
            ) : null}

            {/* Viewport Boundary Indicator Box */}
            <div
              style={{
                width: `${boxW}px`,
                height: `${boxH}px`,
                left: `${boxLeft}px`,
                top: `${boxTop}px`,
              }}
              className="absolute border-2 border-[#F26B5B] rounded-xs bg-[#F26B5B]/10 pointer-events-none transition-all duration-75"
            />
          </div>
        </div>
      )}
    </>
  );
};
