import React, { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { STICKY_TEMPLATES } from '../../engine/stickyNoteTemplates';
import {
  ChevronDown,
  MoreHorizontal,
  Copy,
  Trash2,
  Layers,
  Check,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Square,
  Circle,
  StickyNote,
  Type,
  PenTool,
  Highlighter,
  Eraser,
  MoveRight,
  Diamond,
  Triangle,
  ArrowDown,
  Sparkles,
} from 'lucide-react';

const FONTS = [
  'Plus Jakarta Sans',
  'Arial',
  'Georgia',
  'Verdana',
  'Trebuchet MS',
  'Courier New',
  'Times New Roman',
];

export const ContextualStyleBar: React.FC = () => {
  const {
    activeTool,
    styleConfig,
    updateStyle,
    duplicateSelected,
    deleteSelected,
    bringForwardSelected,
    sendBackwardSelected,
    applyTextStyle,
    highlightSelectedText,
    highlightWholeText,
    changeStickyTemplate,
    selectedCanvasObject,
    selectedMockObjectId,
    hasActiveObject,
    mockObjects,
    selectionScreenBounds,
  } = useWorkspace();

  const [isFillPickerOpen, setIsFillPickerOpen] = useState(false);
  const [isStrokePickerOpen, setIsStrokePickerOpen] = useState(false);
  const [isWidthMenuOpen, setIsWidthMenuOpen] = useState(false);
  const [isOpacityMenuOpen, setIsOpacityMenuOpen] = useState(false);
  const [isFontSizeMenuOpen, setIsFontSizeMenuOpen] = useState(false);
  const [isFontFamilyMenuOpen, setIsFontFamilyMenuOpen] = useState(false);
  const [isLineSpacingMenuOpen, setIsLineSpacingMenuOpen] = useState(false);
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const fillRef = useRef<HTMLDivElement>(null);
  const strokeRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef<HTMLDivElement>(null);
  const opacityRef = useRef<HTMLDivElement>(null);
  const fontSizeRef = useRef<HTMLDivElement>(null);
  const fontFamilyRef = useRef<HTMLDivElement>(null);
  const lineSpacingRef = useRef<HTMLDivElement>(null);
  const templateRef = useRef<HTMLDivElement>(null);
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
      if (fontFamilyRef.current && !fontFamilyRef.current.contains(target)) setIsFontFamilyMenuOpen(false);
      if (lineSpacingRef.current && !lineSpacingRef.current.contains(target)) setIsLineSpacingMenuOpen(false);
      if (templateRef.current && !templateRef.current.contains(target)) setIsTemplateMenuOpen(false);
      if (moreRef.current && !moreRef.current.contains(target)) setIsMoreMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedObject = selectedCanvasObject || (selectedMockObjectId
    ? mockObjects.find((o) => o.id === selectedMockObjectId) || null
    : null);

  // Show only if an object is selected, OR if stylable tool is active
  const isStylableTool = [
    'brush',
    'highlighter',
    'eraser',
    'rectangle',
    'rounded-rectangle',
    'circle',
    'ellipse',
    'diamond',
    'triangle',
    'sticky',
    'text',
  ].includes(activeTool);

  const shouldShow =
    hasActiveObject ||
    selectedObject !== null ||
    (isStylableTool && activeTool !== 'select' && activeTool !== 'pan');

  if (!shouldShow) return null;

  const isMultiSelection = Boolean(
    selectedObject && (
      selectedObject.type === 'select' ||
      selectedObject.id?.startsWith('selection') ||
      selectedObject.id?.startsWith('group')
    )
  );

  const targetType = selectedObject ? selectedObject.type : activeTool;
  const isSticky = targetType === 'sticky';
  const isText = targetType === 'text';
  const isTextBearing = isText || isSticky;
  const isFillableShape = [
    'rectangle',
    'rounded-rectangle',
    'circle',
    'ellipse',
    'diamond',
    'triangle',
  ].includes(targetType) || isMultiSelection;

  const strokeWidths = [1, 2, 4, 8, 12];
  const opacities = [1, 0.75, 0.5, 0.25];
  const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 40, 48];
  const lineSpacings = [0.9, 1.0, 1.2, 1.5, 1.8, 2.0];

  const fillPresets = [
    'transparent',
    '#FFF9F0',
    '#FFFFFF',
    '#FFF0ED',
    '#F7D774',
    '#A8B9A0',
    '#6D3B67',
    '#ECFDF5',
    '#FEF08A',
    '#FED7AA',
  ];

  const strokePresets = [
    '#F26B5B',
    '#6D3B67',
    '#302633',
    '#F7D774',
    '#A8B9A0',
    '#10B981',
    '#0EA5E9',
    '#94A3B8',
  ];

  const getTargetIcon = (type: string) => {
    switch (type) {
      case 'sticky': return <StickyNote className="w-3.5 h-3.5 text-[#F7D774]" />;
      case 'circle': return <Circle className="w-3.5 h-3.5 text-[#6D3B67]" />;
      case 'ellipse': return <Circle className="w-3.5 h-3.5 scale-x-125 text-[#6D3B67]" />;
      case 'rounded-rectangle': return <Square className="w-3.5 h-3.5 rounded-xs text-[#6D3B67]" />;
      case 'text': return <Type className="w-3.5 h-3.5 text-[#302633]" />;
      case 'brush': return <PenTool className="w-3.5 h-3.5 text-[#F26B5B]" />;
      case 'highlighter': return <Highlighter className="w-3.5 h-3.5 text-[#F7D774]" />;
      case 'eraser': return <Eraser className="w-3.5 h-3.5 text-[#F26B5B]" />;
      case 'arrow': return <MoveRight className="w-3.5 h-3.5 text-[#F26B5B]" />;
      case 'diamond': return <Diamond className="w-3.5 h-3.5 text-[#6D3B67]" />;
      case 'triangle': return <Triangle className="w-3.5 h-3.5 text-[#6D3B67]" />;
      default: return <Square className="w-3.5 h-3.5 text-[#6D3B67]" />;
    }
  };

  // Determine current active properties accurately from selected object or defaults
  const currentFill = selectedObject?.fillColor ?? styleConfig.fillColor ?? '#FFF9F0';
  const currentStroke = isTextBearing
    ? (selectedObject?.fillColor || selectedObject?.strokeColor || '#302633')
    : (selectedObject?.strokeColor ?? styleConfig.strokeColor ?? '#F26B5B');
  const currentWidth = selectedObject?.strokeWidth ?? styleConfig.strokeWidth ?? 2;
  const currentOpacity = selectedObject?.opacity !== undefined ? selectedObject.opacity : (styleConfig.opacity ?? 1);
  const currentFontFamily = selectedObject?.fontFamily || 'Arial';
  const currentFontSize = selectedObject?.fontSize || styleConfig.fontSize || 20;
  const isBold = selectedObject ? selectedObject.fontWeight === 'bold' : (styleConfig.fontWeight === 'bold');
  const isItalic = selectedObject ? selectedObject.fontStyle === 'italic' : false;
  const isUnderline = selectedObject ? Boolean(selectedObject.underline) : false;
  const currentTextAlign = selectedObject?.textAlign || styleConfig.textAlign || 'left';
  const currentLineHeight = selectedObject?.lineHeight || 1.2;
  const currentStickyTemplate = selectedObject?.template || 'sunny';

  // Dynamic positioning calculation
  let stylePosition: React.CSSProperties = {
    top: '104px',
    left: '50%',
    transform: 'translateX(-50%)',
  };

  if (selectionScreenBounds && (hasActiveObject || selectedObject)) {
    const barWidthEstimate = 560;
    const barHeightEstimate = 44;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

    let left = selectionScreenBounds.left + selectionScreenBounds.width / 2;
    // Position comfortably above the object, clearing Fabric's rotation handle (offset at -40px)
    let top = selectionScreenBounds.top - barHeightEstimate - 60;

    if (top < 70) {
      top = selectionScreenBounds.top + selectionScreenBounds.height + 24;
    }

    const halfWidth = barWidthEstimate / 2;
    if (left - halfWidth < 20) {
      left = halfWidth + 20;
    } else if (left + halfWidth > viewportWidth - 20) {
      left = viewportWidth - halfWidth - 20;
    }

    top = Math.max(64, Math.min(viewportHeight - barHeightEstimate - 20, top));

    stylePosition = {
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
      transform: 'translateX(-50%)',
    };
  }

  return (
    <div
      style={stylePosition}
      className="fixed z-20 rounded-full shadow-lg bg-white/95 backdrop-blur-xs border border-[#EFE5D8] px-3 py-1.5 flex items-center gap-2 select-none animate-in fade-in zoom-in-95 duration-100 max-w-[96vw] overflow-x-auto transition-all text-[#302633]"
      role="toolbar"
      aria-label="Contextual style bar"
    >
      {/* Target Type Badge */}
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FFF9F0] border border-[#EFE5D8] text-[#302633] text-xs font-semibold shrink-0">
        {getTargetIcon(targetType)}
        <span className="capitalize">{targetType.replace('-', ' ')}</span>
      </div>

      <div className="h-4 w-px bg-[#EFE5D8] mx-0.5 shrink-0" />

      {/* 1. STICKY NOTE: Template Switcher Popover */}
      {isSticky && (
        <div className="relative shrink-0" ref={templateRef}>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition text-xs font-medium cursor-pointer"
            title="Switch Sticky Note Template"
          >
            <span>{STICKY_TEMPLATES[currentStickyTemplate]?.name || 'Template'}</span>
            <ChevronDown className="w-3 h-3 text-amber-700" />
          </button>

          {isTemplateMenuOpen && (
            <div className="absolute top-8 left-0 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-50 w-52 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Template
              </div>
              {Object.entries(STICKY_TEMPLATES).map(([key, t]) => (
                <button
                  key={key}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    changeStickyTemplate(key);
                    setIsTemplateMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg transition cursor-pointer ${
                    currentStickyTemplate === key
                      ? 'bg-amber-50 text-amber-900 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <img
                    src={t.image}
                    alt={t.name}
                    className="w-5 h-5 rounded object-cover shadow-2xs border border-slate-200"
                  />
                  <span className="truncate">{t.name}</span>
                  {currentStickyTemplate === key && (
                    <Check className="w-3.5 h-3.5 text-amber-600 ml-auto" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. TEXT & STICKY: Font Family Picker */}
      {isTextBearing && (
        <div className="relative shrink-0" ref={fontFamilyRef}>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setIsFontFamilyMenuOpen(!isFontFamilyMenuOpen)}
            className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-slate-100 transition text-xs font-medium text-slate-700"
            title="Font Family"
          >
            <span style={{ fontFamily: currentFontFamily }}>{currentFontFamily}</span>
            <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
          </button>

          {isFontFamilyMenuOpen && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-xl shadow-xl p-1 z-50 w-36 text-xs animate-in fade-in zoom-in-95 duration-100">
              {FONTS.map((f) => (
                <button
                  key={f}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    applyTextStyle({ fontFamily: f });
                    setIsFontFamilyMenuOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md transition cursor-pointer ${
                    currentFontFamily === f
                      ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold'
                      : 'hover:bg-[#FFF9F0] text-[#302633]'
                  }`}
                  style={{ fontFamily: f }}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. SHAPES (fillable): Fill Color Picker */}
      {isFillableShape && (
        <div className="relative shrink-0" ref={fillRef}>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setIsFillPickerOpen(!isFillPickerOpen)}
            className="flex items-center gap-1 px-1.5 py-1 rounded-full hover:bg-slate-100 transition text-xs font-medium text-slate-700 cursor-pointer"
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
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      updateStyle({ fillColor: c });
                      setIsFillPickerOpen(false);
                    }}
                    className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center transition hover:scale-110 shadow-2xs cursor-pointer"
                    style={{ backgroundColor: c === 'transparent' ? '#ffffff' : c }}
                    title={c === 'transparent' ? 'Hollow / Transparent' : c}
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

      {/* 4. TEXT ONLY: Text Background Color Picker */}
      {isText && (
        <div className="relative shrink-0" ref={fillRef}>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setIsFillPickerOpen(!isFillPickerOpen)}
            className="flex items-center gap-1 px-1.5 py-1 rounded-full hover:bg-slate-100 transition text-xs font-medium text-slate-700 cursor-pointer"
            title="Text background color"
          >
            <span
              className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs block"
              style={{
                backgroundColor:
                  selectedObject?.backgroundColor && selectedObject.backgroundColor !== 'transparent'
                    ? selectedObject.backgroundColor
                    : '#FFFFFF',
              }}
            />
            <span className="text-[11px] hidden sm:inline">Text BG</span>
            <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
          </button>

          {isFillPickerOpen && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-xl shadow-xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 w-44">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Text Background
              </div>
              <div className="grid grid-cols-4 gap-2">
                {fillPresets.map((c) => (
                  <button
                    key={c}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      applyTextStyle({ backgroundColor: c });
                      setIsFillPickerOpen(false);
                    }}
                    className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center transition hover:scale-110 shadow-2xs cursor-pointer"
                    style={{ backgroundColor: c === 'transparent' ? '#ffffff' : c }}
                    title={c}
                  >
                    {(selectedObject?.backgroundColor || '').toLowerCase() === c.toLowerCase() && (
                      <Check className="w-3 h-3 text-slate-700" />
                    )}
                  </button>
                ))}
              </div>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  applyTextStyle({ backgroundColor: 'transparent' });
                  setIsFillPickerOpen(false);
                }}
                className="w-full mt-2 text-center py-1 text-[10px] text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded cursor-pointer"
              >
                Clear Background
              </button>
            </div>
          )}
        </div>
      )}

      {/* 5. STROKE COLOR / TEXT COLOR PICKER */}
      <div className="relative shrink-0" ref={strokeRef}>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setIsStrokePickerOpen(!isStrokePickerOpen)}
          className="flex items-center gap-1 px-1.5 py-1 rounded-full hover:bg-slate-100 transition text-xs font-medium text-slate-700"
          title={isTextBearing ? 'Text Color' : 'Stroke Color'}
        >
          <span
            className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs block"
            style={{ backgroundColor: currentStroke }}
          />
          <span className="text-[11px] hidden sm:inline">
            {isTextBearing ? 'Text Color' : 'Stroke'}
          </span>
          <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
        </button>

        {isStrokePickerOpen && (
          <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white border border-slate-200 rounded-xl shadow-xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-100 w-44">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {isTextBearing ? 'Text Color' : 'Stroke Color'}
            </div>
            <div className="grid grid-cols-4 gap-2">
              {strokePresets.map((c) => (
                <button
                  key={c}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    if (isTextBearing) {
                      applyTextStyle({ fill: c });
                      updateStyle({ strokeColor: c, fillColor: c });
                    } else {
                      updateStyle({ strokeColor: c });
                    }
                    setIsStrokePickerOpen(false);
                  }}
                  className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center transition hover:scale-110 shadow-2xs cursor-pointer"
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

      {/* 6. STROKE WIDTH (Shapes & Drawings ONLY - never on text or sticky) */}
      {!isTextBearing && (
        <div className="relative shrink-0" ref={widthRef}>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setIsWidthMenuOpen(!isWidthMenuOpen)}
            className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-slate-100 transition text-xs font-semibold text-slate-700 cursor-pointer"
            title="Stroke width"
          >
            <span>{currentWidth}px</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {isWidthMenuOpen && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white border border-[#EFE5D8] rounded-xl shadow-xl p-1 z-50 w-24 text-xs animate-in fade-in zoom-in-95 duration-100">
              {strokeWidths.map((w) => (
                <button
                  key={w}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    updateStyle({ strokeWidth: w });
                    setIsWidthMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                    currentWidth === w
                      ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold'
                      : 'text-[#302633] hover:bg-[#FFF9F0]'
                  }`}
                >
                  <span>{w}px</span>
                  {currentWidth === w && <Check className="w-3 h-3 text-[#F26B5B]" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 7. OPACITY (All Objects) */}
      <div className="relative shrink-0" ref={opacityRef}>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => setIsOpacityMenuOpen(!isOpacityMenuOpen)}
          className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-[#FFF9F0] transition text-xs font-semibold text-[#302633] cursor-pointer"
          title="Opacity"
        >
          <span>{Math.round(currentOpacity * 100)}%</span>
          <ChevronDown className="w-3 h-3 text-[#302633]/40" />
        </button>

          {isOpacityMenuOpen && (
            <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white border border-[#EFE5D8] rounded-xl shadow-xl p-1 z-50 w-24 text-xs animate-in fade-in zoom-in-95 duration-100">
              {opacities.map((op) => (
                <button
                  key={op}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    updateStyle({ opacity: op });
                    setIsOpacityMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                    currentOpacity === op
                      ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold'
                      : 'text-[#302633] hover:bg-[#FFF9F0]'
                  }`}
                >
                  <span>{Math.round(op * 100)}%</span>
                  {currentOpacity === op && <Check className="w-3 h-3 text-[#F26B5B]" />}
                </button>
              ))}
            </div>
          )}
      </div>

      {/* 8. TYPOGRAPHY CONTROLS (Text & Sticky Notes) */}
      {isTextBearing && (
        <>
          <div className="h-4 w-px bg-[#EFE5D8] mx-0.5 shrink-0" />

          {/* Font Size */}
          <div className="relative shrink-0" ref={fontSizeRef}>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setIsFontSizeMenuOpen(!isFontSizeMenuOpen)}
              className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-[#FFF9F0] transition text-xs font-semibold text-[#302633] cursor-pointer"
              title="Font size"
            >
              <span>{currentFontSize}px</span>
              <ChevronDown className="w-3 h-3 text-[#302633]/40" />
            </button>

            {isFontSizeMenuOpen && (
              <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white border border-[#EFE5D8] rounded-xl shadow-xl p-1 z-50 w-24 text-xs max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
                {fontSizes.map((sz) => (
                  <button
                    key={sz}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      applyTextStyle({ fontSize: sz });
                      updateStyle({ fontSize: sz });
                      setIsFontSizeMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition cursor-pointer ${
                      currentFontSize === sz
                        ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold'
                        : 'text-[#302633] hover:bg-[#FFF9F0]'
                    }`}
                  >
                    <span>{sz}px</span>
                    {currentFontSize === sz && <Check className="w-3 h-3 text-[#F26B5B]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bold Toggle */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              const nextBold = !isBold;
              updateStyle({ fontWeight: nextBold ? 'bold' : 'normal' });
              applyTextStyle({ bold: nextBold });
            }}
            className={`p-1.5 rounded-full transition shrink-0 cursor-pointer ${
              isBold
                ? 'bg-[#FFF0ED] text-[#F26B5B] font-bold ring-1 ring-[#FCD9D3]'
                : 'text-[#302633]/70 hover:bg-[#FFF9F0]'
            }`}
            title="Toggle Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          {/* Italic Toggle */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              applyTextStyle({ italic: !isItalic });
            }}
            className={`p-1.5 rounded-full transition shrink-0 cursor-pointer ${
              isItalic
                ? 'bg-[#FFF0ED] text-[#F26B5B] ring-1 ring-[#FCD9D3]'
                : 'text-[#302633]/70 hover:bg-[#FFF9F0]'
            }`}
            title="Toggle Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          {/* Underline Toggle */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              applyTextStyle({ underline: !isUnderline });
            }}
            className={`p-1.5 rounded-full transition shrink-0 cursor-pointer ${
              isUnderline
                ? 'bg-[#FFF0ED] text-[#F26B5B] ring-1 ring-[#FCD9D3]'
                : 'text-[#302633]/70 hover:bg-[#FFF9F0]'
            }`}
            title="Toggle Underline"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          {/* Text Alignment */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              const next =
                currentTextAlign === 'left'
                  ? 'center'
                  : currentTextAlign === 'center'
                  ? 'right'
                  : 'left';
              updateStyle({ textAlign: next });
              applyTextStyle({ textAlign: next });
            }}
            className="p-1.5 rounded-full text-[#302633]/70 hover:bg-[#FFF9F0] transition shrink-0 cursor-pointer"
            title={`Text alignment: ${currentTextAlign}`}
          >
            {currentTextAlign === 'center' ? (
              <AlignCenter className="w-3.5 h-3.5 text-[#F26B5B]" />
            ) : currentTextAlign === 'right' ? (
              <AlignRight className="w-3.5 h-3.5 text-[#F26B5B]" />
            ) : (
              <AlignLeft className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Line Spacing Dropdown (Standalone text only) */}
          {isText && (
            <div className="relative shrink-0" ref={lineSpacingRef}>
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setIsLineSpacingMenuOpen(!isLineSpacingMenuOpen)}
                className="flex items-center gap-1 px-1.5 py-1 rounded-full hover:bg-[#FFF9F0] transition text-[11px] font-medium text-[#302633]/70 cursor-pointer"
                title="Line spacing"
              >
                <span>{currentLineHeight}x</span>
                <ChevronDown className="w-2.5 h-2.5 text-[#302633]/40" />
              </button>

              {isLineSpacingMenuOpen && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-white border border-[#EFE5D8] rounded-xl shadow-xl p-1 z-50 w-24 text-xs animate-in fade-in zoom-in-95 duration-100">
                  {lineSpacings.map((ls) => (
                    <button
                      key={ls}
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        applyTextStyle({ lineHeight: ls });
                        setIsLineSpacingMenuOpen(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md transition cursor-pointer ${
                        currentLineHeight === ls
                          ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold'
                          : 'hover:bg-[#FFF9F0] text-[#302633]'
                      }`}
                    >
                      {ls}x
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Highlight Selection in Text (Standalone text only) */}
          {isText && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => highlightSelectedText()}
              className="p-1.5 rounded-full text-amber-600 hover:bg-amber-50 transition shrink-0"
              title="Highlight selected text characters"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}
        </>
      )}

      {/* 9. SELECTED OBJECT OPERATIONS: Duplicate & Delete */}
      {selectedObject && (
        <>
          <div className="h-4 w-px bg-slate-200 mx-0.5 shrink-0" />

          {/* Duplicate Action */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={duplicateSelected}
            className="p-1.5 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition shrink-0 cursor-pointer"
            title="Duplicate Object (Ctrl+D)"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Delete Action */}
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={deleteSelected}
            className="p-1.5 rounded-full text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition shrink-0 cursor-pointer"
            title="Delete Object (Del)"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* More Menu */}
          <div className="relative shrink-0" ref={moreRef}>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className="p-1.5 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              title="More actions"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {isMoreMenuOpen && (
              <div className="absolute top-8 right-0 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 w-40 text-xs animate-in fade-in zoom-in-95 duration-100">
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    bringForwardSelected();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Bring to Front</span>
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    sendBackwardSelected();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5 text-slate-400" />
                  <span>Send to Back</span>
                </button>
                {isText && (
                  <button
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      highlightWholeText();
                      setIsMoreMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-amber-700 hover:bg-amber-50 transition"
                  >
                    <Highlighter className="w-3.5 h-3.5 text-amber-500" />
                    <span>Highlight Box</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
