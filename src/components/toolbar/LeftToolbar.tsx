import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { STICKY_TEMPLATES } from '../../engine/stickyNoteTemplates';
import { ShapeSubtype, ToolType } from '../../types/whiteboard';
import {
  Type,
  PenTool,
  Folder,
  Layers,
  History,
  Sliders,
  X,
  Plus,
  Check,
  LayoutGrid,
  Square,
  Circle,
  Minus,
  MoveRight,
  Diamond,
  Triangle,
  ChevronLeft,
} from 'lucide-react';

// Custom Elements icon matching reference screenshot (heart, play, note, circle)
const ElementsIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    {/* Heart top-left */}
    <path d="M6 3.5 C4.5 2 2.5 3.5 2.5 5 C2.5 7 5 9 6 9.5 C7 9 9.5 7 9.5 5 C9.5 3.5 7.5 2 6 3.5 Z" />
    {/* Play / Triangle top-right */}
    <polygon points="15,4 20,7 15,10" />
    {/* Music Note bottom-left */}
    <circle cx="5" cy="18" r="2" />
    <path d="M7 18 V13 H10 V15" />
    {/* Circle bottom-right */}
    <circle cx="17.5" cy="17" r="2.5" />
  </svg>
);

// Original Custom Sticky Notes Category Illustration
const StickyNotesCategoryIcon: React.FC<{ className?: string }> = ({ className = 'w-14 h-14' }) => (
  <svg
    viewBox="0 0 56 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <filter id="pf-sticky-sh1" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#302633" floodOpacity="0.08" />
      </filter>
      <filter id="pf-sticky-sh2" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#302633" floodOpacity="0.12" />
      </filter>
      <linearGradient id="pf-sticky-coral" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FF9688" />
        <stop offset="100%" stopColor="#F26B5B" />
      </linearGradient>
      <linearGradient id="pf-sticky-peach" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FED7AA" />
        <stop offset="100%" stopColor="#FDBA74" />
      </linearGradient>
      <linearGradient id="pf-sticky-yellow" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="100%" stopColor="#FBBF24" />
      </linearGradient>
      <linearGradient id="pf-sticky-fold" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#E05A4A" />
        <stop offset="100%" stopColor="#F26B5B" />
      </linearGradient>
    </defs>

    {/* Back Note (PixelForge Coral, tilted left -9°) */}
    <g transform="rotate(-9 24 24)" filter="url(#pf-sticky-sh1)">
      <rect x="7" y="10" width="33" height="33" rx="6" fill="url(#pf-sticky-coral)" />
      <rect x="12" y="15" width="13" height="2" rx="1" fill="#FFFFFF" opacity="0.45" />
    </g>

    {/* Middle Note (Warm Peach, tilted right +7°) */}
    <g transform="rotate(7 32 26)" filter="url(#pf-sticky-sh1)">
      <rect x="16" y="9" width="33" height="33" rx="6" fill="url(#pf-sticky-peach)" />
      <rect x="21" y="14" width="15" height="2" rx="1" fill="#FFFFFF" opacity="0.5" />
    </g>

    {/* Front Hero Note (Warm Sunny Yellow with folded bottom-right corner) */}
    <g filter="url(#pf-sticky-sh2)">
      <path
        d="M12 17C12 13.6863 14.6863 11 18 11H38C41.3137 11 44 13.6863 44 17V37L36 45H18C14.6863 45 12 42.3137 12 39V17Z"
        fill="url(#pf-sticky-yellow)"
      />
      {/* Folded Corner Flap */}
      <path
        d="M36 37H44L36 45V37Z"
        fill="url(#pf-sticky-fold)"
      />
      <path
        d="M36 37L44 37L36 45Z"
        fill="#000000"
        opacity="0.08"
      />
      {/* Note content lines */}
      <rect x="17" y="18" width="16" height="2.5" rx="1.25" fill="#D97706" opacity="0.8" />
      <rect x="17" y="24" width="21" height="2.5" rx="1.25" fill="#D97706" opacity="0.65" />
      <rect x="17" y="30" width="13" height="2.5" rx="1.25" fill="#D97706" opacity="0.65" />
    </g>
  </svg>
);

