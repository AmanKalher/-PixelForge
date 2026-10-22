import React, { useRef, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { ShapeSubtype, ToolType } from '../../types/whiteboard';
import {
  MousePointer,
  Hand,
  StickyNote,
  Square,
  Circle,
  Minus,
  MoveRight,
  Diamond,
  Triangle,
  Type,
  PenTool,
  Highlighter,
  ChevronDown,
} from 'lucide-react';

export const FloatingBoardToolbar: React.FC = () => {
  const {
    activeTool,
    activeShape,
    setActiveTool,
    setActiveShape,
    isShapesPopoverOpen,
    setIsShapesPopoverOpen,
    createMockObject,
  } = useWorkspace();

  const popoverRef = useRef<HTMLDivElement>(null);

  // Close shapes popover on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node)
      ) {
        setIsShapesPopoverOpen(false);
      }
    };
    if (isShapesPopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isShapesPopoverOpen, setIsShapesPopoverOpen]);

  const isShapeActive =
    activeTool === 'rectangle' ||
    activeTool === 'rounded-rectangle' ||
    activeTool === 'circle' ||
    activeTool === 'ellipse' ||
    activeTool === 'diamond' ||
    activeTool === 'triangle' ||
    activeTool === 'line' ||
    activeTool === 'arrow';

  const getShapeIcon = (shape: ShapeSubtype) => {
    switch (shape) {
      case 'rounded-rectangle':
        return <Square className="w-4 h-4 rounded-xs" />;
      case 'circle':
        return <Circle className="w-4 h-4" />;
      case 'ellipse':
        return <Circle className="w-4 h-4 scale-x-125" />;
      case 'diamond':
        return <Diamond className="w-4 h-4" />;
      case 'triangle':
        return <Triangle className="w-4 h-4" />;
      case 'line':
        return <Minus className="w-4 h-4" />;
      case 'arrow':
        return <MoveRight className="w-4 h-4" />;
      case 'rectangle':
      default:
        return <Square className="w-4 h-4" />;
    }
  };

  const handleToolClick = (tool: ToolType) => {
    if (tool === 'sticky') {
      createMockObject('sticky');
    } else if (tool === 'text') {
      createMockObject('text');
    } else {
      setActiveTool(tool);
    }
  };

  const shapesList: { shape: ShapeSubtype; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { shape: 'rectangle', label: 'Rectangle', icon: <Square className="w-3.5 h-3.5" />, shortcut: 'R' },
    { shape: 'rounded-rectangle', label: 'Rounded Rect', icon: <Square className="w-3.5 h-3.5 rounded-xs" />, shortcut: 'U' },
    { shape: 'circle', label: 'Circle', icon: <Circle className="w-3.5 h-3.5" />, shortcut: 'O' },
    { shape: 'ellipse', label: 'Ellipse', icon: <Circle className="w-3.5 h-3.5 scale-x-125" />, shortcut: 'E' },
    { shape: 'diamond', label: 'Diamond', icon: <Diamond className="w-3.5 h-3.5" />, shortcut: 'D' },
    { shape: 'triangle', label: 'Triangle', icon: <Triangle className="w-3.5 h-3.5" />, shortcut: 'Y' },
    { shape: 'line', label: 'Line', icon: <Minus className="w-3.5 h-3.5" />, shortcut: 'N' },
    { shape: 'arrow', label: 'Arrow', icon: <MoveRight className="w-3.5 h-3.5" />, shortcut: 'A' },
  ];

  return (
    <div
      className="fixed top-14 left-1/2 -translate-x-1/2 z-20 flex items-center select-none animate-in fade-in slide-in-from-top-1 duration-150"
      role="toolbar"
      aria-label="Creation Tools"
    >
      <div className="bg-white/95 backdrop-blur-xs border border-slate-200/90 rounded-full shadow-md px-2 py-1 flex items-center gap-1 text-slate-700">
        {/* 1. Select (V) */}
        <button
          onClick={() => setActiveTool('select')}
          className={`p-1.5 rounded-full transition ${
            activeTool === 'select'
              ? 'bg-[#EEF2FF] text-[#6366F1] font-semibold ring-1 ring-indigo-200 shadow-2xs'
              : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
          title="Select (V)"
          aria-label="Select Tool"
        >
          <MousePointer className="w-4 h-4" />
        </button>

        {/* 2. Hand / Pan (H) */}
        <button
          onClick={() => setActiveTool('pan')}
          className={`p-1.5 rounded-full transition ${
            activeTool === 'pan'
              ? 'bg-[#EEF2FF] text-[#6366F1] font-semibold ring-1 ring-indigo-200 shadow-2xs'
              : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
          title="Pan Canvas (H)"
          aria-label="Pan Tool"
        >
          <Hand className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="h-4 w-px bg-slate-200 mx-0.5" />

        {/* 3. Sticky Note (S) */}
        <button
          onClick={() => handleToolClick('sticky')}
          className={`p-1.5 rounded-full transition ${
            activeTool === 'sticky'
              ? 'bg-[#EEF2FF] text-[#6366F1] font-semibold ring-1 ring-indigo-200 shadow-2xs'
              : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
          title="Sticky Note (S)"
          aria-label="Sticky Note"
        >
          <StickyNote className="w-4 h-4 text-amber-500" />
        </button>

        {/* 4. Shape Picker (R) with Popover */}
        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => {
              if (!isShapeActive) {
                setActiveTool(activeShape);
              }
              setIsShapesPopoverOpen(!isShapesPopoverOpen);
            }}
            className={`flex items-center gap-0.5 px-2 py-1.5 rounded-full transition ${
              isShapeActive
                ? 'bg-[#EEF2FF] text-[#6366F1] font-semibold ring-1 ring-indigo-200 shadow-2xs'
                : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
            title={`Shapes (R) - Active: ${activeShape}`}
            aria-label="Shape picker"
          >
            {getShapeIcon(activeShape)}
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {/* Shapes Submenu Popover (8 Shapes) */}
          {isShapesPopoverOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 top-10 w-48 bg-white border border-slate-200 rounded-xl shadow-xl p-1.5 z-50 text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select Shape
              </div>
              {shapesList.map(({ shape, label, icon, shortcut }) => {
                const isSelected = activeShape === shape && isShapeActive;
                return (
                  <button
                    key={shape}
                    onClick={() => {
                      setActiveShape(shape);
                      setActiveTool(shape);
                      setIsShapesPopoverOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition ${
                      isSelected
                        ? 'bg-indigo-50 text-indigo-600 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {icon}
                      <span>{label}</span>
                    </div>
                    <kbd className="text-[10px] text-slate-400 font-mono">{shortcut}</kbd>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Text (T) */}
        <button
          onClick={() => handleToolClick('text')}
          className={`p-1.5 rounded-full transition ${
            activeTool === 'text'
              ? 'bg-[#EEF2FF] text-[#6366F1] font-semibold ring-1 ring-indigo-200 shadow-2xs'
              : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
          title="Text (T)"
          aria-label="Text Tool"
        >
          <Type className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="h-4 w-px bg-slate-200 mx-0.5" />

        {/* 6. Draw / Pen (P) */}
        <button
          onClick={() => setActiveTool('brush')}
          className={`p-1.5 rounded-full transition ${
            activeTool === 'brush'
              ? 'bg-[#EEF2FF] text-[#6366F1] font-semibold ring-1 ring-indigo-200 shadow-2xs'
              : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
          title="Freehand Draw (P)"
          aria-label="Draw Tool"
        >
          <PenTool className="w-4 h-4" />
        </button>

        {/* 7. Highlighter (L) */}
        <button
          onClick={() => setActiveTool('highlighter')}
          className={`p-1.5 rounded-full transition ${
            activeTool === 'highlighter'
              ? 'bg-[#EEF2FF] text-[#6366F1] font-semibold ring-1 ring-indigo-200 shadow-2xs'
              : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
          }`}
          title="Highlighter (L)"
          aria-label="Highlighter Tool"
        >
          <Highlighter className="w-4 h-4 text-amber-500" />
        </button>
      </div>
    </div>
  );
};

