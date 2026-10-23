import React, { useRef, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Eraser, Scissors, Trash2, X } from 'lucide-react';

interface EraserToolPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EraserToolPopover: React.FC<EraserToolPopoverProps> = ({
  isOpen,
  onClose,
}) => {
  const { brushSettings, updateBrushSettings } = useWorkspace();
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute top-12 left-1/2 -translate-x-1/2 w-72 sm:w-80 bg-white border border-[#EFE5D8] rounded-2xl shadow-2xl p-4 z-50 text-[#302633] animate-in fade-in zoom-in-95 duration-150"
      role="dialog"
      aria-label="Eraser Settings"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#F0EAE1]">
        <div className="flex items-center gap-2">
          <Eraser className="w-4 h-4 text-[#F26B5B]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#6D3B67]">
            Eraser Settings
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-[#302633]/40 hover:text-[#302633] hover:bg-[#FFF9F0] transition cursor-pointer"
          aria-label="Close Eraser Options"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-4 pt-3">
        {/* Mode Switcher */}
        <div>
          <label className="text-[11px] font-semibold text-[#302633]/60 uppercase tracking-wider block mb-1.5">
            Eraser Mode
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => updateBrushSettings({ eraserMode: 'sweep' })}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition cursor-pointer ${
                brushSettings.eraserMode === 'sweep'
                  ? 'bg-[#FFF0ED] border-[#F26B5B] text-[#F26B5B] shadow-xs font-semibold'
                  : 'bg-[#FFFDF9] border-[#EFE5D8] text-[#302633]/70 hover:bg-[#FFF9F0]'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Sweep Eraser</span>
            </button>
            <button
              onClick={() => updateBrushSettings({ eraserMode: 'whole' })}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl border text-xs font-medium transition cursor-pointer ${
                brushSettings.eraserMode === 'whole'
                  ? 'bg-[#FFF0ED] border-[#F26B5B] text-[#F26B5B] shadow-xs font-semibold'
                  : 'bg-[#FFFDF9] border-[#EFE5D8] text-[#302633]/70 hover:bg-[#FFF9F0]'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Whole Stroke</span>
            </button>
          </div>
          <p className="text-[11px] text-[#302633]/50 mt-1.5 leading-tight">
            {brushSettings.eraserMode === 'sweep'
              ? 'Sweep erases intersected path segments and splits strokes cleanly.'
              : 'Whole stroke deletes entire drawn paths that touch the eraser cursor.'}
          </p>
        </div>

        {/* Eraser Diameter Slider */}
        <div>
          <div className="flex justify-between items-center text-[11px] font-semibold text-[#302633]/60 uppercase tracking-wider mb-1.5">
            <span>Diameter / Radius</span>
            <span className="text-[#302633] font-mono text-xs lowercase">
              {brushSettings.eraserWidth}px
            </span>
          </div>
          <input
            type="range"
            min="6"
            max="60"
            step="2"
            value={brushSettings.eraserWidth}
            onChange={(e) =>
              updateBrushSettings({ eraserWidth: parseInt(e.target.value, 10) })
            }
            className="w-full accent-[#F26B5B] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-[#302633]/50 mt-1">
            <span>Fine (6px)</span>
            <span>Standard (24px)</span>
            <span>Broad (60px)</span>
          </div>
        </div>

        {/* Note on vector objects */}
        <div className="p-2.5 bg-[#FFF9F0] border border-[#EFE5D8] rounded-xl text-[11px] text-[#302633]/70 leading-snug">
          💡 Eraser acts exclusively on freehand strokes and drawings. To remove shapes, text, or sticky notes, use the Select tool and press <span className="font-mono bg-white border border-[#EFE5D8] px-1 rounded text-[#302633]">Delete</span>.
        </div>
      </div>
    </div>
  );
};
