import React, { useRef, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { PenTool, Check, X } from 'lucide-react';

interface BrushToolPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  placement?: 'bottom' | 'right';
}

export const BrushToolPopover: React.FC<BrushToolPopoverProps> = ({
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

  const nibStyles = [
    { id: 'pen', label: 'Pen', desc: 'Smooth round ink' },
    { id: 'marker', label: 'Marker', desc: 'Bold saturated stroke' },
    { id: 'pencil', label: 'Pencil', desc: 'Rough textured dash' },
    { id: 'calligraphy', label: 'Calligraphy', desc: 'Chiseled square cap' },
  ] as const;

  const colorPresets = [
    '#302633',
    '#F26B5B',
    '#6D3B67',
    '#F7D774',
    '#A8B9A0',
    '#0EA5E9',
    '#F97316',
    '#FFFFFF',
  ];

  const hasHardwarePressure =
    typeof window !== 'undefined' && 'PointerEvent' in window;

  return (
    <div
      ref={popoverRef}
      className={`absolute ${
        placement === 'right'
          ? 'left-full top-1/2 -translate-y-1/2 ml-3'
          : 'top-12 left-1/2 -translate-x-1/2'
      } w-72 sm:w-80 bg-white border border-[#EFE5D8] rounded-2xl shadow-2xl p-4 z-50 text-[#302633] animate-in fade-in zoom-in-95 duration-150 max-h-[88vh] overflow-y-auto`}
      role="dialog"
      aria-label="Brush Settings"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#F0EAE1]">
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-[#6D3B67]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#6D3B67]">
            Brush Settings
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-[#302633]/40 hover:text-[#302633] hover:bg-[#FFF9F0] transition cursor-pointer"
          aria-label="Close Brush Options"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-3.5 mt-3 text-xs">
        {/* Nib Style */}
        <div>
          <label className="text-[10px] font-bold text-[#302633]/50 uppercase tracking-wider block mb-1.5">
            Nib Style
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {nibStyles.map((nib) => {
              const isSelected = brushSettings.kind === nib.id;
              return (
                <button
                  key={nib.id}
                  onClick={() => updateBrushSettings({ kind: nib.id })}
                  className={`p-2 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'border-[#F26B5B] bg-[#FFF0ED] text-[#F26B5B] font-semibold shadow-2xs'
                      : 'border-[#EFE5D8] hover:border-[#F26B5B]/40 hover:bg-[#FFF9F0] text-[#302633]'
                  }`}
                >
                  <div>
                    <div className="font-semibold text-xs">{nib.label}</div>
                    <div className="text-[9px] text-[#302633]/50">{nib.desc}</div>
                  </div>
                  {isSelected && <Check className="w-3 h-3 text-[#F26B5B]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Ink Color */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-bold text-[#302633]/50 uppercase tracking-wider">
              Ink Color
            </label>
            <span className="text-[10px] font-mono text-[#302633]/50">
              {brushSettings.color}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 flex-1 flex-wrap">
              {colorPresets.map((c) => {
                const isSelected = brushSettings.color.toLowerCase() === c.toLowerCase();
                return (
                  <button
                    key={c}
                    onClick={() => updateBrushSettings({ color: c })}
                    className="w-6 h-6 rounded-full border border-[#EFE5D8] flex items-center justify-center transition hover:scale-110 shadow-2xs cursor-pointer"
                    style={{ backgroundColor: c }}
                    title={c}
                  >
                    {isSelected && (
                      <Check className={`w-3 h-3 ${c.toLowerCase() === '#ffffff' ? 'text-[#302633]' : 'text-white'}`} />
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
                style={{ backgroundColor: brushSettings.color }}
              />
              <input
                type="color"
                value={brushSettings.color}
                onChange={(e) => updateBrushSettings({ color: e.target.value })}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Brush Size */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-bold text-[#302633]/50 uppercase tracking-wider">
              Stroke Width
            </label>
            <span className="text-xs font-semibold text-[#302633] font-mono">
              {brushSettings.width}px
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="36"
            value={brushSettings.width}
            onChange={(e) => updateBrushSettings({ width: Number(e.target.value) })}
            className="w-full accent-[#F26B5B] cursor-pointer"
          />
        </div>

        {/* Brush Opacity */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-bold text-[#302633]/50 uppercase tracking-wider">
              Stroke Opacity
            </label>
            <span className="text-xs font-semibold text-[#302633] font-mono">
              {Math.round(brushSettings.opacity * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={Math.round(brushSettings.opacity * 100)}
            onChange={(e) => updateBrushSettings({ opacity: Number(e.target.value) / 100 })}
            className="w-full accent-[#F26B5B] cursor-pointer"
          />
        </div>

        {/* Stylus Pressure */}
        <div className="pt-2 border-t border-[#F0EAE1] flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold text-[#302633]">Stylus Pressure</div>
            <div className="text-[10px] text-[#302633]/50">
              {hasHardwarePressure
                ? 'Scales stroke width dynamically with pen force'
                : 'Default pressure fallback on standard mouse'}
            </div>
          </div>
          <input
            type="checkbox"
            checked={brushSettings.pressureEnabled}
            onChange={(e) => updateBrushSettings({ pressureEnabled: e.target.checked })}
            className="w-4 h-4 text-[#F26B5B] accent-[#F26B5B] rounded border-[#EFE5D8] focus:ring-[#F26B5B] cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
};
