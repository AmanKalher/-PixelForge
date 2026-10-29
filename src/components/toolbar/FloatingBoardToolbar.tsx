import React, { useRef, useEffect, useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { ShapeSubtype, ToolType } from '../../types/whiteboard';
import {
  MousePointer,
  LassoSelect,
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
  Eraser,
  ChevronDown,
  X,
} from 'lucide-react';
import { StickyTemplateGalleryPopover } from './StickyTemplateGalleryPopover';
import { BrushToolPopover } from './BrushToolPopover';
import { HighlighterToolPopover } from './HighlighterToolPopover';
import { EraserToolPopover } from './EraserToolPopover';
import { TextToolPopover } from './TextToolPopover';

export interface FloatingBoardToolbarProps {
  vertical?: boolean;
  onClose?: () => void;
}

export const FloatingBoardToolbar: React.FC<FloatingBoardToolbarProps> = ({
  vertical = true,
  onClose,
}) => {
  const {
    activeTool,
    activeShape,
    setActiveTool,
    setActiveShape,
    isShapesPopoverOpen,
    setIsShapesPopoverOpen,
    createMockObject,
    isUIPreviewMode,
    isStickyGalleryOpen,
    setIsStickyGalleryOpen,
    selectedStickyTemplate,
    isTextPopoverOpen,
    setIsTextPopoverOpen,
  } = useWorkspace();

  const [isBrushPopoverOpen, setIsBrushPopoverOpen] = useState(false);
  const [isHighlighterPopoverOpen, setIsHighlighterPopoverOpen] = useState(false);
  const [isEraserPopoverOpen, setIsEraserPopoverOpen] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const brushRef = useRef<HTMLDivElement>(null);
  const highlighterRef = useRef<HTMLDivElement>(null);
  const eraserRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

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

  const isShapeActive = Boolean(
    activeTool &&
      ![
        'select',
        'pan',
        'brush',
        'highlighter',
        'eraser',
        'sticky',
        'text',
        'pen',
        'marker',
        'pencil',
        'calligraphy',
        'table',
        'graph',
        'curve',
        'image',
        'group',
      ].includes(activeTool)
  );

  const isBrushActive =
    activeTool === 'brush' ||
    activeTool === 'pen' ||
    activeTool === 'marker' ||
    activeTool === 'pencil' ||
    activeTool === 'calligraphy';

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
    setActiveTool(tool);
    if (isUIPreviewMode && (tool === 'sticky' || tool === 'text')) {
      createMockObject(tool);
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

  if (vertical) {
    return (
      <div
        className="fixed top-[86px] left-[86px] z-20 flex flex-col items-center gap-2 select-none animate-in fade-in slide-in-from-left-2 duration-150"
        role="toolbar"
        aria-label="Creation Tools"
      >
        {/* Top Close Button */}
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-[#EFE5D8] shadow-md flex items-center justify-center text-[#302633]/60 hover:text-[#302633] hover:bg-[#FFF9F0] transition cursor-pointer"
            title="Close Tools panel"
            aria-label="Close Tools panel"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Vertical Floating Pill */}
        <div className="bg-white/95 backdrop-blur-xs border border-[#EFE5D8] rounded-full shadow-lg p-1.5 flex flex-col items-center gap-1 text-[#302633]">
          {/* 1. Select (V) */}
          <button
            onClick={() => setActiveTool('select')}
            className={`p-2 rounded-full transition cursor-pointer ${
              activeTool === 'select'
                ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold ring-1 ring-[#FCD9D3] shadow-2xs'
                : 'hover:bg-[#FFF9F0] text-[#302633]/70 hover:text-[#302633]'
            }`}
            title="Select (V)"
            aria-label="Select Tool"
          >
            <MousePointer className="w-4 h-4" />
          </button>

          {/* 2. Lasso Select (Q) */}
          <button
            onClick={() => setActiveTool('lasso')}
            className={`p-2 rounded-full transition cursor-pointer ${
              activeTool === 'lasso'
                ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold ring-1 ring-[#FCD9D3] shadow-2xs'
                : 'hover:bg-[#FFF9F0] text-[#302633]/70 hover:text-[#302633]'
            }`}
            title="Lasso Select (Q)"
            aria-label="Lasso Select Tool"
          >
            <LassoSelect className="w-4 h-4" />
          </button>

          {/* Divider */}
          <div className="w-5 h-px bg-[#EFE5D8] my-0.5" />

          {/* 3. Shape Picker (R) */}
          <div className="relative" ref={popoverRef}>
            <button
              onClick={() => {
                if (!isShapeActive) {
                  setActiveTool(activeShape);
                }
                setIsShapesPopoverOpen(!isShapesPopoverOpen);
              }}
              className={`p-2 rounded-full transition cursor-pointer ${
                isShapeActive
                  ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold ring-1 ring-[#FCD9D3] shadow-2xs'
                  : 'hover:bg-[#FFF9F0] text-[#302633]/70 hover:text-[#302633]'
              }`}
              title={`Shapes (R) - Active: ${activeShape}`}
              aria-label="Shape picker"
            >
              {getShapeIcon(activeShape)}
            </button>

            {/* Shapes Submenu Popover (8 Shapes) */}
            {isShapesPopoverOpen && (
              <div className="absolute left-full top-0 ml-3 w-48 bg-white border border-[#EFE5D8] rounded-xl shadow-xl p-1.5 z-50 text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2 py-1 text-[10px] font-bold text-[#302633]/40 uppercase tracking-wider">
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
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                        isSelected
                          ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold'
                          : 'text-[#302633] hover:bg-[#FFF9F0]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {icon}
                        <span>{label}</span>
                      </div>
                      <kbd className="text-[10px] text-[#302633]/40 font-mono">{shortcut}</kbd>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Draw / Brush (P) */}
          <div className="relative" ref={brushRef}>
            <button
              onClick={() => {
                setActiveTool('brush');
                setIsBrushPopoverOpen((prev) => !prev);
              }}
              className={`p-2 rounded-full transition cursor-pointer ${
                isBrushActive
                  ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold ring-1 ring-[#FCD9D3] shadow-2xs'
                  : 'hover:bg-[#FFF9F0] text-[#302633]/70 hover:text-[#302633]'
              }`}
              title="Freehand Draw (P) - Click to toggle brush options"
              aria-label="Draw Tool"
            >
              <PenTool className="w-4 h-4" />
            </button>
            <BrushToolPopover
              isOpen={isBrushPopoverOpen}
              onClose={() => setIsBrushPopoverOpen(false)}
              placement="right"
            />
          </div>

          {/* 5. Highlighter (L) */}
          <div className="relative" ref={highlighterRef}>
            <button
              onClick={() => {
                setActiveTool('highlighter');
                setIsHighlighterPopoverOpen((prev) => !prev);
              }}
              className={`p-2 rounded-full transition cursor-pointer ${
                activeTool === 'highlighter'
                  ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold ring-1 ring-[#FCD9D3] shadow-2xs'
                  : 'hover:bg-[#FFF9F0] text-[#302633]/70 hover:text-[#302633]'
              }`}
              title="Highlighter (L) - Click to toggle colors & width"
              aria-label="Highlighter Tool"
            >
              <Highlighter className="w-4 h-4 text-[#F7D774]" />
            </button>
            <HighlighterToolPopover
              isOpen={isHighlighterPopoverOpen}
              onClose={() => setIsHighlighterPopoverOpen(false)}
              placement="right"
            />
          </div>

          {/* 6. Eraser (E) */}
          <div className="relative" ref={eraserRef}>
            <button
              onClick={() => {
                setActiveTool('eraser');
                setIsEraserPopoverOpen((prev) => !prev);
              }}
              className={`p-2 rounded-full transition cursor-pointer ${
                activeTool === 'eraser'
                  ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold ring-1 ring-[#FCD9D3] shadow-2xs'
                  : 'hover:bg-[#FFF9F0] text-[#302633]/70 hover:text-[#302633]'
              }`}
              title="Eraser (E) - Click to toggle options"
              aria-label="Eraser Tool"
            >
              <Eraser className="w-4 h-4" />
            </button>
            <EraserToolPopover
              isOpen={isEraserPopoverOpen}
              onClose={() => setIsEraserPopoverOpen(false)}
              placement="right"
            />
          </div>

          {/* Divider */}
          <div className="w-5 h-px bg-[#EFE5D8] my-0.5" />

          {/* 7. Sticky Note (S) */}
          <div className="relative" ref={stickyRef}>
            <button
              onClick={() => {
                handleToolClick('sticky');
                setIsStickyGalleryOpen(!isStickyGalleryOpen);
              }}
              className={`p-2 rounded-full transition cursor-pointer ${
                activeTool === 'sticky'
                  ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold ring-1 ring-[#FCD9D3] shadow-2xs'
                  : 'hover:bg-[#FFF9F0] text-[#302633]/70 hover:text-[#302633]'
              }`}
              title={`Sticky Note (S) - Template: ${selectedStickyTemplate}`}
              aria-label="Sticky Note Tool"
            >
              <StickyNote className="w-4 h-4 text-[#F7D774]" />
            </button>
            <StickyTemplateGalleryPopover
              isOpen={isStickyGalleryOpen}
              onClose={() => setIsStickyGalleryOpen(false)}
              placement="right"
            />
          </div>

          {/* 8. Text (T) */}
          <div className="relative" ref={textRef}>
            <button
              onClick={() => {
                handleToolClick('text');
                setIsTextPopoverOpen(!isTextPopoverOpen);
              }}
              className={`p-2 rounded-full transition cursor-pointer ${
                activeTool === 'text'
                  ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold ring-1 ring-[#FCD9D3] shadow-2xs'
                  : 'hover:bg-[#FFF9F0] text-[#302633]/70 hover:text-[#302633]'
              }`}
              title="Text (T) - Click to toggle text options"
              aria-label="Text Tool"
            >
              <Type className="w-4 h-4" />
            </button>
            <TextToolPopover
              isOpen={isTextPopoverOpen}
              onClose={() => setIsTextPopoverOpen(false)}
              placement="right"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed top-[86px] left-1/2 -translate-x-1/2 z-20 flex items-center select-none animate-in fade-in slide-in-from-top-1 duration-150"
      role="toolbar"
      aria-label="Creation Tools"
    >
      <div className="bg-white/95 backdrop-blur-xs border border-[#EFE5D8] rounded-full shadow-md px-2 py-1 flex items-center gap-1 text-[#302633]">
        {/* 1. Select (V) */}
        <button
          onClick={() => setActiveTool('select')}
          className={`p-1.5 rounded-full transition cursor-pointer ${
            activeTool === 'select'
              ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold ring-1 ring-[#FCD9D3] shadow-2xs'
              : 'hover:bg-[#FFF9F0] text-[#302633]/70 hover:text-[#302633]'
          }`}
          title="Select (V)"
          aria-label="Select Tool"
        >
          <MousePointer className="w-4 h-4" />
        </button>

        {/* 2. Lasso Select (Q) */}
        <button
          onClick={() => setActiveTool('lasso')}
          className={`p-1.5 rounded-full transition cursor-pointer ${
            activeTool === 'lasso'
              ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold ring-1 ring-[#FCD9D3] shadow-2xs'
              : 'hover:bg-[#FFF9F0] text-[#302633]/70 hover:text-[#302633]'
          }`}
          title="Lasso Select (Q)"
          aria-label="Lasso Select Tool"
        >
          <LassoSelect className="w-4 h-4" />
        </button>

        {/* Divider */}
        <div className="h-4 w-px bg-[#EFE5D8] mx-0.5" />

        {/* 3. Sticky Note (S) with Template Gallery Popover Trigger */}
        <div className="relative" ref={stickyRef}>
          <div className="flex items-center">
            <button
              onClick={() => handleToolClick('sticky')}
              className={`p-1.5 rounded-l-full transition cursor-pointer ${
                activeTool === 'sticky'
                  ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold ring-1 ring-[#FCD9D3] shadow-2xs'
                  : 'hover:bg-[#FFF9F0] text-[#302633]/70 hover:text-[#302633]'
              }`}
              title={`Sticky Note (S) - Template: ${selectedStickyTemplate}`}
              aria-label="Sticky Note Tool"
            >
              <StickyNote className="w-4 h-4 text-[#F7D774]" />
            </button>
            <button
              onClick={() => setIsStickyGalleryOpen(!isStickyGalleryOpen)}
              className={`p-1 rounded-r-full border-l border-[#EFE5D8] hover:bg-[#FFF9F0] transition text-[#302633]/40 hover:text-[#302633] cursor-pointer ${
                activeTool === 'sticky' ? 'bg-[#FFF0ED]' : ''
              }`}
              title="Sticky Note Template Gallery (9 designs)"
              aria-label="Sticky Note Template Gallery"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <StickyTemplateGalleryPopover
            isOpen={isStickyGalleryOpen}
            onClose={() => setIsStickyGalleryOpen(false)}
          />
        </div>

        {/* 4. Shape Picker (R) with Popover */}
        <div className="relative" ref={popoverRef}>
          <button
            onClick={() => {
              if (!isShapeActive) {
                setActiveTool(activeShape);
              }
              setIsShapesPopoverOpen(!isShapesPopoverOpen);
            }}
            className={`flex items-center gap-0.5 px-2 py-1.5 rounded-full transition cursor-pointer ${
              isShapeActive
                ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold ring-1 ring-[#FCD9D3] shadow-2xs'
                : 'hover:bg-[#FFF9F0] text-[#302633]/70 hover:text-[#302633]'
            }`}
            title={`Shapes (R) - Active: ${activeShape}`}
            aria-label="Shape picker"
          >
            {getShapeIcon(activeShape)}
            <ChevronDown className="w-3 h-3 text-[#302633]/40" />
          </button>

          {/* Shapes Submenu Popover (8 Shapes) */}
          {isShapesPopoverOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 top-10 w-48 bg-white border border-[#EFE5D8] rounded-xl shadow-xl p-1.5 z-50 text-xs space-y-0.5 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1 text-[10px] font-bold text-[#302633]/40 uppercase tracking-wider">
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
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold'
                        : 'text-[#302633] hover:bg-[#FFF9F0]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {icon}
                      <span>{label}</span>
                    </div>
                    <kbd className="text-[10px] text-[#302633]/40 font-mono">{shortcut}</kbd>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 5. Text (T) with Popover */}
        <div className="relative" ref={textRef}>
          <div className="flex items-center">
            <button
              onClick={() => {
                handleToolClick('text');
                setIsTextPopoverOpen(!isTextPopoverOpen);
              }}
              className={`p-1.5 rounded-l-full transition cursor-pointer ${
                activeTool === 'text'
                  ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold ring-1 ring-[#FCD9D3] shadow-2xs'
                  : 'hover:bg-[#FFF9F0] text-[#302633]/70 hover:text-[#302633]'
              }`}
              title="Text (T) - Click to toggle text formatting options"
              aria-label="Text Tool"
            >
              <Type className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setActiveTool('text');
                setIsTextPopoverOpen(!isTextPopoverOpen);
              }}
              className={`p-1 rounded-r-full border-l border-[#EFE5D8] hover:bg-[#FFF9F0] transition text-[#302633]/40 hover:text-[#302633] cursor-pointer ${
                activeTool === 'text' ? 'bg-[#FFF0ED]' : ''
              }`}
              title="Text Formatting Options"
              aria-label="Text Formatting Options"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <TextToolPopover
            isOpen={isTextPopoverOpen}
            onClose={() => setIsTextPopoverOpen(false)}
          />
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-[#EFE5D8] mx-0.5" />

        {/* 6. Draw / Brush (P) with Popover */}
        <div className="relative" ref={brushRef}>
          <div className="flex items-center">
            <button
              onClick={() => {
                setActiveTool('brush');
                setIsBrushPopoverOpen((prev) => !prev);
              }}
              className={`p-1.5 rounded-l-full transition cursor-pointer ${
                isBrushActive
                  ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold ring-1 ring-[#FCD9D3] shadow-2xs'
                  : 'hover:bg-[#FFF9F0] text-[#302633]/70 hover:text-[#302633]'
              }`}
              title="Freehand Draw (P) - Click to toggle brush options"
              aria-label="Draw Tool"
            >
              <PenTool className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setActiveTool('brush');
                setIsBrushPopoverOpen((prev) => !prev);
              }}
              className={`p-1 rounded-r-full border-l border-[#EFE5D8] hover:bg-[#FFF9F0] transition text-[#302633]/40 hover:text-[#302633] cursor-pointer ${
                isBrushActive ? 'bg-[#FFF0ED]' : ''
              }`}
              title="Brush Options"
              aria-label="Brush Options"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <BrushToolPopover
            isOpen={isBrushPopoverOpen}
            onClose={() => setIsBrushPopoverOpen(false)}
          />
        </div>

        {/* 7. Highlighter (L) with Popover */}
        <div className="relative" ref={highlighterRef}>
          <div className="flex items-center">
            <button
              onClick={() => {
                setActiveTool('highlighter');
                setIsHighlighterPopoverOpen((prev) => !prev);
              }}
              className={`p-1.5 rounded-l-full transition cursor-pointer ${
                activeTool === 'highlighter'
                  ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold ring-1 ring-[#FCD9D3] shadow-2xs'
                  : 'hover:bg-[#FFF9F0] text-[#302633]/70 hover:text-[#302633]'
              }`}
              title="Highlighter (L) - Click to toggle colors & width"
              aria-label="Highlighter Tool"
            >
              <Highlighter className="w-4 h-4 text-[#F7D774]" />
            </button>
            <button
              onClick={() => {
                setActiveTool('highlighter');
                setIsHighlighterPopoverOpen((prev) => !prev);
              }}
              className={`p-1 rounded-r-full border-l border-[#EFE5D8] hover:bg-[#FFF9F0] transition text-[#302633]/40 hover:text-[#302633] cursor-pointer ${
                activeTool === 'highlighter' ? 'bg-[#FFF0ED]' : ''
              }`}
              title="Highlighter Options"
              aria-label="Highlighter Options"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <HighlighterToolPopover
            isOpen={isHighlighterPopoverOpen}
            onClose={() => setIsHighlighterPopoverOpen(false)}
          />
        </div>

        {/* 8. Eraser (E) with Popover */}
        <div className="relative" ref={eraserRef}>
          <div className="flex items-center">
            <button
              onClick={() => {
                setActiveTool('eraser');
                setIsEraserPopoverOpen((prev) => !prev);
              }}
              className={`p-1.5 rounded-l-full transition cursor-pointer ${
                activeTool === 'eraser'
                  ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold ring-1 ring-[#FCD9D3] shadow-2xs'
                  : 'hover:bg-[#FFF9F0] text-[#302633]/70 hover:text-[#302633]'
              }`}
              title="Eraser (E) - Click to toggle Sweep / Whole Stroke mode"
              aria-label="Eraser Tool"
            >
              <Eraser className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setActiveTool('eraser');
                setIsEraserPopoverOpen((prev) => !prev);
              }}
              className={`p-1 rounded-r-full border-l border-[#EFE5D8] hover:bg-[#FFF9F0] transition text-[#302633]/40 hover:text-[#302633] cursor-pointer ${
                activeTool === 'eraser' ? 'bg-[#FFF0ED]' : ''
              }`}
              title="Eraser Options"
              aria-label="Eraser Options"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          <EraserToolPopover
            isOpen={isEraserPopoverOpen}
            onClose={() => setIsEraserPopoverOpen(false)}
          />
        </div>
      </div>
    </div>
  );
};
