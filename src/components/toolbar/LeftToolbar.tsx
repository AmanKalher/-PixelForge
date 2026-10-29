import React, { useState, useRef } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { STICKY_TEMPLATES } from '../../engine/stickyNoteTemplates';
import { SHAPE_CATEGORIES } from '../../engine/shapeDefinitions';
import { ShapeSubtype, ToolType } from '../../types/whiteboard';
import {
  Type,
  PenTool,
  Hand,
  Layers,
  History,
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
  Image as ImageIcon,
  Star,
  Heart,
  Sparkles,
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

// Original Custom Tables Category Illustration
const TablesCategoryIcon: React.FC<{ className?: string }> = ({ className = 'w-14 h-14' }) => (
  <svg
    viewBox="0 0 56 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <filter id="pf-tables-sh" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#302633" floodOpacity="0.12" />
      </filter>
      <linearGradient id="pf-table-hdr" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#C7D2FE" />
        <stop offset="100%" stopColor="#818CF8" />
      </linearGradient>
    </defs>
    <g filter="url(#pf-tables-sh)">
      <rect x="8" y="10" width="40" height="36" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
      <path d="M8 16C8 12.6863 10.6863 10 14 10H42C45.3137 10 48 12.6863 48 16V22H8V16Z" fill="url(#pf-table-hdr)" />
      <line x1="28" y1="10" x2="28" y2="46" stroke="#CBD5E1" strokeWidth="1.5" />
      <line x1="8" y1="34" x2="48" y2="34" stroke="#E2E8F0" strokeWidth="1.5" />
      <rect x="12" y="14" width="10" height="3" rx="1.5" fill="#FFFFFF" opacity="0.9" />
      <rect x="32" y="14" width="12" height="3" rx="1.5" fill="#FFFFFF" opacity="0.9" />
      <rect x="12" y="26" width="11" height="2.5" rx="1.25" fill="#94A3B8" />
      <rect x="32" y="26" width="9" height="2.5" rx="1.25" fill="#94A3B8" />
      <rect x="12" y="38" width="8" height="2.5" rx="1.25" fill="#94A3B8" />
      <rect x="32" y="38" width="11" height="2.5" rx="1.25" fill="#94A3B8" />
    </g>
  </svg>
);

// Original Custom Graphs Category Illustration
const GraphsCategoryIcon: React.FC<{ className?: string }> = ({ className = 'w-14 h-14' }) => (
  <svg
    viewBox="0 0 56 56"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <defs>
      <filter id="pf-graphs-sh" x="-15%" y="-15%" width="130%" height="130%">
        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#302633" floodOpacity="0.12" />
      </filter>
      <linearGradient id="pf-graph-bar1" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#818CF8" />
        <stop offset="100%" stopColor="#6366F1" />
      </linearGradient>
      <linearGradient id="pf-graph-bar2" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FF9688" />
        <stop offset="100%" stopColor="#F26B5B" />
      </linearGradient>
      <linearGradient id="pf-graph-bar3" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FCD34D" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
      <linearGradient id="pf-graph-bar4" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#10B981" />
      </linearGradient>
    </defs>
    <g filter="url(#pf-graphs-sh)">
      <rect x="8" y="10" width="40" height="36" rx="6" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
      <line x1="12" y1="40" x2="44" y2="40" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="14" y="28" width="5.5" height="12" rx="2" fill="url(#pf-graph-bar1)" />
      <rect x="22" y="18" width="5.5" height="22" rx="2" fill="url(#pf-graph-bar2)" />
      <rect x="30" y="24" width="5.5" height="16" rx="2" fill="url(#pf-graph-bar3)" />
      <rect x="38" y="15" width="5.5" height="25" rx="2" fill="url(#pf-graph-bar4)" />
      <path d="M16 26 L24 16 L33 22 L41 13" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="41" cy="13" r="2" fill="#6366F1" />
    </g>
  </svg>
);

const renderShapeIcon = (shape: string) => {
  if (['rectangle', 'square'].includes(shape)) return <Square className="w-3.5 h-3.5" />;
  if (['rounded-rectangle', 'roundedRect'].includes(shape)) return <Square className="w-3.5 h-3.5 rounded-xs" />;
  if (['circle', 'ellipse'].includes(shape)) return <Circle className="w-3.5 h-3.5" />;
  if (shape === 'triangle') return <Triangle className="w-3.5 h-3.5" />;
  if (['diamond', 'parallelogram', 'trapezoid', 'pentagon', 'hexagon', 'heptagon', 'octagon', 'nonagon', 'decagon'].includes(shape)) return <Diamond className="w-3.5 h-3.5" />;
  if (['line', 'wavy', 'smooth', 'hinged'].includes(shape)) return <Minus className="w-3.5 h-3.5" />;
  if (['arrow', 'arrowUp', 'arrowDown', 'arrowLeft', 'arrowRight', 'doubleArrow', 'chevron'].includes(shape)) return <MoveRight className="w-3.5 h-3.5" />;
  if (['star4', 'star5', 'star6', 'star8', 'burst', 'sun', 'gear'].includes(shape)) return <Star className="w-3.5 h-3.5" />;
  if (shape === 'heart') return <Heart className="w-3.5 h-3.5" />;
  return <Sparkles className="w-3.5 h-3.5" />;
};

export const LeftToolbar: React.FC = () => {
  const {
    activeNav,
    setActiveNav,
    isLayersPanelOpen,
    toggleLayersPanel,
    isHistoryModalOpen,
    setIsHistoryModalOpen,
    resetZoom,
    setPan,
    activeTool,
    setActiveTool,
    setActiveShape,
    activeShape,
    selectedStickyTemplate,
    setSelectedStickyTemplate,
    canvasEngine,
    addTextBox,
    addTable,
    addGraph,
    addImage,
    createMockObject,
    isUIPreviewMode,
  } = useWorkspace();

  const [elementsSubcategory, setElementsSubcategory] = useState<
    'overview' | 'sticky' | 'shapes' | 'tables' | 'graphs'
  >('overview');

  const [tableRows, setTableRows] = useState(4);
  const [tableCols, setTableCols] = useState(3);
  const [graphType, setGraphType] = useState('bar');
  const [graphData, setGraphData] = useState('Label,Value\nA,12\nB,19\nC,8\nD,15');
  const [selectedShapeCategory, setSelectedShapeCategory] = useState<string>('All');
  const [imageMessage, setImageMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleNavClick = (nav: 'elements' | 'text' | 'tools') => {
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

  const handleDropTable = () => {
    addTable({ rows: tableRows, cols: tableCols });
    setActiveTool('select');
  };

  const handleDropGraph = () => {
    addGraph({ graphType, data: graphData });
    setActiveTool('select');
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImageMessage('Uploading image...');
      await addImage(file);
      setImageMessage(null);
      setActiveTool('select');
    } catch (err: any) {
      setImageMessage(err?.message || 'Failed to upload image.');
    } finally {
      e.target.value = '';
    }
  };

  const allShapes = SHAPE_CATEGORIES.flatMap((c) =>
    c.options.map(([id, label]) => ({ shape: id as ShapeSubtype, label, category: c.label }))
  );

  const displayedShapes =
    selectedShapeCategory === 'All'
      ? allShapes
      : allShapes.filter((s) => s.category === selectedShapeCategory);

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

          {/* Pan Tool */}
          <button
            onClick={() => {
              if (activeTool === 'pan') {
                setActiveTool('select');
              } else {
                setActiveTool('pan');
                setActiveNav(null);
              }
            }}
            className={`flex flex-col items-center justify-center w-full py-1.5 rounded-xl transition cursor-pointer group ${
              activeTool === 'pan' ? 'text-[#F26B5B]' : 'text-[#302633]/70 hover:text-[#302633]'
            }`}
            title="Pan Canvas (H) or hold Space"
            aria-label="Pan Tool"
          >
            <div
              className={`w-11 h-9 rounded-2xl flex items-center justify-center transition ${
                activeTool === 'pan'
                  ? 'bg-[#FFF0ED] text-[#F26B5B] shadow-2xs ring-1 ring-[#FCD9D3]'
                  : 'group-hover:bg-[#FFF9F0]'
              }`}
            >
              <Hand className="w-5 h-5" />
            </div>
            <span
              className={`text-[11px] mt-1 tracking-tight transition ${
                activeTool === 'pan' ? 'font-bold text-[#F26B5B]' : 'font-medium'
              }`}
            >
              Pan
            </span>
          </button>

          {/* 4. Layer Tree */}
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

        {/* Bottom: Center Canvas & Version */}
        <div className="flex flex-col items-center gap-2 w-full pt-2 border-t border-[#EFE5D8]">
          <button
            onClick={() => {
              setActiveTool('select');
              resetZoom();
              setPan({ x: 0, y: 0 });
            }}
            className="p-2 rounded-xl text-[#302633]/60 hover:text-[#F26B5B] hover:bg-[#FFF0ED] transition cursor-pointer shadow-2xs"
            title="Center Canvas (Reset Viewport & Zoom)"
            aria-label="Center Canvas"
          >
            <LayoutGrid className="w-4 h-4" />
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
                  : elementsSubcategory === 'tables'
                  ? 'Tables'
                  : elementsSubcategory === 'graphs'
                  ? 'Charts & Graphs'
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
                    <div className="w-20 h-20 rounded-2xl bg-[#F5F3FF] border border-[#DDD6FE]/60 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                      <ShapesCategoryIcon />
                    </div>
                    <span className="text-xs font-bold text-[#302633] group-hover:text-[#F26B5B] transition">
                      Shapes
                    </span>
                  </button>

                  {/* Category Card 3: Tables */}
                  <button
                    onClick={() => {
                      setElementsSubcategory('tables');
                    }}
                    className="group bg-[#FFFDF9] hover:bg-[#FFF9F0] border border-[#EFE5D8] hover:border-[#F26B5B]/40 rounded-2xl p-3 flex flex-col items-center gap-2.5 transition shadow-2xs hover:shadow-xs cursor-pointer text-center"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-[#EEF2FF] border border-[#C7D2FE]/60 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                      <TablesCategoryIcon />
                    </div>
                    <span className="text-xs font-bold text-[#302633] group-hover:text-[#F26B5B] transition">
                      Tables
                    </span>
                  </button>

                  {/* Category Card 4: Graphs */}
                  <button
                    onClick={() => {
                      setElementsSubcategory('graphs');
                    }}
                    className="group bg-[#FFFDF9] hover:bg-[#FFF9F0] border border-[#EFE5D8] hover:border-[#F26B5B]/40 rounded-2xl p-3 flex flex-col items-center gap-2.5 transition shadow-2xs hover:shadow-xs cursor-pointer text-center"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-[#F0FDF4] border border-[#BBF7D0]/60 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform">
                      <GraphsCategoryIcon />
                    </div>
                    <span className="text-xs font-bold text-[#302633] group-hover:text-[#F26B5B] transition">
                      Charts & Graphs
                    </span>
                  </button>
                </div>

                {/* Upload Image Section */}
                <div className="pt-2 border-t border-[#F0EAE1]">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2.5 px-3 rounded-xl border border-dashed border-[#CBD5E1] hover:border-[#F26B5B] bg-[#FFFDF9] hover:bg-[#FFF0ED] text-[#302633] hover:text-[#F26B5B] text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-[#F26B5B]" />
                    <span>Upload Image to Board</span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={handleImageFileChange}
                  />
                  {imageMessage && (
                    <p className="text-[10px] text-[#F26B5B] text-center mt-1">{imageMessage}</p>
                  )}
                </div>

                <div className="text-[11px] text-[#302633]/60 leading-relaxed bg-[#FFFDF9] border border-[#EFE5D8] rounded-xl p-3">
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
                {/* Category Selector Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px]">
                  {['All', ...SHAPE_CATEGORIES.map((c) => c.label)].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedShapeCategory(cat)}
                      className={`px-2.5 py-1 rounded-full whitespace-nowrap transition cursor-pointer shrink-0 ${
                        selectedShapeCategory === cat
                          ? 'bg-[#F26B5B] text-white font-semibold shadow-2xs'
                          : 'bg-[#FFF9F0] border border-[#EFE5D8] text-[#302633]/70 hover:text-[#302633]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Filtered Shapes Grid */}
                <div className="grid grid-cols-2 gap-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {displayedShapes.map(({ shape, label }) => {
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
                        title={label}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {renderShapeIcon(shape)}
                          <span className="text-xs truncate">{label}</span>
                        </div>
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

            {elementsSubcategory === 'tables' && (
              <div className="space-y-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#302633]/60">
                  Customizable Grid Table
                </span>

                <div className="space-y-3 bg-[#FFFDF9] border border-[#EFE5D8] rounded-xl p-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#302633]">Rows ({tableRows})</label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTableRows((r) => Math.max(2, r - 1))}
                        className="w-7 h-7 rounded-lg border border-[#EFE5D8] bg-white flex items-center justify-center text-xs font-bold text-[#302633] hover:bg-[#FFF9F0] cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-xs font-mono font-semibold">{tableRows}</span>
                      <button
                        type="button"
                        onClick={() => setTableRows((r) => Math.min(12, r + 1))}
                        className="w-7 h-7 rounded-lg border border-[#EFE5D8] bg-white flex items-center justify-center text-xs font-bold text-[#302633] hover:bg-[#FFF9F0] cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#302633]">Columns ({tableCols})</label>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setTableCols((c) => Math.max(2, c - 1))}
                        className="w-7 h-7 rounded-lg border border-[#EFE5D8] bg-white flex items-center justify-center text-xs font-bold text-[#302633] hover:bg-[#FFF9F0] cursor-pointer"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-xs font-mono font-semibold">{tableCols}</span>
                      <button
                        type="button"
                        onClick={() => setTableCols((c) => Math.min(8, c + 1))}
                        className="w-7 h-7 rounded-lg border border-[#EFE5D8] bg-white flex items-center justify-center text-xs font-bold text-[#302633] hover:bg-[#FFF9F0] cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Table miniature grid visualization */}
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex flex-col items-center justify-center">
                  <div
                    className="grid gap-1 max-w-[200px]"
                    style={{ gridTemplateColumns: `repeat(${tableCols}, minmax(0, 1fr))` }}
                  >
                    {Array.from({ length: tableRows * tableCols }).map((_, i) => (
                      <div
                        key={i}
                        className={`h-4 w-7 rounded-xs border text-[8px] flex items-center justify-center ${
                          Math.floor(i / tableCols) === 0
                            ? 'bg-[#E9E7FF] border-[#818CF8]'
                            : 'bg-white border-[#CBD5E1]'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-[10px] text-slate-500 mt-2 font-mono">
                    {tableRows} rows × {tableCols} columns
                  </span>
                </div>

                <button
                  onClick={handleDropTable}
                  className="w-full py-2.5 px-4 bg-[#F26B5B] hover:bg-[#E05A4A] active:bg-[#CC4E3F] text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Drop Table on Board</span>
                </button>
              </div>
            )}

            {elementsSubcategory === 'graphs' && (
              <div className="space-y-4">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#302633]/60">
                  Data Chart / Graph
                </span>

                <div className="space-y-3 bg-[#FFFDF9] border border-[#EFE5D8] rounded-xl p-3">
                  <div>
                    <label className="text-xs font-semibold text-[#302633] block mb-1">Chart Type</label>
                    <select
                      value={graphType}
                      onChange={(e) => setGraphType(e.target.value)}
                      className="w-full text-xs p-2 rounded-lg border border-[#EFE5D8] bg-white text-[#302633] focus:outline-none focus:border-[#F26B5B]"
                    >
                      <option value="bar">Bar chart</option>
                      <option value="horizontal_bar">Horizontal bar chart</option>
                      <option value="line">Line chart</option>
                      <option value="area">Area chart</option>
                      <option value="scatter">Scatter plot</option>
                      <option value="pie">Pie chart</option>
                      <option value="doughnut">Doughnut chart</option>
                      <option value="radar">Radar chart</option>
                      <option value="polar_area">Polar area chart</option>
                      <option value="wavy">Wavy chart</option>
                      <option value="histogram">Histogram</option>
                      <option value="stacked_bar">Stacked bar</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-[#302633]">CSV Data (Label, Value)</label>
                      <button
                        type="button"
                        onClick={() =>
                          setGraphData(
                            'Label,Value\nDesign,32\nEngineering,45\nMarketing,18\nResearch,24'
                          )
                        }
                        className="text-[10px] text-[#F26B5B] hover:underline cursor-pointer"
                      >
                        Load sample
                      </button>
                    </div>
                    <textarea
                      value={graphData}
                      onChange={(e) => setGraphData(e.target.value)}
                      rows={4}
                      className="w-full text-xs font-mono p-2 rounded-lg border border-[#EFE5D8] bg-white text-[#302633] focus:outline-none focus:border-[#F26B5B] resize-none"
                      placeholder={'Label,Value\nA,12\nB,19'}
                    />
                  </div>
                </div>

                <button
                  onClick={handleDropGraph}
                  className="w-full py-2.5 px-4 bg-[#F26B5B] hover:bg-[#E05A4A] active:bg-[#CC4E3F] text-white text-xs font-semibold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer mt-1"
                >
                  <Plus className="w-4 h-4" />
                  <span>Drop Graph on Board</span>
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
    </>
  );
};
