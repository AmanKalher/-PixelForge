import React, { useRef, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { Highlighter, Check, X } from 'lucide-react';

interface HighlighterToolPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  placement?: 'bottom' | 'right';
}

export const HighlighterToolPopover: React.FC<HighlighterToolPopoverProps> = ({
  isOpen,
  onClose,
  placement = 'right',
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

  const highlighterPresets = [
    '#F7D774',
    '#F26B5B',
    '#A8B9A0',
    '#86EFAC',
    '#93C5FD',
    '#C084FC',
  ];

  return (
    <div
      ref={popoverRef}
      className={`absolute ${
        placement === 'right'
          ? 'left-full top-1/2 -translate-y-1/2 ml-3'
          : 'top-12 left-1/2 -translate-x-1/2'
      } w-72 sm:w-80 bg-white border border-[#EFE5D8] rounded-2xl shadow-2xl p-4 z-50 text-[#302633] animate-in fade-in zoom-in-95 duration-150 max-h-[88vh] overflow-y-auto`}
      role="dialog"
      aria-label="Highlighter Settings"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#F0EAE1]">
        <div className="flex items-center gap-2">
          <Highlighter className="w-4 h-4 text-[#F7D774]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#6D3B67]">
            Highlighter Settings
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-[#302633]/40 hover:text-[#302633] hover:bg-[#FFF9F0] transition cursor-pointer"
          aria-label="Close Highlighter Options"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-3.5 mt-3 text-xs">
        {/* Highlighter Color Presets */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-bold text-[#302633]/50 uppercase tracking-wider">
              Ink Color
            </label>
            <span className="text-[10px] font-mono text-[#302633]/50">
              {brushSettings.highlighterColor}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 flex-1 flex-wrap">
              {highlighterPresets.map((c) => {
                const isSelected =
                  brushSettings.highlighterColor.toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    onClick={() => updateBrushSettings({ highlighterColor: c })}
                    className="w-6 h-6 rounded-full border border-[#EFE5D8] flex items-center justify-center transition hover:scale-110 shadow-2xs cursor-pointer"
                    style={{ backgroundColor: c }}
                    title={c}
                  >
                    {isSelected && (
                      <Check className="w-3 h-3 text-[#302633]" />
                    )}
                  </button>
                );
              })}
            </div>
            <label
              className="w-7 h-7 rounded-lg border border-[#EFE5D8] flex items-center justify-center cursor-pointer shadow-2xs hover:border-[#F26B5B]/50 transition relative overflow-hidden"
              title="Custom color"
            >
              <div
                className="w-full h-full"
                style={{ backgroundColor: brushSettings.highlighterColor }}
              />
              <input
                type="color"
                value={brushSettings.highlighterColor}
                onChange={(e) =>
                  updateBrushSettings({ highlighterColor: e.target.value })
                }
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Highlighter Width */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-bold text-[#302633]/50 uppercase tracking-wider">
              Stroke Width
            </label>
            <span className="text-xs font-semibold text-[#302633] font-mono">
              {Math.max(brushSettings.width, 18)}px
            </span>
          </div>
          <input
            type="range"
            min="12"
            max="48"
            value={Math.max(brushSettings.width, 18)}
            onChange={(e) => updateBrushSettings({ width: Number(e.target.value) })}
            className="w-full accent-[#F7D774] cursor-pointer"
          />
        </div>

        {/* Info */}
        <p className="text-[11px] text-[#302633]/70 bg-[#FFFDF0] p-2.5 rounded-xl border border-[#F7D774]/40 leading-relaxed">
          Highlighter creates a semi-translucent overlay (30% alpha) designed for highlighting diagram flows and sticky notes without obscuring underlying content.
        </p>
      </div>
    </div>
  );
};