// Original Custom Shapes Category Illustration (Circle, Diamond, Rounded Rectangle, Triangle)
const ShapesCategoryIcon: React.FC<{ className?: string }> = ({ className = 'w-14 h-14' }) => (
  <svg
    viewBox="0 0 56 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <filter id="pf-shapes-sh" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#302633" floodOpacity="0.12" />
      </filter>
      <linearGradient id="pf-shapes-rect" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#818CF8" />
        <stop offset="100%" stopColor="#6366F1" />
      </linearGradient>
      <linearGradient id="pf-shapes-circle" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FF8A7A" />
        <stop offset="100%" stopColor="#F26B5B" />
      </linearGradient>
      <linearGradient id="pf-shapes-diamond" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#A78BFA" />
        <stop offset="100%" stopColor="#8B5CF6" />
      </linearGradient>
      <linearGradient id="pf-shapes-triangle" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FBBF24" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
    </defs>

    <g filter="url(#pf-shapes-sh)">
      {/* 1. Rounded Rectangle (Top-Left, Indigo) */}
      <rect x="9" y="10" width="18" height="15" rx="4" fill="url(#pf-shapes-rect)" />

      {/* 2. Circle (Top-Right, Coral) */}
      <circle cx="39" cy="17.5" r="8.5" fill="url(#pf-shapes-circle)" />

      {/* 3. Diamond (Bottom-Left, Purple, rotated 45°) */}
      <rect
        x="12"
        y="30"
        width="13"
        height="13"
        rx="3"
        transform="rotate(45 18.5 36.5)"
        fill="url(#pf-shapes-diamond)"
      />

      {/* 4. Triangle (Bottom-Right, Warm Amber, rounded vertex) */}
      <path
        d="M39 28.5C39.8 27.1 41.8 27.1 42.6 28.5L48.2 38.5C49 39.9 48 41.7 46.4 41.7H35.2C33.6 41.7 32.6 39.9 33.4 38.5L39 28.5Z"
        fill="url(#pf-shapes-triangle)"
      />
    </g>
  </svg>
);

