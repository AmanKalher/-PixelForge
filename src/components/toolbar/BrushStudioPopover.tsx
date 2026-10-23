import React, { useRef, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  PenTool,
  Highlighter,
  Eraser,
  Sliders,
  Check,
  X,
  Sparkles,
} from 'lucide-react';

interface BrushStudioPopoverProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrushStudioPopover: React.FC<BrushStudioPopoverProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    activeTool,
    setActiveTool,
    brushSettings,
    updateBrushSettings,
    highlightSelectedText,
    highlightWholeText,
  } = useWorkspace();

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

  const brushKinds = [
    { id: 'pen', label: 'Pen', desc: 'Smooth ink' },
    { id: 'marker', label: 'Marker', desc: 'Thick stroke' },
    { id: 'pencil', label: 'Pencil', desc: 'Rough textured' },
    { id: 'calligraphy', label: 'Calligraphy', desc: 'Chiseled angle' },
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

  const highlighterPresets = [
    '#F7D774',
    '#F26B5B',
    '#A8B9A0',
    '#86EFAC',
    '#93C5FD',
    '#C084FC',
  ];

  const isHighlighter = activeTool === 'highlighter';
  const isEraser = activeTool === 'eraser';

  return (
    <div
      ref={popoverRef}
      className="absolute top-12 left-1/2 -translate-x-1/2 w-80 sm:w-96 bg-white border border-[#EFE5D8] rounded-2xl shadow-2xl p-4 z-50 text-[#302633] animate-in fade-in zoom-in-95 duration-150"
      role="dialog"
      aria-label="Brush Studio"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-[#F0EAE1]">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#6D3B67]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#6D3B67]">
            Brush Studio
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full text-[#302633]/40 hover:text-[#302633] hover:bg-[#FFF9F0] transition cursor-pointer"
          aria-label="Close Brush Studio"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-3.5 mt-3 text-xs max-h-[75vh] overflow-y-auto pr-1">
        {/* Tool Mode Selector */}
        <div>
          <label className="text-[10px] font-bold text-[#302633]/50 uppercase tracking-wider block mb-1.5">
            Active Mode
          </label>
          <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#FFF9F0] border border-[#EFE5D8] rounded-xl">
            <button
              onClick={() => setActiveTool('brush')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeTool === 'brush'
                  ? 'bg-white text-[#F26B5B] shadow-2xs font-semibold'
                  : 'text-[#302633]/70 hover:text-[#302633]'
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Brush</span>
            </button>
            <button
              onClick={() => setActiveTool('highlighter')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeTool === 'highlighter'
                  ? 'bg-white text-[#F7D774] shadow-2xs font-semibold'
                  : 'text-[#302633]/70 hover:text-[#302633]'
              }`}
            >
              <Highlighter className="w-3.5 h-3.5" />
              <span>Highlighter</span>
            </button>
            <button
              onClick={() => setActiveTool('eraser')}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-medium transition cursor-pointer ${
                activeTool === 'eraser'
                  ? 'bg-white text-[#F26B5B] shadow-2xs font-semibold'
                  : 'text-[#302633]/70 hover:text-[#302633]'
              }`}
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Eraser</span>
            </button>
          </div>
        </div>

        {/* Brush Type Presets (if in Brush mode) */}
        {!isHighlighter && !isEraser && (
          <div>
            <label className="text-[10px] font-bold text-[#302633]/50 uppercase tracking-wider block mb-1.5">
              Brush Nib Style
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {brushKinds.map((b) => {
                const isSelected = brushSettings.kind === b.id;
                return (
                  <button
                    key={b.id}
                    onClick={() => updateBrushSettings({ kind: b.id })}
                    className={`p-2 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'border-[#F26B5B] bg-[#FFF0ED] text-[#F26B5B] font-semibold shadow-2xs'
                        : 'border-[#EFE5D8] hover:border-[#F26B5B]/30 hover:bg-[#FFF9F0] text-[#302633]'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-xs">{b.label}</div>
                      <div className="text-[10px] text-[#302633]/50">{b.desc}</div>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#F26B5B]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Ink / Highlighter Color */}
        {!isEraser && (
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[10px] font-bold text-[#302633]/50 uppercase tracking-wider">
                {isHighlighter ? 'Highlighter Color' : 'Ink Color'}
              </label>
              <span className="text-[10px] font-mono text-[#302633]/50">
                {isHighlighter ? brushSettings.highlighterColor : brushSettings.color}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 flex-1 flex-wrap">
                {(isHighlighter ? highlighterPresets : colorPresets).map((c) => {
                  const activeColor = isHighlighter
                    ? brushSettings.highlighterColor
                    : brushSettings.color;
                  const isSelected = activeColor.toLowerCase() === c.toLowerCase();
                  return (
                    <button
                      key={c}
                      onClick={() =>
                        isHighlighter
                          ? updateBrushSettings({ highlighterColor: c })
                          : updateBrushSettings({ color: c })
                      }
                      className="w-6 h-6 rounded-full border border-[#EFE5D8] flex items-center justify-center transition hover:scale-110 shadow-2xs cursor-pointer"
                      style={{ backgroundColor: c }}
                      title={c}
                    >
                      {isSelected && (
                        <Check
                          className={`w-3 h-3 ${
                            c.toLowerCase() === '#ffffff' || c.toLowerCase() === '#f7d774'
                              ? 'text-[#302633]'
                              : 'text-white'
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Native Color Picker */}
              <label
                className="w-7 h-7 rounded-lg border border-[#EFE5D8] flex items-center justify-center cursor-pointer shadow-2xs hover:border-[#F26B5B]/50 transition relative overflow-hidden"
                title="Custom color"
              >
                <div
                  className="w-full h-full"
                  style={{
                    backgroundColor: isHighlighter
                      ? brushSettings.highlighterColor
                      : brushSettings.color,
                  }}
                />
                <input
                  type="color"
                  value={
                    isHighlighter
                      ? brushSettings.highlighterColor
                      : brushSettings.color
                  }
                  onChange={(e) =>
                    isHighlighter
                      ? updateBrushSettings({ highlighterColor: e.target.value })
                      : updateBrushSettings({ color: e.target.value })
                  }
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
              </label>
            </div>
          </div>
        )}

        {/* Brush / Eraser Size */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[10px] font-bold text-[#302633]/50 uppercase tracking-wider">
              {isEraser ? 'Eraser Diameter' : 'Stroke Size'}
            </label>
            <span className="text-xs font-semibold text-[#302633] font-mono">
              {isEraser ? `${brushSettings.eraserWidth}px` : `${brushSettings.width}px`}
            </span>
          </div>
          <input
            type="range"
            min={isEraser ? 8 : 1}
            max={isEraser ? 60 : 36}
            value={isEraser ? brushSettings.eraserWidth : brushSettings.width}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (isEraser) {
                updateBrushSettings({ eraserWidth: val });
              } else {
                updateBrushSettings({ width: val });
              }
            }}
            className="w-full accent-[#F26B5B] cursor-pointer"
          />
        </div>

        {/* Opacity (for standard brush) */}
        {!isHighlighter && !isEraser && (
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
              onChange={(e) =>
                updateBrushSettings({ opacity: Number(e.target.value) / 100 })
              }
              className="w-full accent-[#F26B5B] cursor-pointer"
            />
          </div>
        )}

        {/* Eraser Specific: Mode (Sweep vs Whole Stroke) */}
        {isEraser && (
          <div>
            <label className="text-[10px] font-bold text-[#302633]/50 uppercase tracking-wider block mb-1.5">
              Eraser Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => updateBrushSettings({ eraserMode: 'sweep' })}
                className={`py-1.5 px-2 rounded-xl border text-xs font-medium transition cursor-pointer ${
                  brushSettings.eraserMode === 'sweep'
                    ? 'border-[#F26B5B] bg-[#FFF0ED] text-[#F26B5B] font-semibold'
                    : 'border-[#EFE5D8] text-[#302633]/70 hover:bg-[#FFF9F0]'
                }`}
              >
                Sweep Eraser
              </button>
              <button
                onClick={() => updateBrushSettings({ eraserMode: 'whole' })}
                className={`py-1.5 px-2 rounded-xl border text-xs font-medium transition cursor-pointer ${
                  brushSettings.eraserMode === 'whole'
                    ? 'border-[#F26B5B] bg-[#FFF0ED] text-[#F26B5B] font-semibold'
                    : 'border-[#EFE5D8] text-[#302633]/70 hover:bg-[#FFF9F0]'
                }`}
              >
                Whole Stroke
              </button>
            </div>
          </div>
        )}

        {/* Stylus Pressure Sensitivity */}
        {!isEraser && (
          <div className="pt-2 border-t border-[#F0EAE1] flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-[#302633]">Stylus Pressure</div>
              <div className="text-[10px] text-[#302633]/50">Dynamically scales line width</div>
            </div>
            <input
              type="checkbox"
              checked={brushSettings.pressureEnabled}
              onChange={(e) => updateBrushSettings({ pressureEnabled: e.target.checked })}
              className="w-4 h-4 text-[#F26B5B] accent-[#F26B5B] rounded border-[#EFE5D8] focus:ring-[#F26B5B] cursor-pointer"
            />
          </div>
        )}

        {/* Text Highlighting Quick Actions */}
        <div className="pt-2.5 border-t border-[#F0EAE1] space-y-1.5">
          <label className="text-[10px] font-bold text-[#302633]/50 uppercase tracking-wider block">
            Text Highlighting Actions
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => highlightSelectedText()}
              className="flex items-center justify-center gap-1 px-2 py-1.5 bg-[#FFF9F0] border border-[#EFE5D8] hover:bg-[#F5EFE6] text-[#302633] rounded-xl text-[11px] font-medium transition cursor-pointer"
              title="Highlight selected characters inside active editing text"
            >
              <Sparkles className="w-3 h-3 text-[#F7D774]" />
              <span>Selection Highlight</span>
            </button>
            <button
              onClick={() => highlightWholeText()}
              className="flex items-center justify-center gap-1 px-2 py-1.5 bg-[#FFFDF0] border border-[#F7D774]/50 hover:bg-[#FFF8D6] text-[#302633] rounded-xl text-[11px] font-medium transition cursor-pointer"
              title="Highlight the entire selected text block"
            >
              <Highlighter className="w-3 h-3 text-[#F7D774]" />
              <span>Highlight Box</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
