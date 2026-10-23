import React, { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Undo2, Redo2, ChevronDown, Check, Minus, Plus } from 'lucide-react';

export const BottomLeftControls: React.FC = () => {
  const {
    undo,
    redo,
    undoRedoCapabilities,
    zoom,
    zoomIn,
    zoomOut,
    resetZoom,
  } = useWorkspace();

  const [isZoomMenuOpen, setIsZoomMenuOpen] = useState(false);
  const zoomMenuRef = useRef<HTMLDivElement>(null);

  const zoomPercent = Math.round(zoom * 100);
  const zoomPresets = [50, 75, 100, 125, 150, 200];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        zoomMenuRef.current &&
        !zoomMenuRef.current.contains(e.target as Node)
      ) {
        setIsZoomMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className="fixed bottom-4 left-56 z-20 flex items-center select-none"
      aria-label="Undo, redo, and zoom controls"
    >
      <div className="bg-white border border-[#EFE5D8] rounded-full shadow-md px-2.5 py-1.5 flex items-center gap-1.5 text-[#302633]">
        {/* Undo Button */}
        <button
          onClick={undo}
          disabled={!undoRedoCapabilities.canUndo}
          className={`p-1.5 rounded-full transition cursor-pointer ${
            undoRedoCapabilities.canUndo
              ? 'text-[#302633] hover:text-[#302633] hover:bg-[#FFF9F0]'
              : 'text-[#302633]/30 cursor-not-allowed'
          }`}
          title="Undo (Ctrl+Z)"
          aria-label="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        {/* Redo Button */}
        <button
          onClick={redo}
          disabled={!undoRedoCapabilities.canRedo}
          className={`p-1.5 rounded-full transition cursor-pointer ${
            undoRedoCapabilities.canRedo
              ? 'text-[#302633] hover:text-[#302633] hover:bg-[#FFF9F0]'
              : 'text-[#302633]/30 cursor-not-allowed'
          }`}
          title="Redo (Ctrl+Shift+Z)"
          aria-label="Redo"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        {/* Vertical Divider */}
        <div className="h-4 w-px bg-[#EFE5D8] mx-0.5" />

        {/* Zoom Out Button */}
        <button
          onClick={zoomOut}
          className="p-1 rounded-full text-[#302633]/70 hover:text-[#302633] hover:bg-[#FFF9F0] transition cursor-pointer"
          title="Zoom out (-)"
          aria-label="Zoom out"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        {/* Zoom Percentage Dropdown */}
        <div className="relative" ref={zoomMenuRef}>
          <button
            onClick={() => setIsZoomMenuOpen(!isZoomMenuOpen)}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full hover:bg-[#FFF9F0] transition text-xs font-semibold text-[#302633] cursor-pointer"
            title="Zoom options"
          >
            <span>{zoomPercent}%</span>
            <ChevronDown className="w-3 h-3 text-[#302633]/40" />
          </button>

          {isZoomMenuOpen && (
            <div className="absolute bottom-9 left-0 w-28 bg-white border border-[#EFE5D8] rounded-xl shadow-xl p-1 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
              <button
                onClick={() => {
                  resetZoom();
                  setIsZoomMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-[#302633] hover:bg-[#FFF9F0] font-medium transition cursor-pointer"
              >
                <span>Reset (100%)</span>
              </button>
              <div className="border-t border-[#F0EAE1] my-1" />
              {zoomPresets.map((pct) => (
                <button
                  key={pct}
                  onClick={() => {
                    resetZoom();
                    setIsZoomMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1 rounded-md transition cursor-pointer ${
                    zoomPercent === pct
                      ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold'
                      : 'text-[#302633] hover:bg-[#FFF9F0]'
                  }`}
                >
                  <span>{pct}%</span>
                  {zoomPercent === pct && (
                    <Check className="w-3 h-3 text-[#F26B5B]" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Zoom In Button */}
        <button
          onClick={zoomIn}
          className="p-1 rounded-full text-[#302633]/70 hover:text-[#302633] hover:bg-[#FFF9F0] transition cursor-pointer"
          title="Zoom in (+)"
          aria-label="Zoom in"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
