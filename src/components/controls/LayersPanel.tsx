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
} from 'lucide-react';

export const LayersPanel: React.FC = () => {
  const {
    isLayersPanelOpen,
    toggleLayersPanel,
    mockObjects,
    selectedMockObjectId,
    setSelectedMockObjectId,
    styleConfig,
    updateStyle,
    updateObjectProperties,
    toggleObjectVisibility,
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

  const selectedObject = selectedMockObjectId
    ? mockObjects.find((o) => o.id === selectedMockObjectId)
    : mockObjects.find((o) => o.type === 'rectangle') || null;

  // Categories partition
  const stickyNotes = mockObjects.filter((o) => o.type === 'sticky');
  const shapes = mockObjects.filter(
    (o) =>
      o.type === 'rectangle' ||
      o.type === 'rounded-rectangle' ||
      o.type === 'circle' ||
      o.type === 'ellipse' ||
      o.type === 'diamond' ||
      o.type === 'triangle'
  );
  const textItems = mockObjects.filter((o) => o.type === 'text');
  const drawings = mockObjects.filter(
    (o) => o.type === 'brush' || o.type === 'highlighter'
  );
  const arrows = mockObjects.filter(
    (o) => o.type === 'arrow' || o.type === 'line'
  );

  const getShapeIcon = (type: string) => {
    switch (type) {
      case 'rounded-rectangle':
        return <Square className="w-3.5 h-3.5 text-purple-500 rounded-xs" />;
      case 'circle':
        return <Circle className="w-3.5 h-3.5 text-indigo-500" />;
      case 'ellipse':
        return <Circle className="w-3.5 h-3.5 text-indigo-500 scale-x-125" />;
      case 'diamond':
        return <Diamond className="w-3.5 h-3.5 text-purple-500" />;
      case 'triangle':
        return <Triangle className="w-3.5 h-3.5 text-purple-500" />;
      case 'rectangle':
      default:
        return <Square className="w-3.5 h-3.5 text-purple-500" />;
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
      updateObjectProperties(selectedObject.id, { borderRadius: nextRadii });
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
      className="fixed top-12 bottom-0 right-0 w-72 bg-white border-l border-slate-200 z-20 flex flex-col justify-between select-none shadow-xs"
      aria-label="Right sidebar for layers and properties"
    >
      {/* 1. TOP SECTION: TABS ("Layers" | "Properties") */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {/* Tab Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-3 pt-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('layers')}
              className={`pb-2 text-xs font-semibold tracking-tight transition border-b-2 ${
                activeTab === 'layers'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Layers
            </button>
            <button
              onClick={() => setActiveTab('properties')}
              className={`pb-2 text-xs font-semibold tracking-tight transition border-b-2 ${
                activeTab === 'properties'
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              Properties
            </button>
          </div>
          <button
            onClick={toggleLayersPanel}
            className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition -mt-2"
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
                            ? 'bg-indigo-50 text-indigo-700 font-medium'
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
                        <button
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
                  <Square className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Shapes ({shapes.length})</span>
                </div>
              </button>

              {!collapsedCategories['shapes'] && (
                <div className="pl-5 space-y-0.5">
                  {shapes.map((obj) => {
                    const isSelected = selectedMockObjectId === obj.id;
                    const isHidden = obj.visible === false;
                    const label =
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
                            ? 'bg-indigo-50 text-indigo-700 font-medium'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          {getShapeIcon(obj.type)}
                          <span className="truncate text-xs">{label}</span>
                        </div>
                        <button
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
                    );
                  })}
                </div>
              )}
            </div>

            {/* Category 3: Text (2) */}
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
                  {textItems.map((obj) => {
                    const isSelected = selectedMockObjectId === obj.id;
                    const isHidden = obj.visible === false;
                    return (
                      <div
                        key={obj.id}
                        onClick={() => setSelectedMockObjectId(obj.id)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-700 font-medium'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <Type className="w-3 h-3 text-slate-400" />
                          <span className="truncate text-xs">
                            {obj.text || 'Text Item'}
                          </span>
                        </div>
                        <button
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
                    );
                  })}
                </div>
              )}
            </div>

            {/* Category 4: Drawings (1) */}
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
                  <PenTool className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Drawings ({drawings.length})</span>
                </div>
              </button>

              {!collapsedCategories['drawings'] && (
                <div className="pl-5 space-y-0.5">
                  {drawings.map((obj, i) => {
                    const isSelected = selectedMockObjectId === obj.id;
                    const isHidden = obj.visible === false;
                    return (
                      <div
                        key={obj.id}
                        onClick={() => setSelectedMockObjectId(obj.id)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-700 font-medium'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <PenTool className="w-3 h-3 text-slate-400" />
                          <span className="truncate text-xs">
                            Vector Sketch {i + 1}
                          </span>
                        </div>
                        <button
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
                    );
                  })}
                </div>
              )}
            </div>

            {/* Category 5: Arrows (2) */}
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
                  <MoveRight className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Arrows ({arrows.length})</span>
                </div>
              </button>

              {!collapsedCategories['arrows'] && (
                <div className="pl-5 space-y-0.5">
                  {arrows.map((obj, i) => {
                    const isSelected = selectedMockObjectId === obj.id;
                    const isHidden = obj.visible === false;
                    const label =
                      i === 0 ? 'Frontend → API' : 'API → Database';
                    return (
                      <div
                        key={obj.id}
                        onClick={() => setSelectedMockObjectId(obj.id)}
                        className={`flex items-center justify-between px-2 py-1.5 rounded-md cursor-pointer transition ${
                          isSelected
                            ? 'bg-indigo-50 text-indigo-700 font-medium'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0 pr-1">
                          <MoveRight className="w-3 h-3 text-slate-400" />
                          <span className="truncate text-xs">{label}</span>
                        </div>
                        <button
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

      {/* 2. BOTTOM SECTION: "Selected: Rectangle" INSPECTOR */}
      <div className="border-t border-slate-200 bg-white p-3 space-y-3 shadow-xs">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Square className="w-3.5 h-3.5 text-indigo-600" />
            <span>
              Selected:{' '}
              {selectedObject
                ? selectedObject.type.charAt(0).toUpperCase() +
                  selectedObject.type.slice(1)
                : 'Rectangle'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-slate-400">
            {selectedObject ? selectedObject.id.slice(0, 11) : 'mock-rect-1'}
          </span>
        </div>

        {/* Fill Control */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Fill
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
                updateStyle({ fillColor: hex });
                if (selectedObject) {
                  updateObjectProperties(selectedObject.id, { fillColor: hex });
                }
              }}
              className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
            />
            <select
              value={`${currentOpacity}%`}
              onChange={(e) => {
                const op = parseInt(e.target.value, 10) / 100;
                updateStyle({ opacity: op });
                if (selectedObject) {
                  updateObjectProperties(selectedObject.id, { opacity: op });
                }
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

        {/* Stroke Control */}
        <div className="space-y-1">
          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Stroke
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
                updateStyle({ strokeColor: hex });
                if (selectedObject) {
                  updateObjectProperties(selectedObject.id, { strokeColor: hex });
                }
              }}
              className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded px-2 py-1 text-xs font-mono text-slate-800 focus:bg-white focus:border-indigo-500 outline-none"
            />
            <select
              value={`${currentWidth}px`}
              onChange={(e) => {
                const w = parseInt(e.target.value, 10);
                updateStyle({ strokeWidth: w });
                if (selectedObject) {
                  updateObjectProperties(selectedObject.id, { strokeWidth: w });
                }
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

        {/* Border Radius Control (2x2 Grid + Center Link Icon) */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Border Radius
            </label>
            <button
              onClick={() => setIsRadiusLinked(!isRadiusLinked)}
              className="p-0.5 text-slate-400 hover:text-indigo-600 transition"
              title={isRadiusLinked ? 'Corners linked' : 'Corners unlinked'}
            >
              {isRadiusLinked ? (
                <Link2 className="w-3.5 h-3.5 text-indigo-600" />
              ) : (
                <Link2Off className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          <div className="relative grid grid-cols-2 gap-2 pt-0.5">
            {/* Top-Left */}
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

            {/* Top-Right */}
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

            {/* Bottom-Left */}
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

            {/* Bottom-Right */}
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
      </div>
    </aside>
  );
};
