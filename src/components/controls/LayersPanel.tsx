import React, { useState } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import {
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
  StickyNote,
  Square,
  Circle,
  Diamond,
  Triangle,
  Type,
  PenTool,
  MoveRight,
  Link2,
  Link2Off,
  X,
  Lock,
  Unlock,
  Table as TableIcon,
  Image as ImageIcon,
  BarChart2,
  Hexagon,
  Star,
  Heart,
  Cloud,
  MessageSquare,
  Zap,
} from 'lucide-react';

export const LayersPanel: React.FC = () => {
  const {
    isLayersPanelOpen,
    toggleLayersPanel,
    mockObjects,
    selectedCanvasObject,
    selectedMockObjectId,
    setSelectedMockObjectId,
    styleConfig,
    updateObjectProperties,
    toggleObjectVisibility,
    toggleObjectLock,
  } = useWorkspace();

  const [activeTab, setActiveTab] = useState<'layers' | 'properties'>('layers');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [isRadiusLinked, setIsRadiusLinked] = useState<boolean>(true);

  // Default corner radii
  const [radii, setRadii] = useState<[number, number, number, number]>([8, 8, 8, 8]);

  if (!isLayersPanelOpen) return null;

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const selectedObject = selectedCanvasObject || (selectedMockObjectId
    ? mockObjects.find((o) => o.id === selectedMockObjectId) || null
    : null);

  const isArrowOrLine = (type: string) =>
    [
      'arrow',
      'line',
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
      'arrowUp',
      'arrowDown',
      'arrowLeft',
      'arrowRight',
      'doubleArrow',
      'chevron',
    ].includes(type);

  const isDrawing = (type: string) =>
    ['brush', 'highlighter', 'pen', 'marker', 'pencil', 'calligraphy', 'stroke', 'path'].includes(type);

  // Categories partition
  const stickyNotes = mockObjects.filter((o) => o.type === 'sticky');
  const tables = mockObjects.filter((o) => o.type === 'table');
  const images = mockObjects.filter((o) => o.type === 'image');
  const graphs = mockObjects.filter((o) => o.type === 'graph');
  const textItems = mockObjects.filter((o) => o.type === 'text');
  const drawings = mockObjects.filter((o) => isDrawing(o.type));
  const arrows = mockObjects.filter((o) => isArrowOrLine(o.type));

  const shapes = mockObjects.filter(
    (o) =>
      o.type !== 'sticky' &&
      o.type !== 'table' &&
      o.type !== 'image' &&
      o.type !== 'graph' &&
      o.type !== 'text' &&
      !isDrawing(o.type) &&
      !isArrowOrLine(o.type) &&
      o.type !== 'select' &&
      o.type !== 'pan' &&
      o.type !== 'eraser'
  );

  const getShapeIcon = (type: string) => {
    switch (type) {
      case 'rounded-rectangle':
      case 'roundedRect':
        return <Square className="w-3.5 h-3.5 text-[#6D3B67] rounded-xs" />;
      case 'circle':
        return <Circle className="w-3.5 h-3.5 text-[#6D3B67]" />;
      case 'ellipse':
        return <Circle className="w-3.5 h-3.5 text-[#6D3B67] scale-x-125" />;
      case 'diamond':
        return <Diamond className="w-3.5 h-3.5 text-[#6D3B67]" />;
      case 'triangle':
        return <Triangle className="w-3.5 h-3.5 text-[#6D3B67]" />;
      case 'pentagon':
      case 'hexagon':
      case 'heptagon':
      case 'octagon':
      case 'nonagon':
      case 'decagon':
        return <Hexagon className="w-3.5 h-3.5 text-[#6D3B67]" />;
      case 'star4':
      case 'star5':
      case 'star6':
      case 'star8':
      case 'burst':
      case 'sun':
        return <Star className="w-3.5 h-3.5 text-[#6D3B67]" />;
      case 'heart':
        return <Heart className="w-3.5 h-3.5 text-[#E11D48]" />;
      case 'cloud':
        return <Cloud className="w-3.5 h-3.5 text-[#0284C7]" />;
      case 'speech':
      case 'thought':
      case 'callout':
        return <MessageSquare className="w-3.5 h-3.5 text-[#6D3B67]" />;
      case 'lightning':
        return <Zap className="w-3.5 h-3.5 text-[#EAB308]" />;
      case 'table':
        return <TableIcon className="w-3.5 h-3.5 text-[#6366F1]" />;
      case 'image':
        return <ImageIcon className="w-3.5 h-3.5 text-[#059669]" />;
      case 'graph':
        return <BarChart2 className="w-3.5 h-3.5 text-[#F59E0B]" />;
      case 'parallelogram':
      case 'trapezoid':
        return (
          <svg className="w-3.5 h-3.5 text-[#6D3B67]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 4h14l-4 16H2z" strokeLinejoin="round" />
          </svg>
        );
      case 'rectangle':
      default:
        return <Square className="w-3.5 h-3.5 text-[#6D3B67]" />;
    }
  };

  const handleRadiusChange = (index: number, val: number) => {
    const clamped = Math.max(0, Math.min(64, val || 0));
    let nextRadii: [number, number, number, number];
    if (isRadiusLinked) {
      nextRadii = [clamped, clamped, clamped, clamped];
    } else {
      nextRadii = [...radii] as [number, number, number, number];
      nextRadii[index] = clamped;
    }
    setRadii(nextRadii);
    if (selectedObject) {
      updateObjectProperties(selectedObject.id, { borderRadius: nextRadii[0] });
    }
  };

  const currentFill = selectedObject?.fillColor || styleConfig.fillColor || '#EDE9FE';
  const currentStroke = selectedObject?.strokeColor || styleConfig.strokeColor || '#8B5CF6';
  const currentWidth = selectedObject?.strokeWidth || styleConfig.strokeWidth || 2;
  const currentOpacity =
    selectedObject?.opacity !== undefined
      ? Math.round((selectedObject.opacity || 1) * 100)
      : 100;

  return (
    <aside
      className="fixed top-[76px] bottom-0 right-0 w-72 bg-white border-l border-[#EFE5D8] z-20 flex flex-col justify-between select-none shadow-xs text-[#302633]"
      aria-label="Right sidebar for layers and properties"
    >
      {/* 1. TOP SECTION: TABS ("Layers" | "Properties") */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Tab Header */}
        <div className="flex items-center justify-between border-b border-[#EFE5D8] px-3 pt-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('layers')}
              className={`pb-2 text-xs font-semibold tracking-tight transition border-b-2 cursor-pointer ${
                activeTab === 'layers'
                  ? 'border-[#F26B5B] text-[#F26B5B]'
                  : 'border-transparent text-[#302633]/60 hover:text-[#302633]'
              }`}
            >
              Layers
            </button>
            <button
              onClick={() => setActiveTab('properties')}
              className={`pb-2 text-xs font-semibold tracking-tight transition border-b-2 cursor-pointer ${
                activeTab === 'properties'
                  ? 'border-[#F26B5B] text-[#F26B5B]'
                  : 'border-transparent text-[#302633]/60 hover:text-[#302633]'
              }`}
            >
              Properties
            </button>
          </div>
          <button
            onClick={toggleLayersPanel}
            className="p-1 rounded text-[#302633]/40 hover:text-[#302633] hover:bg-[#FFF9F0] transition -mt-2 cursor-pointer"
            title="Close sidebar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Tab Body: Layers Tree View */}
        {activeTab === 'layers' ? (
          <div className="flex-1 overflow-y-auto p-2 space-y-2 text-xs">
            {/* Category 1: Sticky Notes (2) */}
            <div className="space-y-0.5">
              <button
                onClick={() => toggleCategory('sticky')}
                className="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-slate-50 text-slate-600 font-semibold text-[11px]"
              >
                <div className="flex items-center gap-1.5">
                  {collapsedCategories['sticky'] ? (
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  )}
                  <StickyNote className="w-3.5 h-3.5 text-amber-500" />
                  <span>Sticky Notes ({stickyNotes.length})</span>
                </div>
              </button>

              {!collapsedCategories['sticky'] && (
                <div className="pl-5 space-y-0.5">
                  {stickyNotes.map((obj, i) => {
                    const isSelected = selectedMockObjectId === obj.id;
                    const isHidden = obj.visible === false;
                    const swatchColor =
                      obj.stickyColor || (i === 0 ? '#FEF08A' : '#BBF7D0');

                    return (
                      <div
                        key={obj.id}
                        onClick={() => setSelectedMockObjectId(obj.id)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition ${
                          isSelected
                            ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <span
                            className="w-3 h-3 rounded-xs border border-black/10 flex-shrink-0 shadow-2xs"
                            style={{ backgroundColor: swatchColor }}
                          />
                          <span className="truncate text-xs">
                            {obj.text?.split('\n')[0] || `Note ${i + 1}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleObjectLock(obj.id);
                            }}
                            className={`p-0.5 transition ${
                              obj.isPixelForgeLocked
                                ? 'text-[#F26B5B]'
                                : 'text-slate-300 hover:text-slate-500'
                            }`}
                            title={obj.isPixelForgeLocked ? 'Unlock layer' : 'Lock layer'}
                          >
                            {obj.isPixelForgeLocked ? (
                              <Lock className="w-3 h-3" />
                            ) : (
                              <Unlock className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleObjectVisibility(obj.id);
                            }}
                            className="p-0.5 text-slate-400 hover:text-slate-600 transition"
                            title={isHidden ? 'Show layer' : 'Hide layer'}
                          >
                            {isHidden ? (
                              <EyeOff className="w-3 h-3 text-slate-300" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Category 2: Shapes (3) */}
            <div className="space-y-0.5">
              <button
                onClick={() => toggleCategory('shapes')}
                className="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-slate-50 text-slate-600 font-semibold text-[11px]"
              >
                <div className="flex items-center gap-1.5">
                  {collapsedCategories['shapes'] ? (
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  )}
                  <Square className="w-3.5 h-3.5 text-[#6D3B67]" />
                  <span>Shapes ({shapes.length})</span>
                </div>
              </button>

              {!collapsedCategories['shapes'] && (
                <div className="pl-5 space-y-0.5">
                  {shapes.map((obj) => {
                    const isSelected = selectedMockObjectId === obj.id || selectedCanvasObject?.id === obj.id;
                    const isHidden = obj.visible === false;
                    const label =
                      obj.name ||
                      obj.text ||
                      obj.type
                        .split('-')
                        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                        .join(' ');

                    return (
                      <div
                        key={obj.id}
                        onClick={() => setSelectedMockObjectId(obj.id)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition ${
                          isSelected
                            ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          {getShapeIcon(obj.type)}
                          <span className="truncate text-xs">{label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleObjectLock(obj.id);
                            }}
                            className={`p-0.5 transition ${
                              obj.isPixelForgeLocked
                                ? 'text-[#F26B5B]'
                                : 'text-slate-300 hover:text-slate-500'
                            }`}
                            title={obj.isPixelForgeLocked ? 'Unlock layer' : 'Lock layer'}
                          >
                            {obj.isPixelForgeLocked ? (
                              <Lock className="w-3 h-3" />
                            ) : (
                              <Unlock className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleObjectVisibility(obj.id);
                            }}
                            className="p-0.5 text-slate-400 hover:text-slate-600 transition"
                            title={isHidden ? 'Show layer' : 'Hide layer'}
                          >
                            {isHidden ? (
                              <EyeOff className="w-3 h-3 text-slate-300" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Category: Tables */}
            <div className="space-y-0.5">
              <button
                onClick={() => toggleCategory('tables')}
                className="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-slate-50 text-slate-600 font-semibold text-[11px]"
              >
                <div className="flex items-center gap-1.5">
                  {collapsedCategories['tables'] ? (
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  )}
                  <TableIcon className="w-3.5 h-3.5 text-[#6366F1]" />
                  <span>Tables ({tables.length})</span>
                </div>
              </button>

              {!collapsedCategories['tables'] && (
                <div className="pl-5 space-y-0.5">
                  {tables.map((obj, i) => {
                    const isSelected = selectedMockObjectId === obj.id || selectedCanvasObject?.id === obj.id;
                    const isHidden = obj.visible === false;
                    const label =
                      obj.name ||
                      `Table (${obj.tableRows || 4}×${obj.tableCols || 3}) ${i + 1}`;

                    return (
                      <div
                        key={obj.id}
                        onClick={() => setSelectedMockObjectId(obj.id)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition ${
                          isSelected
                            ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <TableIcon className="w-3.5 h-3.5 text-[#6366F1] flex-shrink-0" />
                          <span className="truncate text-xs">{label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleObjectLock(obj.id);
                            }}
                            className={`p-0.5 transition ${
                              obj.isPixelForgeLocked
                                ? 'text-[#F26B5B]'
                                : 'text-slate-300 hover:text-slate-500'
                            }`}
                            title={obj.isPixelForgeLocked ? 'Unlock layer' : 'Lock layer'}
                          >
                            {obj.isPixelForgeLocked ? (
                              <Lock className="w-3 h-3" />
                            ) : (
                              <Unlock className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleObjectVisibility(obj.id);
                            }}
                            className="p-0.5 text-slate-400 hover:text-slate-600 transition"
                            title={isHidden ? 'Show layer' : 'Hide layer'}
                          >
                            {isHidden ? (
                              <EyeOff className="w-3 h-3 text-slate-300" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Category: Images */}
            <div className="space-y-0.5">
              <button
                onClick={() => toggleCategory('images')}
                className="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-slate-50 text-slate-600 font-semibold text-[11px]"
              >
                <div className="flex items-center gap-1.5">
                  {collapsedCategories['images'] ? (
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  )}
                  <ImageIcon className="w-3.5 h-3.5 text-[#059669]" />
                  <span>Images ({images.length})</span>
                </div>
              </button>

              {!collapsedCategories['images'] && (
                <div className="pl-5 space-y-0.5">
                  {images.map((obj, i) => {
                    const isSelected = selectedMockObjectId === obj.id || selectedCanvasObject?.id === obj.id;
                    const isHidden = obj.visible === false;
                    const label = obj.name || obj.imageName || `Image ${i + 1}`;

                    return (
                      <div
                        key={obj.id}
                        onClick={() => setSelectedMockObjectId(obj.id)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition ${
                          isSelected
                            ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <ImageIcon className="w-3.5 h-3.5 text-[#059669] flex-shrink-0" />
                          <span className="truncate text-xs">{label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleObjectLock(obj.id);
                            }}
                            className={`p-0.5 transition ${
                              obj.isPixelForgeLocked
                                ? 'text-[#F26B5B]'
                                : 'text-slate-300 hover:text-slate-500'
                            }`}
                            title={obj.isPixelForgeLocked ? 'Unlock layer' : 'Lock layer'}
                          >
                            {obj.isPixelForgeLocked ? (
                              <Lock className="w-3 h-3" />
                            ) : (
                              <Unlock className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleObjectVisibility(obj.id);
                            }}
                            className="p-0.5 text-slate-400 hover:text-slate-600 transition"
                            title={isHidden ? 'Show layer' : 'Hide layer'}
                          >
                            {isHidden ? (
                              <EyeOff className="w-3 h-3 text-slate-300" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Category: Charts & Graphs */}
            <div className="space-y-0.5">
              <button
                onClick={() => toggleCategory('graphs')}
                className="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-slate-50 text-slate-600 font-semibold text-[11px]"
              >
                <div className="flex items-center gap-1.5">
                  {collapsedCategories['graphs'] ? (
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  )}
                  <BarChart2 className="w-3.5 h-3.5 text-[#F59E0B]" />
                  <span>Charts ({graphs.length})</span>
                </div>
              </button>

              {!collapsedCategories['graphs'] && (
                <div className="pl-5 space-y-0.5">
                  {graphs.map((obj, i) => {
                    const isSelected = selectedMockObjectId === obj.id || selectedCanvasObject?.id === obj.id;
                    const isHidden = obj.visible === false;
                    const label =
                      obj.name ||
                      (obj.graphType
                        ? `${obj.graphType.charAt(0).toUpperCase() + obj.graphType.slice(1)} Chart`
                        : `Chart ${i + 1}`);

                    return (
                      <div
                        key={obj.id}
                        onClick={() => setSelectedMockObjectId(obj.id)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition ${
                          isSelected
                            ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <BarChart2 className="w-3.5 h-3.5 text-[#F59E0B] flex-shrink-0" />
                          <span className="truncate text-xs">{label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleObjectLock(obj.id);
                            }}
                            className={`p-0.5 transition ${
                              obj.isPixelForgeLocked
                                ? 'text-[#F26B5B]'
                                : 'text-slate-300 hover:text-slate-500'
                            }`}
                            title={obj.isPixelForgeLocked ? 'Unlock layer' : 'Lock layer'}
                          >
                            {obj.isPixelForgeLocked ? (
                              <Lock className="w-3 h-3" />
                            ) : (
                              <Unlock className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleObjectVisibility(obj.id);
                            }}
                            className="p-0.5 text-slate-400 hover:text-slate-600 transition"
                            title={isHidden ? 'Show layer' : 'Hide layer'}
                          >
                            {isHidden ? (
                              <EyeOff className="w-3 h-3 text-slate-300" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Category: Text */}
            <div className="space-y-0.5">
              <button
                onClick={() => toggleCategory('text')}
                className="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-slate-50 text-slate-600 font-semibold text-[11px]"
              >
                <div className="flex items-center gap-1.5">
                  {collapsedCategories['text'] ? (
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  )}
                  <Type className="w-3.5 h-3.5 text-slate-600" />
                  <span>Text ({textItems.length})</span>
                </div>
              </button>

              {!collapsedCategories['text'] && (
                <div className="pl-5 space-y-0.5">
                  {textItems.map((obj, i) => {
                    const isSelected = selectedMockObjectId === obj.id || selectedCanvasObject?.id === obj.id;
                    const isHidden = obj.visible === false;
                    return (
                      <div
                        key={obj.id}
                        onClick={() => setSelectedMockObjectId(obj.id)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition ${
                          isSelected
                            ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <Type className="w-3 h-3 text-slate-400" />
                          <span className="truncate text-xs">
                            {obj.name || obj.text || `Text ${i + 1}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleObjectLock(obj.id);
                            }}
                            className={`p-0.5 transition ${
                              obj.isPixelForgeLocked
                                ? 'text-[#F26B5B]'
                                : 'text-slate-300 hover:text-slate-500'
                            }`}
                            title={obj.isPixelForgeLocked ? 'Unlock layer' : 'Lock layer'}
                          >
                            {obj.isPixelForgeLocked ? (
                              <Lock className="w-3 h-3" />
                            ) : (
                              <Unlock className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleObjectVisibility(obj.id);
                            }}
                            className="p-0.5 text-slate-400 hover:text-slate-600 transition"
                            title={isHidden ? 'Show layer' : 'Hide layer'}
                          >
                            {isHidden ? (
                              <EyeOff className="w-3 h-3 text-slate-300" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Category: Drawings */}
            <div className="space-y-0.5">
              <button
                onClick={() => toggleCategory('drawings')}
                className="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-slate-50 text-slate-600 font-semibold text-[11px]"
              >
                <div className="flex items-center gap-1.5">
                  {collapsedCategories['drawings'] ? (
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  )}
                  <PenTool className="w-3.5 h-3.5 text-[#F26B5B]" />
                  <span>Drawings ({drawings.length})</span>
                </div>
              </button>

              {!collapsedCategories['drawings'] && (
                <div className="pl-5 space-y-0.5">
                  {drawings.map((obj, i) => {
                    const isSelected = selectedMockObjectId === obj.id || selectedCanvasObject?.id === obj.id;
                    const isHidden = obj.visible === false;
                    return (
                      <div
                        key={obj.id}
                        onClick={() => setSelectedMockObjectId(obj.id)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition ${
                          isSelected
                            ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <PenTool className="w-3 h-3 text-slate-400" />
                          <span className="truncate text-xs">
                            {obj.name || (obj.type === 'highlighter' ? `Highlight ${i + 1}` : `Vector Sketch ${i + 1}`)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleObjectLock(obj.id);
                            }}
                            className={`p-0.5 transition ${
                              obj.isPixelForgeLocked
                                ? 'text-[#F26B5B]'
                                : 'text-slate-300 hover:text-slate-500'
                            }`}
                            title={obj.isPixelForgeLocked ? 'Unlock layer' : 'Lock layer'}
                          >
                            {obj.isPixelForgeLocked ? (
                              <Lock className="w-3 h-3" />
                            ) : (
                              <Unlock className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleObjectVisibility(obj.id);
                            }}
                            className="p-0.5 text-slate-400 hover:text-slate-600 transition"
                            title={isHidden ? 'Show layer' : 'Hide layer'}
                          >
                            {isHidden ? (
                              <EyeOff className="w-3 h-3 text-slate-300" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Category: Arrows */}
            <div className="space-y-0.5">
              <button
                onClick={() => toggleCategory('arrows')}
                className="w-full flex items-center justify-between px-2 py-1 rounded hover:bg-slate-50 text-slate-600 font-semibold text-[11px]"
              >
                <div className="flex items-center gap-1.5">
                  {collapsedCategories['arrows'] ? (
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  )}
                  <MoveRight className="w-3.5 h-3.5 text-[#F26B5B]" />
                  <span>Arrows ({arrows.length})</span>
                </div>
              </button>

              {!collapsedCategories['arrows'] && (
                <div className="pl-5 space-y-0.5">
                  {arrows.map((obj, i) => {
                    const isSelected = selectedMockObjectId === obj.id || selectedCanvasObject?.id === obj.id;
                    const isHidden = obj.visible === false;
                    const label =
                      obj.name ||
                      (i === 0 && arrows.length === 2 ? 'Frontend → API' : i === 1 && arrows.length === 2 ? 'API → Database' : `Arrow ${i + 1}`);
                    return (
                      <div
                        key={obj.id}
                        onClick={() => setSelectedMockObjectId(obj.id)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition ${
                          isSelected
                            ? 'bg-[#FFF0ED] text-[#F26B5B] font-semibold'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <MoveRight className="w-3 h-3 text-slate-400" />
                          <span className="truncate text-xs">{label}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleObjectLock(obj.id);
                            }}
                            className={`p-0.5 transition ${
                              obj.isPixelForgeLocked
                                ? 'text-[#F26B5B]'
                                : 'text-slate-300 hover:text-slate-500'
                            }`}
                            title={obj.isPixelForgeLocked ? 'Unlock layer' : 'Lock layer'}
                          >
                            {obj.isPixelForgeLocked ? (
                              <Lock className="w-3 h-3" />
                            ) : (
                              <Unlock className="w-3 h-3" />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleObjectVisibility(obj.id);
                            }}
                            className="p-0.5 text-slate-400 hover:text-slate-600 transition"
                            title={isHidden ? 'Show layer' : 'Hide layer'}
                          >
                            {isHidden ? (
                              <EyeOff className="w-3 h-3 text-slate-300" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Properties Tab Content */
          <div className="flex-1 overflow-y-auto p-3 text-xs space-y-3">
            <div className="text-slate-500 font-medium">
              Canvas Metadata & Layout
            </div>
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Board Format</span>
                <span className="font-semibold text-slate-800">Infinite Grid</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Objects</span>
                <span className="font-semibold text-slate-800">{mockObjects.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Coordinate Engine</span>
                <span className="font-semibold text-slate-800">Fabric.js (M2)</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. BOTTOM SECTION: OBJECT PROPERTIES INSPECTOR */}
      {selectedObject ? (
        <div className="border-t border-slate-200 bg-white p-3 space-y-3 shadow-xs max-h-72 overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              {getShapeIcon(selectedObject.type)}
              <span>
                Selected:{' '}
                {selectedObject.name ||
                  selectedObject.type.charAt(0).toUpperCase() +
                    selectedObject.type.slice(1)}
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              {selectedObject.id}
            </span>
          </div>

          {/* A. STICKY NOTE INSPECTOR */}
          {selectedObject.type === 'sticky' && (
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Template</span>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium text-[11px] capitalize">
                  {selectedObject.template || 'Sunny Fold'}
                </span>
              </div>

              {/* Text / Foreground Color */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Text Color & Opacity
                </label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border border-slate-300 shadow-2xs flex-shrink-0"
                    style={{ backgroundColor: selectedObject.fillColor || '#252525' }}
                  />
                  <input
                    type="text"
                    value={(selectedObject.fillColor || '#252525').toUpperCase()}
                    onChange={(e) => {
                      const hex = e.target.value;
                      updateObjectProperties(selectedObject.id, { fillColor: hex });
                    }}
                    className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-800 focus:bg-white focus:border-[#F26B5B] outline-none"
                  />
                  <select
                    value={`${currentOpacity}%`}
                    onChange={(e) => {
                      const op = parseInt(e.target.value, 10) / 100;
                      updateObjectProperties(selectedObject.id, { opacity: op });
                    }}
                    className="w-16 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="100%">100%</option>
                    <option value="75%">75%</option>
                    <option value="50%">50%</option>
                    <option value="25%">25%</option>
                  </select>
                </div>
              </div>

              {/* Note Content Textarea */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Note Content (Line 1 = Header)
                </label>
                <textarea
                  value={selectedObject.text || ''}
                  rows={3}
                  onChange={(e) => {
                    updateObjectProperties(selectedObject.id, { text: e.target.value });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800 focus:bg-white focus:border-[#F26B5B] outline-none resize-none leading-snug"
                />
              </div>
            </div>
          )}

          {/* B. STANDALONE TEXT INSPECTOR */}
          {selectedObject.type === 'text' && (
            <div className="space-y-2.5">
              {/* Text Content */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Text Content
                </label>
                <textarea
                  value={selectedObject.text || ''}
                  rows={2}
                  onChange={(e) => {
                    updateObjectProperties(selectedObject.id, { text: e.target.value });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded p-1.5 text-xs text-slate-800 focus:bg-white focus:border-[#F26B5B] outline-none resize-none"
                />
              </div>

              {/* Text Color & Opacity */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Color & Opacity
                </label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border border-slate-300 shadow-2xs flex-shrink-0"
                    style={{ backgroundColor: selectedObject.fillColor || '#1E293B' }}
                  />
                  <input
                    type="text"
                    value={(selectedObject.fillColor || '#1E293B').toUpperCase()}
                    onChange={(e) => {
                      const hex = e.target.value;
                      updateObjectProperties(selectedObject.id, { fillColor: hex });
                    }}
                    className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-800 focus:bg-white focus:border-[#F26B5B] outline-none"
                  />
                  <select
                    value={`${currentOpacity}%`}
                    onChange={(e) => {
                      const op = parseInt(e.target.value, 10) / 100;
                      updateObjectProperties(selectedObject.id, { opacity: op });
                    }}
                    className="w-16 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="100%">100%</option>
                    <option value="75%">75%</option>
                    <option value="50%">50%</option>
                    <option value="25%">25%</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* C. DRAWINGS INSPECTOR */}
          {(selectedObject.type === 'brush' || selectedObject.type === 'highlighter') && (
            <div className="space-y-2.5">
              {/* Stroke Color & Width */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Stroke & Width
                </label>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded border border-slate-300 shadow-2xs flex-shrink-0"
                    style={{ backgroundColor: currentStroke }}
                  />
                  <input
                    type="text"
                    value={currentStroke.toUpperCase()}
                    onChange={(e) => {
                      const hex = e.target.value;
                      updateObjectProperties(selectedObject.id, { strokeColor: hex });
                    }}
                    className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-800 focus:bg-white focus:border-[#F26B5B] outline-none"
                  />
                  <select
                    value={`${currentWidth}px`}
                    onChange={(e) => {
                      const w = parseInt(e.target.value, 10);
                      updateObjectProperties(selectedObject.id, { strokeWidth: w });
                    }}
                    className="w-16 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="1px">1px</option>
                    <option value="2px">2px</option>
                    <option value="4px">4px</option>
                    <option value="8px">8px</option>
                    <option value="12px">12px</option>
                  </select>
                </div>
              </div>

              {/* Opacity */}
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Opacity
                </label>
                <select
                  value={`${currentOpacity}%`}
                  onChange={(e) => {
                    const op = parseInt(e.target.value, 10) / 100;
                    updateObjectProperties(selectedObject.id, { opacity: op });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 outline-none cursor-pointer"
                >
                  <option value="100%">100%</option>
                  <option value="75%">75%</option>
                  <option value="50%">50%</option>
                  <option value="25%">25%</option>
                </select>
              </div>
            </div>
          )}

          {/* D. SHAPES INSPECTOR */}
          {selectedObject.type !== 'sticky' &&
            selectedObject.type !== 'text' &&
            selectedObject.type !== 'brush' &&
            selectedObject.type !== 'highlighter' &&
            selectedObject.type !== 'table' &&
            selectedObject.type !== 'image' &&
            selectedObject.type !== 'graph' && (
              <div className="space-y-2.5">
                {/* Fill Control (if not line/arrow) */}
                {selectedObject.type !== 'line' &&
                  selectedObject.type !== 'arrow' &&
                  selectedObject.type !== 'wavy' &&
                  selectedObject.type !== 'smooth' &&
                  selectedObject.type !== 'hinged' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      Fill & Opacity
                    </label>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded border border-slate-300 shadow-2xs flex-shrink-0"
                        style={{
                          backgroundColor:
                            currentFill === 'transparent' ? '#FFFFFF' : currentFill,
                        }}
                      />
                      <input
                        type="text"
                        value={currentFill.toUpperCase()}
                        onChange={(e) => {
                          const hex = e.target.value;
                          updateObjectProperties(selectedObject.id, { fillColor: hex });
                        }}
                        className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-800 focus:bg-white focus:border-[#F26B5B] outline-none"
                      />
                      <select
                        value={`${currentOpacity}%`}
                        onChange={(e) => {
                          const op = parseInt(e.target.value, 10) / 100;
                          updateObjectProperties(selectedObject.id, { opacity: op });
                        }}
                        className="w-16 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-700 outline-none cursor-pointer"
                      >
                        <option value="100%">100%</option>
                        <option value="75%">75%</option>
                        <option value="50%">50%</option>
                        <option value="25%">25%</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Stroke Control */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Stroke & Width
                  </label>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded border border-slate-300 shadow-2xs flex-shrink-0"
                      style={{ backgroundColor: currentStroke }}
                    />
                    <input
                      type="text"
                      value={currentStroke.toUpperCase()}
                      onChange={(e) => {
                        const hex = e.target.value;
                        updateObjectProperties(selectedObject.id, { strokeColor: hex });
                      }}
                      className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-800 focus:bg-white focus:border-[#F26B5B] outline-none"
                    />
                    <select
                      value={`${currentWidth}px`}
                      onChange={(e) => {
                        const w = parseInt(e.target.value, 10);
                        updateObjectProperties(selectedObject.id, { strokeWidth: w });
                      }}
                      className="w-16 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-700 outline-none cursor-pointer"
                    >
                      <option value="1px">1px</option>
                      <option value="2px">2px</option>
                      <option value="4px">4px</option>
                      <option value="8px">8px</option>
                    </select>
                  </div>
                </div>

                {/* Border Radius Control (for rect and rounded-rect) */}
                {(selectedObject.type === 'rectangle' || selectedObject.type === 'rounded-rectangle' || selectedObject.type === 'square' || selectedObject.type === 'roundedRect') && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Border Radius
                      </label>
                      <button
                        onClick={() => setIsRadiusLinked(!isRadiusLinked)}
                        className="p-0.5 text-[#302633]/40 hover:text-[#F26B5B] transition cursor-pointer"
                        title={isRadiusLinked ? 'Corners linked' : 'Corners unlinked'}
                      >
                        {isRadiusLinked ? (
                          <Link2 className="w-3.5 h-3.5 text-[#F26B5B]" />
                        ) : (
                          <Link2Off className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    <div className="relative grid grid-cols-2 gap-2 pt-0.5">
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded px-2 py-1">
                        <span className="text-[10px] text-slate-400 mr-1.5">TL</span>
                        <input
                          type="number"
                          min="0"
                          max="64"
                          value={radii[0]}
                          onChange={(e) => handleRadiusChange(0, parseInt(e.target.value, 10))}
                          className="w-full bg-transparent text-xs text-slate-800 outline-none font-mono"
                        />
                        <span className="text-[10px] text-slate-400">px</span>
                      </div>
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded px-2 py-1">
                        <span className="text-[10px] text-slate-400 mr-1.5">TR</span>
                        <input
                          type="number"
                          min="0"
                          max="64"
                          value={radii[1]}
                          onChange={(e) => handleRadiusChange(1, parseInt(e.target.value, 10))}
                          className="w-full bg-transparent text-xs text-slate-800 outline-none font-mono"
                        />
                        <span className="text-[10px] text-slate-400">px</span>
                      </div>
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded px-2 py-1">
                        <span className="text-[10px] text-slate-400 mr-1.5">BL</span>
                        <input
                          type="number"
                          min="0"
                          max="64"
                          value={radii[2]}
                          onChange={(e) => handleRadiusChange(2, parseInt(e.target.value, 10))}
                          className="w-full bg-transparent text-xs text-slate-800 outline-none font-mono"
                        />
                        <span className="text-[10px] text-slate-400">px</span>
                      </div>
                      <div className="flex items-center bg-slate-50 border border-slate-200 rounded px-2 py-1">
                        <span className="text-[10px] text-slate-400 mr-1.5">BR</span>
                        <input
                          type="number"
                          min="0"
                          max="64"
                          value={radii[3]}
                          onChange={(e) => handleRadiusChange(3, parseInt(e.target.value, 10))}
                          className="w-full bg-transparent text-xs text-slate-800 outline-none font-mono"
                        />
                        <span className="text-[10px] text-slate-400">px</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* E. TABLE INSPECTOR */}
          {selectedObject.type === 'table' && (
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Dimensions</span>
                <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-800 border border-indigo-200 font-medium text-[11px]">
                  {selectedObject.tableRows || 4} Rows × {selectedObject.tableCols || 3} Columns
                </span>
              </div>
              <div className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded border border-slate-200 leading-relaxed">
                Double-click any cell on the whiteboard canvas to edit its text.
              </div>
            </div>
          )}

          {/* F. IMAGE INSPECTOR */}
          {selectedObject.type === 'image' && (
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">File Name</span>
                <span className="truncate max-w-[140px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium text-[11px]">
                  {selectedObject.imageName || selectedObject.name || 'Image'}
                </span>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Opacity
                </label>
                <select
                  value={`${currentOpacity}%`}
                  onChange={(e) => {
                    const op = parseInt(e.target.value, 10) / 100;
                    updateObjectProperties(selectedObject.id, { opacity: op });
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs text-slate-700 outline-none cursor-pointer"
                >
                  <option value="100%">100%</option>
                  <option value="75%">75%</option>
                  <option value="50%">50%</option>
                  <option value="25%">25%</option>
                </select>
              </div>
            </div>
          )}

          {/* G. GRAPH / CHART INSPECTOR */}
          {selectedObject.type === 'graph' && (
            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-semibold uppercase text-[10px]">Chart Type</span>
                <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-medium text-[11px] capitalize">
                  {selectedObject.graphType || 'Bar'}
                </span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="border-t border-slate-200 bg-slate-50/70 p-4 text-center">
          <p className="text-xs font-semibold text-slate-500">No Object Selected</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Click any canvas element or layer to inspect and edit properties.
          </p>
        </div>
      )}
    </aside>
  );
};
