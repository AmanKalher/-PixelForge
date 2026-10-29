import React, { useState, useRef, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { STICKY_TEMPLATES } from '../../engine/stickyNoteTemplates';
import { TextFormattingToolbar } from '../toolbar/TextFormattingToolbar';
import {
  ChevronDown,
  MoreHorizontal,
  Copy,
  Trash2,
  Layers,
  Check,
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
  Lock,
  Unlock,
  Star,
  Heart,
  Hexagon,
  Table as TableIcon,
  BarChart2,
} from 'lucide-react';

export const ContextualStyleBar: React.FC = () => {
  const {
    activeTool,
    styleConfig,
    updateStyle,
    duplicateSelected,
    deleteSelected,
    bringForwardSelected,
    sendBackwardSelected,
    lockSelected,
    isSelectionLocked,
    groupSelected,
    ungroupSelected,
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
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const fillRef = useRef<HTMLDivElement>(null);
  const strokeRef = useRef<HTMLDivElement>(null);
  const widthRef = useRef<HTMLDivElement>(null);
  const opacityRef = useRef<HTMLDivElement>(null);
  const templateRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);

  const toggleFillPicker = () => {
    setIsStrokePickerOpen(false);
    setIsWidthMenuOpen(false);
    setIsOpacityMenuOpen(false);
    setIsTemplateMenuOpen(false);
    setIsMoreMenuOpen(false);
    setIsFillPickerOpen((prev) => !prev);
  };

  const toggleStrokePicker = () => {
    setIsFillPickerOpen(false);
    setIsWidthMenuOpen(false);
    setIsOpacityMenuOpen(false);
    setIsTemplateMenuOpen(false);
    setIsMoreMenuOpen(false);
    setIsStrokePickerOpen((prev) => !prev);
  };

  const toggleWidthMenu = () => {
    setIsFillPickerOpen(false);
    setIsStrokePickerOpen(false);
    setIsOpacityMenuOpen(false);
    setIsTemplateMenuOpen(false);
    setIsMoreMenuOpen(false);
    setIsWidthMenuOpen((prev) => !prev);
  };

  const toggleOpacityMenu = () => {
    setIsFillPickerOpen(false);
    setIsStrokePickerOpen(false);
    setIsWidthMenuOpen(false);
    setIsTemplateMenuOpen(false);
    setIsMoreMenuOpen(false);
    setIsOpacityMenuOpen((prev) => !prev);
  };

  const toggleTemplateMenu = () => {
    setIsFillPickerOpen(false);
    setIsStrokePickerOpen(false);
    setIsWidthMenuOpen(false);
    setIsOpacityMenuOpen(false);
    setIsMoreMenuOpen(false);
    setIsTemplateMenuOpen((prev) => !prev);
  };

  const toggleMoreMenu = () => {
    setIsFillPickerOpen(false);
    setIsStrokePickerOpen(false);
    setIsWidthMenuOpen(false);
    setIsOpacityMenuOpen(false);
    setIsTemplateMenuOpen(false);
    setIsMoreMenuOpen((prev) => !prev);
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (fillRef.current && !fillRef.current.contains(target)) setIsFillPickerOpen(false);
      if (strokeRef.current && !strokeRef.current.contains(target)) setIsStrokePickerOpen(false);
      if (widthRef.current && !widthRef.current.contains(target)) setIsWidthMenuOpen(false);
      if (opacityRef.current && !opacityRef.current.contains(target)) setIsOpacityMenuOpen(false);
      if (templateRef.current && !templateRef.current.contains(target)) setIsTemplateMenuOpen(false);
      if (moreRef.current && !moreRef.current.contains(target)) setIsMoreMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedObject = selectedCanvasObject || (selectedMockObjectId
    ? mockObjects.find((o) => o.id === selectedMockObjectId) || null
    : null);

  // Reset all open popovers whenever selection changes or is cleared
  useEffect(() => {
    if (!selectedObject) {
      setIsFillPickerOpen(false);
      setIsStrokePickerOpen(false);
      setIsWidthMenuOpen(false);
      setIsOpacityMenuOpen(false);
      setIsTemplateMenuOpen(false);
      setIsMoreMenuOpen(false);
    }
  }, [selectedObject?.id]);

  // Contextual toolbar must ONLY be shown when a relevant object is actively selected
  const shouldShow = Boolean(selectedObject && (hasActiveObject || selectedCanvasObject || selectedMockObjectId));

  if (!shouldShow || !selectedObject) return null;

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

  const NON_FILLABLE_TYPES = new Set([
    'line',
    'arrow',
    'wavy',
    'smooth',
    'hinged',
    'line_straight',
    'line_arrow',
    'line_bidirectional',
    'line_dashed',
    'curve',
    'curve_smooth',
    'curve_wavy',
    'curve_hinged',
    'brush',
    'highlighter',
    'eraser',
    'pen',
    'marker',
    'pencil',
    'calligraphy',
    'stroke',
    'table',
    'graph',
    'image',
    'text',
    'sticky',
  ]);

  const isFillableShape =
    isMultiSelection || (!NON_FILLABLE_TYPES.has(targetType) && !isText && !isSticky);

  const strokeWidths = [1, 2, 4, 8, 12];
  const opacities = [1, 0.75, 0.5, 0.25];

  const fillPresets = [
    'transparent',
    '#FFF9F0',
    '#FFFFFF',
    '#FFF0ED',
    '#F26B5B',
    '#F7D774',
    '#A8B9A0',
    '#6D3B67',
    '#ECFDF5',
    '#FEF08A',
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
      case 'rounded-rectangle':
      case 'roundedRect':
      case 'square': return <Square className="w-3.5 h-3.5 rounded-xs text-[#6D3B67]" />;
      case 'text': return <Type className="w-3.5 h-3.5 text-[#302633]" />;
      case 'brush': return <PenTool className="w-3.5 h-3.5 text-[#F26B5B]" />;
      case 'highlighter': return <Highlighter className="w-3.5 h-3.5 text-[#F7D774]" />;
      case 'eraser': return <Eraser className="w-3.5 h-3.5 text-[#F26B5B]" />;
      case 'arrow': return <MoveRight className="w-3.5 h-3.5 text-[#F26B5B]" />;
      case 'diamond': return <Diamond className="w-3.5 h-3.5 text-[#6D3B67]" />;
      case 'triangle': return <Triangle className="w-3.5 h-3.5 text-[#6D3B67]" />;
      case 'heart': return <Heart className="w-3.5 h-3.5 text-[#F26B5B]" />;
      case 'table': return <TableIcon className="w-3.5 h-3.5 text-[#818CF8]" />;
      case 'graph': return <BarChart2 className="w-3.5 h-3.5 text-[#10B981]" />;
      default:
        if (type.startsWith('star') || type === 'burst' || type === 'sun') {
          return <Star className="w-3.5 h-3.5 text-[#F7D774]" />;
        }
        if (type.startsWith('arrow') || type.includes('chevron')) {
          return <MoveRight className="w-3.5 h-3.5 text-[#F26B5B]" />;
        }
        if (['pentagon', 'hexagon', 'heptagon', 'octagon', 'nonagon', 'decagon'].includes(type)) {
          return <Hexagon className="w-3.5 h-3.5 text-[#6D3B67]" />;
        }
        return <Square className="w-3.5 h-3.5 text-[#6D3B67]" />;
    }
  };

  const formatTargetLabel = (type: string) => {
    if (type === 'table') return 'Table';
    if (type === 'graph') return 'Chart';
    if (type === 'star4') return 'Star (4-pt)';
    if (type === 'star5') return 'Star (5-pt)';
    if (type === 'star6') return 'Star (6-pt)';
    if (type === 'star8') return 'Star (8-pt)';
    if (type === 'doubleArrow') return 'Double arrow';
    if (type === 'arrowUp') return 'Up arrow';
    if (type === 'arrowDown') return 'Down arrow';
    if (type === 'arrowLeft') return 'Left arrow';
    if (type === 'arrowRight') return 'Right arrow';
    const spaced = type.replace(/([A-Z])/g, ' $1').replace(/[-_]/g, ' ').trim();
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
  };

  // Determine current active properties accurately from selected object or defaults
  const currentFill = selectedObject?.fillColor ?? styleConfig.fillColor ?? '#FFF9F0';
  const currentStroke = isTextBearing
    ? (selectedObject?.fillColor || selectedObject?.strokeColor || '#302633')
    : (selectedObject?.strokeColor ?? styleConfig.strokeColor ?? '#F26B5B');
  const currentWidth = selectedObject?.strokeWidth ?? styleConfig.strokeWidth ?? 2;
  const currentOpacity = selectedObject?.opacity !== undefined ? selectedObject.opacity : (styleConfig.opacity ?? 1);
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

    if (top < 86) {
      top = selectionScreenBounds.top + selectionScreenBounds.height + 24;
    }

    const halfWidth = barWidthEstimate / 2;
    if (left - halfWidth < 20) {
      left = halfWidth + 20;
    } else if (left + halfWidth > viewportWidth - 20) {
      left = viewportWidth - halfWidth - 20;
    }

    top = Math.max(86, Math.min(viewportHeight - barHeightEstimate - 20, top));

    stylePosition = {
      top: `${Math.round(top)}px`,
      left: `${Math.round(left)}px`,
      transform: 'translateX(-50%)',
    };
  }

  const currentTopNumeric = stylePosition.top ? parseInt(String(stylePosition.top), 10) : 100;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;
  const opensUpward = currentTopNumeric > (viewportHeight - 260);
  const popoverPositionClass = opensUpward ? 'bottom-full mb-2' : 'top-full mt-2';

  return (
    <div
      style={stylePosition}
      className="fixed z-20 rounded-full shadow-lg bg-white/95 backdrop-blur-xs border border-[#EFE5D8] px-3 py-1.5 flex items-center gap-2 select-none animate-in fade-in zoom-in-95 duration-100 max-w-[96vw] overflow-visible transition-all text-[#302633]"
      role="toolbar"
      aria-label="Contextual style bar"
    >
      {/* Target Type Badge */}
      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#FFF9F0] border border-[#EFE5D8] text-[#302633] text-xs font-semibold shrink-0">
        {getTargetIcon(targetType)}
        <span>{formatTargetLabel(targetType)}</span>
      </div>

      <div className="h-4 w-px bg-[#EFE5D8] mx-0.5 shrink-0" />

      {/* 1. STICKY NOTE: Template Switcher Popover */}
      {isSticky && (
        <div className="relative shrink-0" ref={templateRef}>
          <button
            onMouseDown={(e) => e.preventDefault()}
            onClick={toggleTemplateMenu}
            className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 transition text-xs font-medium cursor-pointer"
            title="Switch Sticky Note Template"
          >
            <span>{STICKY_TEMPLATES[currentStickyTemplate]?.name || 'Template'}</span>
            <ChevronDown className="w-3 h-3 text-amber-700" />
          </button>

          {isTemplateMenuOpen && (
            <div className={`absolute ${popoverPositionClass} left-0 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-50 w-52 text-xs space-y-1 animate-in fade-in zoom-in-95 duration-100`}>
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

      {/* 2. TEXT & STICKY: Complete Text Formatting Toolbar */}
      {isTextBearing ? (
        <>
          <TextFormattingToolbar />
          {isText && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => highlightSelectedText()}
              className="p-1.5 rounded-full text-amber-600 hover:bg-amber-50 transition shrink-0 cursor-pointer"
              title="Highlight selected text characters"
              aria-label="Highlight selected text characters"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          )}
        </>
      ) : (
        <>
          {/* 3. SHAPES (fillable): Fill Color Picker */}
          {isFillableShape && (
            <div className="relative shrink-0" ref={fillRef}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={toggleFillPicker}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-[#FFF9F0] transition text-xs font-medium text-[#302633] cursor-pointer"
                title="Fill color"
              >
                <span
                  className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs block relative overflow-hidden shrink-0"
                  style={{
                    backgroundColor: currentFill === 'transparent' ? '#FFFFFF' : currentFill,
                  }}
                >
                  {currentFill === 'transparent' && (
                    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="w-[140%] h-0.5 bg-rose-500 rotate-45 block" />
                    </span>
                  )}
                </span>
                <span className="text-[11px] hidden sm:inline font-semibold">Fill</span>
                <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
              </button>

              {isFillPickerOpen && (
                <div
                  onMouseDown={(e) => e.stopPropagation()}
                  className={`absolute ${popoverPositionClass} left-1/2 -translate-x-1/2 bg-white border border-[#EFE5D8] rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100 w-52`}
                >
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                    <span>Fill Color</span>
                    {currentFill === 'transparent' ? (
                      <span className="text-amber-600 font-medium lowercase">hollow</span>
                    ) : (
                      <span className="font-mono text-[9px] lowercase">{currentFill}</span>
                    )}
                  </div>

                  {/* Preset Swatches */}
                  <div className="grid grid-cols-5 gap-1.5 mb-2.5">
                    {fillPresets.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          updateStyle({ fillColor: c });
                          setIsFillPickerOpen(false);
                        }}
                        className="w-6 h-6 rounded-full border border-slate-200 flex items-center justify-center transition hover:scale-110 shadow-2xs cursor-pointer relative overflow-hidden"
                        style={{ backgroundColor: c === 'transparent' ? '#ffffff' : c }}
                        title={c === 'transparent' ? 'No Fill / Transparent' : c}
                      >
                        {c === 'transparent' && (
                          <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <span className="w-[140%] h-0.5 bg-rose-500 rotate-45 block" />
                          </span>
                        )}
                        {currentFill.toLowerCase() === c.toLowerCase() && (
                          <Check className="w-3 h-3 text-slate-800 relative z-10" />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Custom Picker and Clear Button */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#F0EAE1]">
                    <label className="color-control text-xs" onMouseDown={(e) => e.stopPropagation()}>
                      <span>Custom</span>
                      <input
                        type="color"
                        aria-label="Custom fill color"
                        value={currentFill === 'transparent' ? '#FFF9F0' : currentFill}
                        onInput={(e) => {
                          updateStyle({ fillColor: (e.target as HTMLInputElement).value });
                        }}
                        onChange={(e) => {
                          updateStyle({ fillColor: e.target.value });
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        updateStyle({ fillColor: 'transparent' });
                        setIsFillPickerOpen(false);
                      }}
                      className={`text-[11px] px-2 py-1 rounded transition font-medium cursor-pointer ${
                        currentFill === 'transparent'
                          ? 'bg-[#FFF0ED] text-[#F26B5B] font-bold border border-[#FCD9D3]'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                      title="Clear Fill / Make Hollow"
                    >
                      No Fill
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4. STROKE COLOR PICKER */}
          <div className="relative shrink-0" ref={strokeRef}>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={toggleStrokePicker}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full hover:bg-[#FFF9F0] transition text-xs font-medium text-[#302633] cursor-pointer"
              title="Stroke Color"
            >
              <span
                className="w-4 h-4 rounded-full border border-slate-300 shadow-2xs block relative overflow-hidden shrink-0"
                style={{
                  backgroundColor: currentStroke === 'transparent' ? '#FFFFFF' : currentStroke,
                }}
              >
                {currentStroke === 'transparent' && (
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="w-[140%] h-0.5 bg-rose-500 rotate-45 block" />
                  </span>
                )}
              </span>
              <span className="text-[11px] hidden sm:inline font-semibold">Stroke</span>
              <ChevronDown className="w-2.5 h-2.5 text-slate-400" />
            </button>

            {isStrokePickerOpen && (
              <div
                onMouseDown={(e) => e.stopPropagation()}
                className={`absolute ${popoverPositionClass} left-1/2 -translate-x-1/2 bg-white border border-[#EFE5D8] rounded-xl shadow-xl p-3 z-50 animate-in fade-in zoom-in-95 duration-100 w-52`}
              >
                <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  <span>Stroke Color</span>
                  {currentStroke === 'transparent' ? (
                    <span className="text-amber-600 font-medium lowercase">none</span>
                  ) : (
                    <span className="font-mono text-[9px] lowercase">{currentStroke}</span>
                  )}
                </div>

                {/* Preset Swatches */}
                <div className="grid grid-cols-4 gap-2 mb-2.5">
                  {strokePresets.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        updateStyle({ strokeColor: c });
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

                {/* Custom Picker and Clear Button */}
                <div className="flex items-center justify-between pt-2 border-t border-[#F0EAE1]">
                  <label className="color-control text-xs" onMouseDown={(e) => e.stopPropagation()}>
                    <span>Custom</span>
                    <input
                      type="color"
                      aria-label="Custom stroke color"
                      value={currentStroke === 'transparent' ? '#F26B5B' : currentStroke}
                      onInput={(e) => {
                        updateStyle({ strokeColor: (e.target as HTMLInputElement).value });
                      }}
                      onChange={(e) => {
                        updateStyle({ strokeColor: e.target.value });
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      updateStyle({ strokeColor: 'transparent' });
                      setIsStrokePickerOpen(false);
                    }}
                    className={`text-[11px] px-2 py-1 rounded transition font-medium cursor-pointer ${
                      currentStroke === 'transparent'
                        ? 'bg-[#FFF0ED] text-[#F26B5B] font-bold border border-[#FCD9D3]'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                    title="No Outline / Transparent"
                  >
                    No Stroke
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 5. STROKE WIDTH */}
          <div className="relative shrink-0" ref={widthRef}>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={toggleWidthMenu}
              className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-[#FFF9F0] transition text-xs font-semibold text-[#302633] cursor-pointer"
              title="Stroke width"
            >
              <span>{currentWidth}px</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {isWidthMenuOpen && (
              <div
                onMouseDown={(e) => e.stopPropagation()}
                className={`absolute ${popoverPositionClass} left-1/2 -translate-x-1/2 bg-white border border-[#EFE5D8] rounded-xl shadow-xl p-1 z-50 w-28 text-xs animate-in fade-in zoom-in-95 duration-100`}
              >
                {strokeWidths.map((w) => (
                  <button
                    key={w}
                    type="button"
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
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full bg-[#302633]"
                        style={{ width: `${Math.min(16, Math.max(2, w * 1.5))}px`, height: `${Math.max(2, w)}px` }}
                      />
                      <span>{w}px</span>
                    </div>
                    {currentWidth === w && <Check className="w-3 h-3 text-[#F26B5B]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 6. OPACITY */}
          <div className="relative shrink-0" ref={opacityRef}>
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={toggleOpacityMenu}
              className="flex items-center gap-1 px-2 py-1 rounded-full hover:bg-[#FFF9F0] transition text-xs font-semibold text-[#302633] cursor-pointer"
              title="Opacity"
            >
              <span>{Math.round(currentOpacity * 100)}%</span>
              <ChevronDown className="w-3 h-3 text-[#302633]/40" />
            </button>

            {isOpacityMenuOpen && (
              <div
                onMouseDown={(e) => e.stopPropagation()}
                className={`absolute ${popoverPositionClass} left-1/2 -translate-x-1/2 bg-white border border-[#EFE5D8] rounded-xl shadow-xl p-1 z-50 w-24 text-xs animate-in fade-in zoom-in-95 duration-100`}
              >
                {opacities.map((op) => (
                  <button
                    key={op}
                    type="button"
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
        </>
      )}

      {/* 9. SELECTED OBJECT OPERATIONS: Duplicate & Delete */}
      {selectedObject && (
        <>
          <div className="h-4 w-px bg-slate-200 mx-0.5 shrink-0" />

          {/* Lock / Unlock Action */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => lockSelected()}
            className={`p-1.5 rounded-full transition shrink-0 cursor-pointer ${
              isSelectionLocked
                ? 'bg-[#FFF0ED] text-[#F26B5B] hover:bg-[#FCD9D3]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title={isSelectionLocked ? 'Unlock Object' : 'Lock Object'}
          >
            {isSelectionLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
          </button>

          {/* Duplicate Action */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={duplicateSelected}
            disabled={isSelectionLocked}
            className={`p-1.5 rounded-full transition shrink-0 cursor-pointer ${
              isSelectionLocked
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title={isSelectionLocked ? 'Cannot duplicate locked object' : 'Duplicate Object (Ctrl+D)'}
          >
            <Copy className="w-3.5 h-3.5" />
          </button>

          {/* Delete Action */}
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={deleteSelected}
            disabled={isSelectionLocked}
            className={`p-1.5 rounded-full transition shrink-0 cursor-pointer ${
              isSelectionLocked
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : 'text-rose-600 hover:text-rose-700 hover:bg-rose-50'
            }`}
            title={isSelectionLocked ? 'Cannot delete locked object' : 'Delete Object (Del)'}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          {/* More Menu */}
          <div className="relative shrink-0" ref={moreRef}>
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={toggleMoreMenu}
              className="p-1.5 rounded-full text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
              title="More actions"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </button>

            {isMoreMenuOpen && (
              <div className={`absolute ${popoverPositionClass} right-0 bg-white border border-slate-200 rounded-lg shadow-xl py-1 z-50 w-40 text-xs animate-in fade-in zoom-in-95 duration-100`}>
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
                <div className="my-1 border-t border-slate-100" />
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    groupSelected();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-[#F26B5B]" />
                  <span>Group Selection</span>
                </button>
                <button
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    ungroupSelected();
                    setIsMoreMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-slate-400" />
                  <span>Ungroup</span>
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