export const LeftToolbar: React.FC = () => {
  const {
    activeNav,
    setActiveNav,
    isLayersPanelOpen,
    toggleLayersPanel,
    isHistoryModalOpen,
    setIsSimulationDrawerOpen,
    setIsHistoryModalOpen,
    resetZoom,
    setPan,
    setActiveTool,
    setActiveShape,
    activeShape,
    selectedStickyTemplate,
    setSelectedStickyTemplate,
    canvasEngine,
    addTextBox,
    createMockObject,
    isUIPreviewMode,
    boardTitle,
  } = useWorkspace();

  const [elementsSubcategory, setElementsSubcategory] = useState<'overview' | 'sticky' | 'shapes'>('overview');

  const handleNavClick = (nav: 'elements' | 'text' | 'tools' | 'projects') => {
    if (activeNav === nav) {
      setActiveNav(null);
    } else {
      setActiveNav(nav);
      if (nav === 'elements') {
        setElementsSubcategory('overview');
      }
    }
  };

  const handleSelectStickyTemplate = (key: string) => {
    setSelectedStickyTemplate(key);
    if (canvasEngine.changeStickyTemplate) {
      canvasEngine.changeStickyTemplate(key);
    }
  };

  const handlePlaceSticky = (templateKey?: string) => {
    const key = templateKey || selectedStickyTemplate;
    setSelectedStickyTemplate(key);
    setActiveTool('select');

    if (canvasEngine.createStickyNoteAt) {
      canvasEngine.createStickyNoteAt({
        template: key,
        x: 400 + Math.random() * 80,
        y: 260 + Math.random() * 60,
      });
    } else if (isUIPreviewMode) {
      createMockObject('sticky');
    }
  };

  const handlePlaceShape = (shapeType?: ShapeSubtype) => {
    const shape = shapeType || activeShape || 'rectangle';
    setActiveShape(shape);
    setActiveTool('select');

    if (canvasEngine.createShapeAtPoint) {
      canvasEngine.createShapeAtPoint(shape, {
        x: 400 + Math.random() * 80,
        y: 260 + Math.random() * 60,
      });
    } else if (isUIPreviewMode) {
      createMockObject(shape as ToolType);
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
    <>
      {/* 1. Left Vertical Icon-and-Label Navigation Rail */}
      <aside
        className="fixed top-[76px] bottom-0 left-0 w-[72px] bg-white border-r border-[#EFE5D8] z-20 flex flex-col justify-between items-center py-3 select-none shadow-xs"
        aria-label="Whiteboard Navigation Rail"
      >
        {/* Top: Elements, Text, Tools, Projects, Layer Tree, Audit & Timeline */}
        <nav className="flex flex-col items-center gap-2 w-full px-1">
          {/* 1. Elements */}
          <button
            onClick={() => handleNavClick('elements')}
            className={`flex flex-col items-center justify-center w-full py-1.5 rounded-xl transition cursor-pointer group ${
              activeNav === 'elements' ? 'text-[#F26B5B]' : 'text-[#302633]/70 hover:text-[#302633]'
            }`}
            title="Elements (Sticky notes, Shapes & Templates)"
            aria-label="Elements"
          >
            <div
              className={`w-11 h-9 rounded-2xl flex items-center justify-center transition ${
                activeNav === 'elements'
                  ? 'bg-[#FFF0ED] text-[#F26B5B] shadow-2xs ring-1 ring-[#FCD9D3]'
                  : 'group-hover:bg-[#FFF9F0]'
              }`}
            >
              <ElementsIcon className="w-5 h-5" />
            </div>
            <span
              className={`text-[11px] mt-1 tracking-tight transition ${
                activeNav === 'elements' ? 'font-bold text-[#F26B5B]' : 'font-medium'
              }`}
            >
              Elements
            </span>
          </button>

          {/* 2. Text */}
          <button
            onClick={() => handleNavClick('text')}
            className={`flex flex-col items-center justify-center w-full py-1.5 rounded-xl transition cursor-pointer group ${
              activeNav === 'text' ? 'text-[#F26B5B]' : 'text-[#302633]/70 hover:text-[#302633]'
            }`}
            title="Text (Add text boxes & typography)"
            aria-label="Text"
          >
            <div
              className={`w-11 h-9 rounded-2xl flex items-center justify-center transition ${
                activeNav === 'text'
                  ? 'bg-[#FFF0ED] text-[#F26B5B] shadow-2xs ring-1 ring-[#FCD9D3]'
                  : 'group-hover:bg-[#FFF9F0]'
              }`}
            >
              <Type className="w-5 h-5" />
            </div>
            <span
              className={`text-[11px] mt-1 tracking-tight transition ${
                activeNav === 'text' ? 'font-bold text-[#F26B5B]' : 'font-medium'
              }`}
            >
              Text
            </span>
          </button>

          {/* 3. Tools */}
          <button
            onClick={() => handleNavClick('tools')}
            className={`flex flex-col items-center justify-center w-full py-1.5 rounded-xl transition cursor-pointer group ${
              activeNav === 'tools' ? 'text-[#F26B5B]' : 'text-[#302633]/70 hover:text-[#302633]'
            }`}
            title="Tools (Canvas creation tools)"
            aria-label="Tools"
          >
            <div
              className={`w-11 h-9 rounded-2xl flex items-center justify-center transition ${
                activeNav === 'tools'
                  ? 'bg-[#FFF0ED] text-[#F26B5B] shadow-2xs ring-1 ring-[#FCD9D3]'
                  : 'group-hover:bg-[#FFF9F0]'
              }`}
            >
              <PenTool className="w-5 h-5" />
            </div>
            <span
              className={`text-[11px] mt-1 tracking-tight transition ${
                activeNav === 'tools' ? 'font-bold text-[#F26B5B]' : 'font-medium'
              }`}
            >
              Tools
            </span>
          </button>

          {/* 4. Projects */}
          <button
            onClick={() => handleNavClick('projects')}
            className={`flex flex-col items-center justify-center w-full py-1.5 rounded-xl transition cursor-pointer group ${
              activeNav === 'projects' ? 'text-[#F26B5B]' : 'text-[#302633]/70 hover:text-[#302633]'
            }`}
            title="Projects (Boards & Whiteboard Info)"
            aria-label="Projects"
          >
            <div
              className={`w-11 h-9 rounded-2xl flex items-center justify-center transition ${
                activeNav === 'projects'
                  ? 'bg-[#FFF0ED] text-[#F26B5B] shadow-2xs ring-1 ring-[#FCD9D3]'
                  : 'group-hover:bg-[#FFF9F0]'
              }`}
            >
              <Folder className="w-5 h-5" />
            </div>
            <span
              className={`text-[11px] mt-1 tracking-tight transition ${
                activeNav === 'projects' ? 'font-bold text-[#F26B5B]' : 'font-medium'
              }`}
            >
              Projects
            </span>
          </button>

          {/* 5. Layer Tree */}
          <button
            onClick={() => toggleLayersPanel()}
            className={`flex flex-col items-center justify-center w-full py-1.5 rounded-xl transition cursor-pointer group ${
              isLayersPanelOpen ? 'text-[#F26B5B]' : 'text-[#302633]/70 hover:text-[#302633]'
            }`}
            title="Layer Tree (Object stacking & visibility)"
            aria-label="Layer Tree"
          >
            <div
              className={`w-11 h-9 rounded-2xl flex items-center justify-center transition ${
                isLayersPanelOpen
                  ? 'bg-[#FFF0ED] text-[#F26B5B] shadow-2xs ring-1 ring-[#FCD9D3]'
                  : 'group-hover:bg-[#FFF9F0]'
              }`}
            >
              <Layers className="w-5 h-5" />
            </div>
            <span
              className={`text-[10px] mt-1 tracking-tight text-center leading-tight transition ${
                isLayersPanelOpen ? 'font-bold text-[#F26B5B]' : 'font-medium'
              }`}
            >
              Layer Tree
            </span>
          </button>

          {/* 6. Audit & Timeline */}
          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className={`flex flex-col items-center justify-center w-full py-1.5 rounded-xl transition cursor-pointer group ${
              isHistoryModalOpen ? 'text-[#F26B5B]' : 'text-[#302633]/70 hover:text-[#302633]'
            }`}
            title="Audit & Timeline (Review revisions & audit log)"
            aria-label="Audit & Timeline"
          >
            <div
              className={`w-11 h-9 rounded-2xl flex items-center justify-center transition ${
                isHistoryModalOpen
                  ? 'bg-[#FFF0ED] text-[#F26B5B] shadow-2xs ring-1 ring-[#FCD9D3]'
                  : 'group-hover:bg-[#FFF9F0]'
              }`}
            >
              <History className="w-5 h-5" />
            </div>
            <span
              className={`text-[9.5px] mt-1 tracking-tight text-center leading-3 transition px-0.5 ${
                isHistoryModalOpen ? 'font-bold text-[#F26B5B]' : 'font-medium'
              }`}
            >
              Audit &<br />Timeline
            </span>
          </button>
        </nav>

        {/* Bottom: Simulation Settings & Version */}
        <div className="flex flex-col items-center gap-2 w-full pt-2 border-t border-[#EFE5D8]">
          <button
            onClick={() => setIsSimulationDrawerOpen(true)}
            className="p-2 rounded-xl text-[#302633]/60 hover:text-[#F26B5B] hover:bg-[#FFF0ED] transition cursor-pointer shadow-2xs"
            title="Open Simulation Settings"
            aria-label="Simulation Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
          <span className="text-[9px] font-mono text-[#302633]/40">v0.1</span>
        </div>
      </aside>

      {/* 2. Elements Flyout Panel */}
      {activeNav === 'elements' && (
        <div
          className="fixed top-[76px] bottom-0 left-[72px] w-80 bg-white border-r border-[#EFE5D8] z-20 shadow-md flex flex-col animate-in fade-in slide-in-from-left-2 duration-150 select-none"
          role="region"
          aria-label="Elements Panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#F0EAE1]">
            <div className="flex items-center gap-2">
              {elementsSubcategory !== 'overview' && (
                <button
                  onClick={() => setElementsSubcategory('overview')}
                  className="p-1 rounded-lg hover:bg-[#FFF9F0] text-[#302633]/70 hover:text-[#302633] transition cursor-pointer"
                  title="Back to categories"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <h2 className="text-base font-bold text-[#302633]">
                {elementsSubcategory === 'sticky'
                  ? 'Sticky notes'
                  : elementsSubcategory === 'shapes'
                  ? 'Shapes'
                  : 'Browse categories'}
              </h2>
            </div>
            <button
              onClick={() => setActiveNav(null)}
              className="p-1.5 rounded-full hover:bg-[#FFF9F0] text-[#302633]/50 hover:text-[#302633] transition cursor-pointer"
              title="Close panel"
              aria-label="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Panel Body */}
          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            {elementsSubcategory === 'overview' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  {/* Category Card 1: Sticky notes */}
                  <button
                    onClick={() => {
                      setElementsSubcategory('sticky');
                      setActiveTool('sticky');
                    }}
                    className="group bg-[#FFFDF9] hover:bg-[#FFF9F0] border border-[#EFE5D8] hover:border-[#F26B5B]/40 rounded-2xl p-3 flex flex-col items-center gap-2.5 transition shadow-2xs hover:shadow-xs cursor-pointer text-center"
                  >
                    {/* Original Custom Sticky Notes Graphic */}
                    <div className="w-20 h-20 rounded-2xl bg-[#FFF9EE] border border-[#FDE68A]/60 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                      <StickyNotesCategoryIcon />
                    </div>
                    <span className="text-xs font-bold text-[#302633] group-hover:text-[#F26B5B] transition">
                      Sticky notes
                    </span>
                  </button>

                  {/* Category Card 2: Shapes */}
                  <button
                    onClick={() => {
                      setElementsSubcategory('shapes');
                      setActiveTool(activeShape);
                    }}
                    className="group bg-[#FFFDF9] hover:bg-[#FFF9F0] border border-[#EFE5D8] hover:border-[#F26B5B]/40 rounded-2xl p-3 flex flex-col items-center gap-2.5 transition shadow-2xs hover:shadow-xs cursor-pointer text-center"
                  >
                    {/* Original Custom Shapes Graphic */}
                    <div className="w-20 h-20 rounded-2xl bg-[#F5F3FF] border border-[#DDD6FE]/60 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                      <ShapesCategoryIcon />
                    </div>
                    <span className="text-xs font-bold text-[#302633] group-hover:text-[#F26B5B] transition">
                      Shapes
                    </span>
                  </button>
                </div>

                <div className="pt-2 text-[11px] text-[#302633]/60 leading-relaxed bg-[#FFFDF9] border border-[#EFE5D8] rounded-xl p-3">
                  Select a category above to choose templates, drop items directly onto the whiteboard, or switch your active tool.
                </div>
              </>
            )}

            {elementsSubcategory === 'sticky' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#302633]/60">
                    Templates (9 Designs)
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(STICKY_TEMPLATES).map(([key, item]) => {
                    const isSelected = selectedStickyTemplate === key;
                    return (
                      <button
                        key={key}
                        onClick={() => handleSelectStickyTemplate(key)}
                        className={`group relative rounded-xl border p-1 flex flex-col items-center gap-1 transition text-left cursor-pointer ${
                          isSelected
                            ? 'border-[#F26B5B] ring-2 ring-[#FCD9D3] bg-[#FFF0ED] shadow-2xs'
                            : 'border-[#EFE5D8] hover:border-[#F26B5B]/30 hover:bg-[#FFF9F0]'
                        }`}
                      >
                        <div className="w-full h-14 rounded-lg overflow-hidden bg-[#FFF9F0] flex items-center justify-center relative shadow-2xs">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover transition group-hover:scale-105"
                            loading="lazy"
                          />
                          {isSelected && (
                            <div className="absolute top-1 right-1 bg-[#F26B5B] text-white rounded-full p-0.5 shadow-xs">
                              <Check className="w-2.5 h-2.5 stroke-[3]" />
                            </div>
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-[#302633] text-center truncate w-full">
                          {item.name}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Primary Action Button shifted to bottom of templates */}
                <button
                  onClick={() => handlePlaceSticky()}
                  className="w-full py-2.5 px-4 bg-[#F26B5B] hover:bg-[#E05A4A] active:bg-[#CC4E3F] text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Drop on Board</span>
                </button>
              </div>
            )}

            {elementsSubcategory === 'shapes' && (
              <div className="space-y-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#302633]/60">
                  Geometric Shapes
                </span>

                <div className="grid grid-cols-2 gap-1.5">
                  {shapesList.map(({ shape, label, icon, shortcut }) => {
                    const isSelected = activeShape === shape;
                    return (
                      <button
                        key={shape}
                        onClick={() => {
                          setActiveShape(shape);
                          setActiveTool(shape);
                        }}
                        className={`p-2 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'border-[#F26B5B] bg-[#FFF0ED] text-[#F26B5B] font-semibold shadow-2xs'
                            : 'border-[#EFE5D8] hover:border-[#F26B5B]/30 hover:bg-[#FFF9F0] text-[#302633]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {icon}
                          <span className="text-xs">{label}</span>
                        </div>
                        <kbd className="text-[9px] font-mono text-[#302633]/40 bg-[#FFF9F0] px-1 rounded">
                          {shortcut}
                        </kbd>
                      </button>
                    );
                  })}
                </div>

                {/* Primary Action Button at bottom of shapes */}
                <button
                  onClick={() => handlePlaceShape()}
                  className="w-full py-2.5 px-4 bg-[#F26B5B] hover:bg-[#E05A4A] active:bg-[#CC4E3F] text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Drop on Board</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Text Flyout Panel */}
      {activeNav === 'text' && (
        <div
          className="fixed top-[76px] bottom-0 left-[72px] w-80 bg-white border-r border-[#EFE5D8] z-20 shadow-md flex flex-col animate-in fade-in slide-in-from-left-2 duration-150 select-none"
          role="region"
          aria-label="Text Panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#F0EAE1]">
            <h2 className="text-base font-bold text-[#302633]">Text</h2>
            <button
              onClick={() => setActiveNav(null)}
              className="p-1.5 rounded-full hover:bg-[#FFF9F0] text-[#302633]/50 hover:text-[#302633] transition cursor-pointer"
              title="Close panel"
              aria-label="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Panel Body */}
          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            {/* Primary Action Button: Add a text box */}
            <button
              onClick={() => {
                addTextBox();
                setActiveTool('select');
              }}
              className="w-full py-3 px-4 rounded-xl border border-[#F26B5B]/30 bg-[#FFF0ED] hover:bg-[#FFE6E1] text-[#F26B5B] font-bold text-xs flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add a text box</span>
            </button>

            {/* Typography Presets */}
            <div className="space-y-2 pt-2 border-t border-[#F0EAE1]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#302633]/50">
                Default text styles
              </span>

              {/* Heading */}
              <button
                onClick={() => {
                  addTextBox({ text: 'Heading', fontSize: 32, fontWeight: 'bold' });
                  setActiveTool('select');
                }}
                className="w-full p-2.5 rounded-xl border border-[#EFE5D8] hover:border-[#F26B5B]/40 hover:bg-[#FFF9F0] transition text-left cursor-pointer flex items-baseline justify-between"
              >
                <span className="text-lg font-bold text-[#302633]">Add a heading</span>
                <span className="text-[10px] text-[#302633]/40 font-mono">32px</span>
              </button>

              {/* Subheading */}
              <button
                onClick={() => {
                  addTextBox({ text: 'Subheading', fontSize: 22, fontWeight: '600' });
                  setActiveTool('select');
                }}
                className="w-full p-2.5 rounded-xl border border-[#EFE5D8] hover:border-[#F26B5B]/40 hover:bg-[#FFF9F0] transition text-left cursor-pointer flex items-baseline justify-between"
              >
                <span className="text-sm font-semibold text-[#302633]">Add a subheading</span>
                <span className="text-[10px] text-[#302633]/40 font-mono">22px</span>
              </button>

              {/* Body text */}
              <button
                onClick={() => {
                  addTextBox({ text: 'Body text', fontSize: 16, fontWeight: 'normal' });
                  setActiveTool('select');
                }}
                className="w-full p-2.5 rounded-xl border border-[#EFE5D8] hover:border-[#F26B5B]/40 hover:bg-[#FFF9F0] transition text-left cursor-pointer flex items-baseline justify-between"
              >
                <span className="text-xs text-[#302633]">Add body text</span>
                <span className="text-[10px] text-[#302633]/40 font-mono">16px</span>
              </button>
            </div>

            <div className="p-3 bg-[#FFFDF9] border border-[#EFE5D8] rounded-xl text-[11px] text-[#302633]/70 leading-relaxed">
              💡 Click anywhere on the whiteboard with the Text tool active (shortcut: <kbd className="font-mono bg-white px-1 border border-[#EFE5D8] rounded">T</kbd>) to place a new text box.
            </div>
          </div>
        </div>
      )}

      {/* 4. Projects Flyout Panel */}
      {activeNav === 'projects' && (
        <div
          className="fixed top-[76px] bottom-0 left-[72px] w-80 bg-white border-r border-[#EFE5D8] z-20 shadow-md flex flex-col animate-in fade-in slide-in-from-left-2 duration-150 select-none"
          role="region"
          aria-label="Projects Panel"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-[#F0EAE1]">
            <h2 className="text-base font-bold text-[#302633]">Projects</h2>
            <button
              onClick={() => setActiveNav(null)}
              className="p-1.5 rounded-full hover:bg-[#FFF9F0] text-[#302633]/50 hover:text-[#302633] transition cursor-pointer"
              title="Close panel"
              aria-label="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Panel Body */}
          <div className="p-4 overflow-y-auto flex-1 space-y-4">
            {/* Current Active Board Info */}
            <div className="p-3 bg-[#FFFDF9] border border-[#EFE5D8] rounded-xl space-y-1.5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#302633]/40">
                Current Whiteboard
              </div>
              <div className="font-bold text-sm text-[#302633]">
                {boardTitle || 'Untitled Board'}
              </div>
              <div className="flex items-center justify-between pt-1 text-[11px]">
                <span className="text-[#3B5B3E] font-medium">• Live · Connected</span>
                <button
                  onClick={() => {
                    setActiveTool('select');
                    resetZoom();
                    setPan({ x: 0, y: 0 });
                  }}
                  className="text-[#F26B5B] hover:text-[#E05A4A] font-semibold flex items-center gap-1 cursor-pointer"
                  title="Reset and center canvas viewport"
                >
                  <LayoutGrid className="w-3 h-3" />
                  <span>Center Canvas</span>
                </button>
              </div>
            </div>

            {/* Preserved Navigation Actions */}
            <div className="space-y-2">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#302633]/50">
                Board Management
              </div>

              {/* Simulation Settings */}
              <button
                onClick={() => setIsSimulationDrawerOpen(true)}
                className="w-full flex items-center justify-between p-3 rounded-xl border border-[#EFE5D8] hover:border-[#F26B5B]/30 hover:bg-[#FFF9F0] transition text-left cursor-pointer text-[#302633]"
              >
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-[#FFF9F0] text-[#302633]/70">
                    <Sliders className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold">Simulation Settings</div>
                    <div className="text-[10px] text-[#302633]/60">Latency, simulated editors & tests</div>
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
