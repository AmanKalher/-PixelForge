import React, { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  ChevronDown,
  MoreHorizontal,
  Copy,
  Trash2,
  Layers,
  Check,
  Bold,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Square,
  Circle,
  StickyNote,
  Type,
  PenTool,
  Highlighter,
  MoveRight,
  Diamond,
  Triangle,
} from 'lucide-react';

export const ContextualStyleBar: React.FC = () => {
  const {
    activeTool,
    styleConfig,
    updateStyle,
    duplicateSelected,
    deleteSelected,
    bringForwardSelected,
    selectedMockObjectId,
    mockObjects,
  } = useWorkspace();

  const [isFillPickerOpen, setIsFillPickerOpen] = useState(false);
  const [isStrokePickerOpen, setIsStrokePickerOpen] = useState(false);
  const [isWidthMenuOpen, setIsWidthMenuOpen] = useState(false);
  const [isOpacityMenuOpen, setIsOpacityMenuOpen] = useState(false);
  const [isFontSizeMenuOpen, setIsFontSizeMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const fillRef = useRef<HTMLDivElement>(null);
  const strokeRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef<HTMLDivElement>(null);
  const opacityRef = useRef<HTMLDivElement>(null);
  const fontSizeRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (fillRef.current && !fillRef.current.contains(target)) setIsFillPickerOpen(false);
      if (strokeRef.current && !strokeRef.current.contains(target)) setIsStrokePickerOpen(false);
      if (widthRef.current && !widthRef.current.contains(target)) setIsWidthMenuOpen(false);
      if (opacityRef.current && !opacityRef.current.contains(target)) setIsOpacityMenuOpen(false);
      if (fontSizeRef.current && !fontSizeRef.current.contains(target)) setIsFontSizeMenuOpen(false);
      if (moreRef.current && !moreRef.current.contains(target)) setIsMoreMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedObject = selectedMockObjectId
    ? mockObjects.find((o) => o.id === selectedMockObjectId) || null
    : null;

  // Show only if an object is selected, OR if brush/highlighter/shape creation tool is active
  const isStylableTool = [
    'brush',
    'highlighter',
    'rectangle',
    'rounded-rectangle',
    'circle',
    'ellipse',
    'diamond',
    'triangle',
    'sticky',
    'text',
  ].includes(activeTool);

  const shouldShow = selectedObject !== null || (isStylableTool && activeTool !== 'select' && activeTool !== 'pan');

  if (!shouldShow) return null;

  const targetType = selectedObject ? selectedObject.type : activeTool;
  const isSticky = targetType === 'sticky';
  const isText = targetType === 'text';
  const isTextBearing = isText || isSticky;
  const isBrushOrHighlighter = targetType === 'brush' || targetType === 'highlighter';
  const isLineOrArrow = targetType === 'line' || targetType === 'arrow';

  const strokeWidths = [1, 2, 4, 8];
  const opacities = [1, 0.75, 0.5, 0.25];
  const fontSizes = [12, 14, 16, 20, 24, 32];

  const fillPresets = [
    'transparent',
    '#EDE9FE',
    '#EEF2FF',
    '#ECFDF5',
    '#FEF08A',
    '#BBF7D0',
    '#FED7AA',
    '#F1F5F9',
  ];

  const strokePresets = [
    '#8B5CF6',
    '#6366F1',
    '#10B981',
    '#EAB308',
    '#EF4444',
    '#0EA5E9',
    '#1E293B',
    '#94A3B8',
  ];

  const getTargetIcon = (type: string) => {
    switch (type) {
      case 'sticky': return <StickyNote className="w-3.5 h-3.5 text-amber-500" />;
      case 'circle': return <Circle className="w-3.5 h-3.5 text-indigo-500" />;
      case 'text': return <Type className="w-3.5 h-3.5 text-slate-700" />;
      case 'brush': return <PenTool className="w-3.5 h-3.5 text-indigo-600" />;
      case 'highlighter': return <Highlighter className="w-3.5 h-3.5 text-amber-500" />;
      case 'arrow': return <MoveRight className="w-3.5 h-3.5 text-indigo-600" />;
      case 'diamond': return <Diamond className="w-3.5 h-3.5 text-purple-600" />;
      case 'triangle': return <Triangle className="w-3.5 h-3.5 text-purple-600" />;
      default: return <Square className="w-3.5 h-3.5 text-indigo-600" />;
    }
  };

  const currentFill = selectedObject?.fillColor ?? styleConfig.fillColor;
  const currentStroke = selectedObject?.strokeColor ?? styleConfig.strokeColor;
  const currentWidth = selectedObject?.strokeWidth ?? styleConfig.strokeWidth ?? 2;
  const currentOpacity = selectedObject?.opacity ?? styleConfig.opacity ?? 1;

  return (
    <div
      className="fixed top-26 left-1/2 -translate-x-1/2 z-20 rounded-full shadow-lg bg-white/95 backdrop-blur-xs border border-slate-200 px-3 py-1.5 flex items-center gap-2 select-none animate-in fade-in slide-in-from-top-2 duration-150"
      role="toolbar"
      aria-label="Contextual style bar"
    >
      {/* Target Type Badge */}
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold">
        {getTargetIcon(targetType)}
        <span className="capitalize">{targetType.replace('-', ' ')}</span>
      </div>

      <div className="h-4 w-px bg-slate-200 mx-0.5" />

      {/* Fill Color Picker (hidden for lines, arrows, brush, highlighter) */}
      {!isLineOrArrow && !isBrushOrHighlighter && (
        <div className="relative" ref={fillRef}>
          <button
            onClick={() => setIsFillPickerOpen(!isFillPickerOpen)}
            className="flex items-center gap-1 px-1.5 py-1 rounded-full hover:bg-slate-100 transition text-xs font-medium text-slate-700"
            title="Fill color"
          >
            <span
              className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs block"
              style={{
                backgroundColor: currentFill === 'transparent' ? '#FFFFFF' : currentFill,
              }}
            />
            <span className="text-[11px] hidden sm:inline">Fill</span>
            <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
          </button>

          {isFillPickerOpen && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-xl shadow-xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 w-44">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Fill Color
              </div>
              <div className="grid grid-cols-4 gap-2">
                {fillPresets.map((c) => (
                  <button
                    key={c}
                    onClick={() => {
                      updateStyle({ fillColor: c });
                      setIsFillPickerOpen(false);
                    }}
                    className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center transition hover:scale-110 shadow-2xs"
                    style={{ backgroundColor: c === 'transparent' ? '#ffffff' : c }}
                    title={c}
                  >
                    {currentFill.toLowerCase() === c.toLowerCase() && (
                      <Check className="w-3 h-3 text-slate-700" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stroke / Border Color Picker */}
      <div className="relative" ref={strokeRef}>
        <button
          onClick={() => setIsStrokePickerOpen(!isStrokePickerOpen)}
          className="flex items-center gap-1 px-1.5 py-1 rounded-full hover:bg-slate-100 transition text-xs font-medium text-slate-700"
          title="Stroke color"
        >
          <span
            className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs block"
            style={{ backgroundColor: currentStroke }}
          />
          <span className="text-[11px] hidden sm:inline">Stroke</span>
          <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
        </button>

        {isStrokePickerOpen && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-xl shadow-xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 w-44">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Stroke Color
            </div>
            <div className="grid grid-cols-4 gap-2">
              {strokePresets.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    updateStyle({ strokeColor: c });
                    setIsStrokePickerOpen(false);
                  }}
                  className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center transition hover:scale-110 shadow-2xs"
                  style={{ backgroundColor: c }}
                  title={c}
                >
                  {currentStroke.toLowerCase() === c.toLowerCase() && (
                    <Check className="w-3 h-3 text-white" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stroke Width Dropdown */}
      <div className="relative" ref={widthRef}>
        <button
          onClick={() => setIsWidthMenuOpen(!isWidthMenuOpen)}
          className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-slate-100 transition text-xs font-semibold text-slate-700"
          title="Stroke width"
        >
          <span>{currentWidth}px</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {isWidthMenuOpen && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-lg shadow-xl p-1 z-50 w-24 text-xs animate-in fade-in zoom-in-95 duration-100">
            {strokeWidths.map((w) => (
              <button
                key={w}
                onClick={() => {
                  updateStyle({ strokeWidth: w });
                  setIsWidthMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                  currentWidth === w
                    ? 'bg-indigo-50 text-indigo-600 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{w}px</span>
                {currentWidth === w && <Check className="w-3 h-3 text-indigo-600" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Opacity Dropdown */}
      <div className="relative" ref={opacityRef}>
        <button
          onClick={() => setIsOpacityMenuOpen(!isOpacityMenuOpen)}
          className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-slate-100 transition text-xs font-semibold text-slate-700"
          title="Opacity"
        >
          <span>{Math.round(currentOpacity * 100)}%</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>

        {isOpacityMenuOpen && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-lg shadow-xl p-1 z-50 w-24 text-xs animate-in fade-in zoom-in-95 duration-100">
            {opacities.map((op) => (
              <button
                key={op}
                onClick={() => {
                  updateStyle({ opacity: op });
                  setIsOpacityMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                  currentOpacity === op
                    ? 'bg-indigo-50 text-indigo-600 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{Math.round(op * 100)}%</span>
                {currentOpacity === op && <Check className="w-3 h-3 text-indigo-600" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Typography Controls (if Text or Sticky Note) */}
      {isTextBearing && (
        <>
          <div className="h-4 w-px bg-slate-200 mx-0.5" />

          {/* Font Size */}
          <div className="relative" ref={fontSizeRef}>
            <button
              onClick={() => setIsFontSizeMenuOpen(!isFontSizeMenuOpen)}
              className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-slate-100 transition text-xs font-semibold text-slate-700"
              title="Font size"
            >
              <span>{styleConfig.fontSize || 14}px</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isFontSizeMenuOpen && (
              <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-lg shadow-xl p-1 z-50 w-24 text-xs animate-in fade-in zoom-in-95 duration-100">
                {fontSizes.map((sz) => (
                  <button
                    key={sz}
                    onClick={() => {
                      updateStyle({ fontSize: sz });
                      setIsFontSizeMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                      (styleConfig.fontSize || 14) === sz
                        ? 'bg-indigo-50 text-indigo-600 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{sz}px</span>
                    {(styleConfig.fontSize || 14) === sz && <Check className="w-3 h-3 text-indigo-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bold Toggle */}
          <button
            onClick={() =>
              updateStyle({
                fontWeight: styleConfig.fontWeight === 'bold' ? 'normal' : 'bold',
              })
            }
            className={`p-1.5 rounded-full transition ${
              styleConfig.fontWeight === 'bold'
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
            title="Toggle Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          {/* Text Alignment */}
          <button
            onClick={() => {
              const next =
                styleConfig.textAlign === 'left'
                  ? 'center'
                  : styleConfig.textAlign === 'center'
                  ? 'right'
                  : 'left';
              updateStyle({ textAlign: next });
            }}
            className="p-1.5 rounded-full text-slate-600 hover:bg-slate-100 transition"
            title={`Text alignment: ${styleConfig.textAlign || 'left'}`}
          >
            {styleConfig.textAlign === 'center' ? (
              <AlignCenter className="w-3.5 h-3.5" />
            ) : styleConfig.textAlign === 'right' ? (
              <AlignRight className="w-3.5 h-3.5" />
            ) : (
              <AlignLeft className="w-3.5 h-3.5" />
            )}
          </button>
        </>
      )}

      {/* Selected Object Operations: Duplicate & Delete */}
      {selectedObject && (
        <>
          <div className="h-4 w-px bg-slate-200 mx-0.5" />

          {/* Duplicate Action */}
          <button
            onClick={duplicateSelected}
            className="p-1.5 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            title="Duplicate Object (Ctrl+D)"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Delete Action */}
          <button
            onClick={deleteSelected}
            className="p-1.5 rounded-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition"
            title="Delete Object (Del)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* More Menu */}
          <div className="relative" ref={moreRef}>
            <button
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className="p-1.5 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
              title="More actions"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {isMoreMenuOpen && (
              <div className="absolute top-8 right-0 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 w-40 text-xs animate-in fade-in zoom-in-95 duration-100">
                <button
                  onClick={() => {
                    bringForwardSelected();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 transition"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Bring Forward</span>
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
