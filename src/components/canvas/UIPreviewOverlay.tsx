import React, { useState, useRef } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { CanvasObject, ToolType } from '../../types/whiteboard';
import { AlertTriangle, Edit3 } from 'lucide-react';

export const UIPreviewOverlay: React.FC = () => {
  const {
    isUIPreviewMode,
    mockObjects,
    selectedMockObjectId,
    setSelectedMockObjectId,
    simulationSettings,
    activeTool,
    createMockObject,
    updateObjectText,
    editingObjectId,
    setEditingObjectId,
    styleConfig,
    zoom,
    pan,
    setPan,
    updateObjectPosition,
    updateObjectBounds,
    setPointerCoords,
  } = useWorkspace();

  const [tempText, setTempText] = useState('');
  const [currentStroke, setCurrentStroke] = useState<{
    tool: 'brush' | 'highlighter';
    points: { x: number; y: number }[];
  } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  if (!isUIPreviewMode) return null;

  // Coordinate helper: translates client mouse coordinates to canvas coordinates (accounting for pan & zoom)
  const getCanvasCoords = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { x: clientX, y: clientY };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: Math.round((clientX - rect.left - pan.x) / zoom),
      y: Math.round((clientY - rect.top - pan.y) / zoom),
    };
  };

  // Convert points array to SVG path data string
  const pointsToSvgPath = (pts: { x: number; y: number }[]) => {
    if (!pts || pts.length === 0) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  };

  // Handle canvas pointer down:
  // - If Pan tool: start viewport panning
  // - If Brush or Highlighter: start collecting freehand stroke points
  // - If Shape/Text/Sticky: click to place
  // - If Select tool: click on background clears selection
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only trigger if clicking on the background container itself
    if (e.target !== e.currentTarget && !(e.target as HTMLElement).classList.contains('canvas-background')) {
      return;
    }

    // 1. Pan tool
    if (activeTool === 'pan') {
      const startClientX = e.clientX;
      const startClientY = e.clientY;
      const initialPan = { ...pan };

      const onPointerMove = (ev: PointerEvent) => {
        setPan({
          x: initialPan.x + (ev.clientX - startClientX),
          y: initialPan.y + (ev.clientY - startClientY),
        });
      };

      const onPointerUp = () => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      return;
    }

    // 2. Freehand Brush or Highlighter
    if (activeTool === 'brush' || activeTool === 'highlighter') {
      const startPoint = getCanvasCoords(e.clientX, e.clientY);
      const points = [startPoint];
      setCurrentStroke({ tool: activeTool, points });

      const onStrokeMove = (ev: PointerEvent) => {
        const nextPt = getCanvasCoords(ev.clientX, ev.clientY);
        const lastPt = points[points.length - 1];
        if (Math.hypot(nextPt.x - lastPt.x, nextPt.y - lastPt.y) >= 2) {
          points.push(nextPt);
          setCurrentStroke({ tool: activeTool, points: [...points] });
        }
      };

      const onStrokeUp = () => {
        window.removeEventListener('pointermove', onStrokeMove);
        window.removeEventListener('pointerup', onStrokeUp);
        setCurrentStroke(null);

        if (points.length >= 2) {
          const xs = points.map((p) => p.x);
          const ys = points.map((p) => p.y);
          const minX = Math.min(...xs);
          const minY = Math.min(...ys);
          const maxX = Math.max(...xs);
          const maxY = Math.max(...ys);
          const strokeWidthVal =
            activeTool === 'highlighter' ? 16 : (styleConfig.brushSize || styleConfig.strokeWidth || 3);

          const relativePoints = points.map((p) => ({
            x: p.x - minX,
            y: p.y - minY,
          }));

          createMockObject(
            activeTool,
            { x: minX, y: minY },
            {
              width: Math.max(30, maxX - minX + strokeWidthVal * 2),
              height: Math.max(20, maxY - minY + strokeWidthVal * 2),
              points: relativePoints,
              strokeColor:
                activeTool === 'highlighter' ? '#fef08a' : styleConfig.strokeColor || '#F26B5B',
              strokeWidth: strokeWidthVal,
              opacity: activeTool === 'highlighter' ? 0.45 : 1,
            }
          );
        }
      };

      window.addEventListener('pointermove', onStrokeMove);
      window.addEventListener('pointerup', onStrokeUp);
      return;
    }

    // 3. Shape or Content tool: click to create object
    const shapeTools: ToolType[] = [
      'rectangle',
      'rounded-rectangle',
      'circle',
      'ellipse',
      'diamond',
      'triangle',
      'line',
      'arrow',
      'sticky',
      'text',
    ];

    if (shapeTools.includes(activeTool)) {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      createMockObject(activeTool, {
        x: Math.max(20, coords.x - 70),
        y: Math.max(20, coords.y - 50),
      });
      return;
    }

    // 4. Default / Select tool: clear selection
    setSelectedMockObjectId(null);
    setEditingObjectId(null);
  };

  // Object drag-and-drop movement
  const handleObjectPointerDown = (e: React.PointerEvent, obj: CanvasObject) => {
    const target = e.target as HTMLElement;
    // Don't drag if clicking an active input, textarea, or button
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'BUTTON' ||
      target.closest('button')
    ) {
      return;
    }

    e.stopPropagation();
    setSelectedMockObjectId(obj.id);

    // If Pan or drawing tool is active, don't drag objects
    if (activeTool !== 'select' && activeTool !== 'pan') return;
    if (activeTool === 'pan') return;

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const initialX = obj.x;
    const initialY = obj.y;
    let hasMoved = false;

    const onPointerMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startClientX) / zoom;
      const dy = (ev.clientY - startClientY) / zoom;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        hasMoved = true;
      }
      updateObjectPosition(obj.id, Math.round(initialX + dx), Math.round(initialY + dy), false);
    };

    const onPointerUp = (ev: PointerEvent) => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      if (hasMoved) {
        const dx = (ev.clientX - startClientX) / zoom;
        const dy = (ev.clientY - startClientY) / zoom;
        updateObjectPosition(obj.id, Math.round(initialX + dx), Math.round(initialY + dy), true);
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const startEditing = (obj: CanvasObject) => {
    setSelectedMockObjectId(obj.id);
    setEditingObjectId(obj.id);
    setTempText(obj.text || '');
  };

  const commitEditing = (id: string) => {
    updateObjectText(id, tempText);
    setEditingObjectId(null);
  };

  // Interactive object resize handling supporting 8 cardinal & ordinal directions
  const handleResizePointerDown = (
    e: React.PointerEvent,
    obj: CanvasObject,
    handle: 'nw' | 'ne' | 'se' | 'sw' | 'n' | 's' | 'w' | 'e'
  ) => {
    e.stopPropagation();
    e.preventDefault();

    const startClientX = e.clientX;
    const startClientY = e.clientY;
    const initialX = obj.x;
    const initialY = obj.y;
    const initialWidth = obj.width || 100;
    const initialHeight = obj.height || 100;
    const isAspectLocked = obj.type === 'circle';
    const initialPoints = obj.points ? obj.points.map((p) => ({ ...p })) : null;

    const minWidth = obj.type === 'sticky' ? 140 : obj.type === 'text' ? 60 : 30;
    const minHeight = obj.type === 'sticky' ? 120 : obj.type === 'text' ? 24 : 20;

    let hasResized = false;
    let latestBounds: Partial<CanvasObject> = {
      x: initialX,
      y: initialY,
      width: initialWidth,
      height: initialHeight,
      ...(initialPoints && { points: initialPoints }),
    };

    const onPointerMove = (ev: PointerEvent) => {
      const dx = (ev.clientX - startClientX) / zoom;
      const dy = (ev.clientY - startClientY) / zoom;

      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        hasResized = true;
      }

      let newX = initialX;
      let newY = initialY;
      let newWidth = initialWidth;
      let newHeight = initialHeight;

      // Horizontal Resize
      if (handle.includes('e')) {
        newWidth = Math.max(minWidth, initialWidth + dx);
      } else if (handle.includes('w')) {
        const potentialWidth = initialWidth - dx;
        if (potentialWidth >= minWidth) {
          newWidth = potentialWidth;
          newX = initialX + dx;
        } else {
          newWidth = minWidth;
          newX = initialX + (initialWidth - minWidth);
        }
      }

      // Vertical Resize
      if (handle.includes('s')) {
        newHeight = Math.max(minHeight, initialHeight + dy);
      } else if (handle.includes('n')) {
        const potentialHeight = initialHeight - dy;
        if (potentialHeight >= minHeight) {
          newHeight = potentialHeight;
          newY = initialY + dy;
        } else {
          newHeight = minHeight;
          newY = initialY + (initialHeight - minHeight);
        }
      }

      // 1:1 Aspect Ratio Lock for Circles
      if (isAspectLocked) {
        const side = Math.max(minWidth, Math.max(newWidth, newHeight));
        newWidth = side;
        newHeight = side;
      }

      newX = Math.round(newX);
      newY = Math.round(newY);
      newWidth = Math.round(newWidth);
      newHeight = Math.round(newHeight);

      // Proportionally scale freehand path points if present
      let newPoints = undefined;
      if (initialPoints && initialPoints.length > 0 && initialWidth > 0 && initialHeight > 0) {
        const scaleX = newWidth / initialWidth;
        const scaleY = newHeight / initialHeight;
        newPoints = initialPoints.map((p) => ({
          x: Math.round(p.x * scaleX),
          y: Math.round(p.y * scaleY),
        }));
      }

      latestBounds = {
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
        ...(newPoints && { points: newPoints }),
      };

      updateObjectBounds(obj.id, latestBounds, false);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      if (hasResized) {
        updateObjectBounds(obj.id, latestBounds, true);
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Tactile selection bounding handles with interactive 8-directional resizing
  const renderSelectionHandles = (obj: CanvasObject) => (
    <>
      {/* 4 Corner Resize Handles */}
      <span
        onPointerDown={(e) => handleResizePointerDown(e, obj, 'nw')}
        className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#F26B5B] rounded-xs cursor-nwse-resize pointer-events-auto z-30 shadow-xs hover:scale-125 transition-transform"
        title="Resize top-left"
      />
      <span
        onPointerDown={(e) => handleResizePointerDown(e, obj, 'ne')}
        className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#F26B5B] rounded-xs cursor-nesw-resize pointer-events-auto z-30 shadow-xs hover:scale-125 transition-transform"
        title="Resize top-right"
      />
      <span
        onPointerDown={(e) => handleResizePointerDown(e, obj, 'sw')}
        className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border-2 border-[#F26B5B] rounded-xs cursor-nesw-resize pointer-events-auto z-30 shadow-xs hover:scale-125 transition-transform"
        title="Resize bottom-left"
      />
      <span
        onPointerDown={(e) => handleResizePointerDown(e, obj, 'se')}
        className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border-2 border-[#F26B5B] rounded-xs cursor-nwse-resize pointer-events-auto z-30 shadow-xs hover:scale-125 transition-transform"
        title="Resize bottom-right"
      />

      {/* 4 Edge Resize Handles */}
      <span
        onPointerDown={(e) => handleResizePointerDown(e, obj, 'n')}
        className="absolute -top-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-white border-2 border-[#F26B5B] rounded-xs cursor-ns-resize pointer-events-auto z-30 shadow-xs hover:scale-125 transition-transform"
        title="Resize top"
      />
      <span
        onPointerDown={(e) => handleResizePointerDown(e, obj, 's')}
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-2 bg-white border-2 border-[#F26B5B] rounded-xs cursor-ns-resize pointer-events-auto z-30 shadow-xs hover:scale-125 transition-transform"
        title="Resize bottom"
      />
      <span
        onPointerDown={(e) => handleResizePointerDown(e, obj, 'w')}
        className="absolute top-1/2 -translate-y-1/2 -left-1 w-2 h-4 bg-white border-2 border-[#F26B5B] rounded-xs cursor-ew-resize pointer-events-auto z-30 shadow-xs hover:scale-125 transition-transform"
        title="Resize left"
      />
      <span
        onPointerDown={(e) => handleResizePointerDown(e, obj, 'e')}
        className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-4 bg-white border-2 border-[#F26B5B] rounded-xs cursor-ew-resize pointer-events-auto z-30 shadow-xs hover:scale-125 transition-transform"
        title="Resize right"
      />
    </>
  );

  const getBorderRadiusStyle = (br?: number | [number, number, number, number], defaultVal = '8px') => {
    if (br === undefined) return defaultVal;
    if (typeof br === 'number') return `${br}px`;
    return `${br[0]}px ${br[1]}px ${br[2]}px ${br[3]}px`;
  };

  const renderMockObject = (obj: CanvasObject) => {
    if (obj.visible === false) return null;
    const isSelected = selectedMockObjectId === obj.id;
    const isEditing = editingObjectId === obj.id;

    // 1. STICKY NOTE
    if (obj.type === 'sticky') {
      return (
        <div
          key={obj.id}
          onPointerDown={(e) => handleObjectPointerDown(e, obj)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            startEditing(obj);
          }}
          style={{
            transform: `translate(${obj.x}px, ${obj.y}px)`,
            width: obj.width || 200,
            height: obj.height || 180,
            backgroundColor: obj.fillColor || obj.stickyColor || '#fef08a',
            borderWidth: `${obj.strokeWidth || 1}px`,
            borderColor: obj.strokeColor || '#ca8a04',
          }}
          className={`absolute rounded-xl p-3 shadow-[0_2px_10px_rgba(0,0,0,0.06)] cursor-move pointer-events-auto select-none flex flex-col justify-between transition-shadow ${
            isSelected ? 'ring-2 ring-[#F26B5B] ring-offset-2 ring-offset-[#FAF8F5]' : 'hover:shadow-md'
          }`}
        >
          {isSelected && renderSelectionHandles(obj)}

          <div className="flex items-center justify-between pb-1 border-b border-black/10 text-[11px] font-serif font-semibold tracking-wide text-slate-800">
            <span>Sticky Note</span>
            {!isEditing && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  startEditing(obj);
                }}
                className="p-0.5 hover:bg-black/10 rounded text-slate-600 transition"
                title="Double-click or click to edit note"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex-1 mt-1.5 flex flex-col justify-start overflow-hidden">
            {isEditing ? (
              <textarea
                value={tempText}
                onChange={(e) => setTempText(e.target.value)}
                onBlur={() => commitEditing(obj.id)}
                onKeyDown={(e) => {
                  e.stopPropagation();
                  if (e.key === 'Escape') setEditingObjectId(null);
                  else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) commitEditing(obj.id);
                }}
                autoFocus
                style={{
                  fontSize: `${obj.fontSize || 13}px`,
                  fontWeight: obj.fontWeight || 'normal',
                  textAlign: obj.textAlign || 'left',
                }}
                className="w-full h-full bg-black/5 text-slate-800 font-sans p-1.5 rounded outline-none resize-none"
                placeholder="Write your note..."
              />
            ) : (
              <div
                style={{
                  fontSize: `${obj.fontSize || 13}px`,
                  fontWeight: obj.fontWeight || 'normal',
                  textAlign: obj.textAlign || 'left',
                }}
                className="text-slate-800 font-sans whitespace-pre-wrap leading-relaxed overflow-y-auto"
              >
                {obj.text || <span className="opacity-40 italic">Empty sticky note...</span>}
              </div>
            )}
          </div>

          <div className="text-[9px] text-slate-500 text-right pt-1">
            {isEditing ? 'Ctrl+Enter or blur to save' : 'Double-click to edit'}
          </div>
        </div>
      );
    }

    // 2. RECTANGLE & ROUNDED RECTANGLE
    if (obj.type === 'rectangle' || obj.type === 'rounded-rectangle') {
      const defaultRadius = obj.type === 'rounded-rectangle' ? '16px' : '8px';
      const borderRadius = getBorderRadiusStyle(obj.borderRadius, defaultRadius);
      return (
        <div
          key={obj.id}
          onPointerDown={(e) => handleObjectPointerDown(e, obj)}
          style={{
            transform: `translate(${obj.x}px, ${obj.y}px)`,
            width: obj.width || 220,
            height: obj.height || 150,
            backgroundColor: obj.fillColor || '#ede9fe',
            borderWidth: `${obj.strokeWidth || 2}px`,
            borderColor: obj.strokeColor || '#8b5cf6',
            borderRadius,
            opacity: obj.opacity !== undefined ? obj.opacity : 1,
          }}
          className={`absolute flex flex-col items-center justify-center cursor-move pointer-events-auto select-none shadow-sm ${
            isSelected ? 'ring-2 ring-[#F26B5B] ring-offset-2 ring-offset-[#FAF8F5]' : 'hover:shadow-md'
          }`}
        >
          {isSelected && renderSelectionHandles(obj)}
          {obj.text && (
            <span
              style={{
                fontSize: `${obj.fontSize || 14}px`,
                fontWeight: obj.fontWeight || 'bold',
                textAlign: obj.textAlign || 'center',
              }}
              className="text-slate-800 px-3 font-semibold pointer-events-none"
            >
              {obj.text}
            </span>
          )}
        </div>
      );
    }

    // 3. CIRCLE
    if (obj.type === 'circle') {
      const size = obj.width || 140;
      return (
        <div
          key={obj.id}
          onPointerDown={(e) => handleObjectPointerDown(e, obj)}
          style={{
            transform: `translate(${obj.x}px, ${obj.y}px)`,
            width: size,
            height: size,
            backgroundColor: obj.fillColor || '#eef2ff',
            borderWidth: `${obj.strokeWidth || 2}px`,
            borderColor: obj.strokeColor || '#F26B5B',
            opacity: obj.opacity !== undefined ? obj.opacity : 1,
          }}
          className={`absolute rounded-full flex items-center justify-center cursor-move pointer-events-auto select-none shadow-sm ${
            isSelected ? 'ring-2 ring-[#F26B5B] ring-offset-2 ring-offset-[#FAF8F5]' : 'hover:shadow-md'
          }`}
        >
          {isSelected && renderSelectionHandles(obj)}
          {obj.text && (
            <span
              style={{
                fontSize: `${obj.fontSize || 14}px`,
                fontWeight: obj.fontWeight || 'bold',
                textAlign: 'center',
              }}
              className="text-slate-800 px-2 font-semibold pointer-events-none"
            >
              {obj.text}
            </span>
          )}
        </div>
      );
    }

    // 4. ELLIPSE
    if (obj.type === 'ellipse') {
      const w = obj.width || 180;
      const h = obj.height || 110;
      return (
        <div
          key={obj.id}
          onPointerDown={(e) => handleObjectPointerDown(e, obj)}
          style={{
            transform: `translate(${obj.x}px, ${obj.y}px)`,
            width: w,
            height: h,
            opacity: obj.opacity !== undefined ? obj.opacity : 1,
          }}
          className={`absolute flex items-center justify-center cursor-move pointer-events-auto select-none ${
            isSelected ? 'ring-2 ring-[#F26B5B] ring-offset-2 ring-offset-[#FAF8F5] rounded-full' : ''
          }`}
        >
          {isSelected && renderSelectionHandles(obj)}
          <svg viewBox="0 0 100 60" className="w-full h-full drop-shadow-xs">
            <ellipse
              cx="50"
              cy="30"
              rx="46"
              ry="26"
              fill={obj.fillColor || '#eef2ff'}
              stroke={obj.strokeColor || '#F26B5B'}
              strokeWidth={obj.strokeWidth || 2}
            />
          </svg>
          {obj.text && (
            <span className="absolute inset-0 flex items-center justify-center text-slate-800 font-semibold text-xs pointer-events-none">
              {obj.text}
            </span>
          )}
        </div>
      );
    }

    // 5. DIAMOND
    if (obj.type === 'diamond') {
      const size = obj.width || 120;
      return (
        <div
          key={obj.id}
          onPointerDown={(e) => handleObjectPointerDown(e, obj)}
          style={{
            transform: `translate(${obj.x}px, ${obj.y}px)`,
            width: size,
            height: size,
            opacity: obj.opacity !== undefined ? obj.opacity : 1,
          }}
          className={`absolute flex items-center justify-center cursor-move pointer-events-auto select-none ${
            isSelected ? 'ring-2 ring-[#F26B5B] ring-offset-2 ring-offset-[#FAF8F5] rounded-lg' : ''
          }`}
        >
          {isSelected && renderSelectionHandles(obj)}
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
            <polygon
              points="50,4 96,50 50,96 4,50"
              fill={obj.fillColor || '#ede9fe'}
              stroke={obj.strokeColor || '#8b5cf6'}
              strokeWidth={obj.strokeWidth || 2}
            />
          </svg>
          {obj.text && (
            <span className="absolute inset-0 flex items-center justify-center text-slate-800 font-semibold text-xs pointer-events-none">
              {obj.text}
            </span>
          )}
        </div>
      );
    }

    // 6. TRIANGLE
    if (obj.type === 'triangle') {
      const w = obj.width || 140;
      const h = obj.height || 120;
      return (
        <div
          key={obj.id}
          onPointerDown={(e) => handleObjectPointerDown(e, obj)}
          style={{
            transform: `translate(${obj.x}px, ${obj.y}px)`,
            width: w,
            height: h,
            opacity: obj.opacity !== undefined ? obj.opacity : 1,
          }}
          className={`absolute flex items-center justify-center cursor-move pointer-events-auto select-none ${
            isSelected ? 'ring-2 ring-[#F26B5B] ring-offset-2 ring-offset-[#FAF8F5] rounded-lg' : ''
          }`}
        >
          {isSelected && renderSelectionHandles(obj)}
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs">
            <polygon
              points="50,6 94,94 6,94"
              fill={obj.fillColor || '#ede9fe'}
              stroke={obj.strokeColor || '#8b5cf6'}
              strokeWidth={obj.strokeWidth || 2}
            />
          </svg>
          {obj.text && (
            <span className="absolute inset-0 flex items-center justify-center text-slate-800 font-semibold text-xs pt-4 pointer-events-none">
              {obj.text}
            </span>
          )}
        </div>
      );
    }

    // 7. LINE
    if (obj.type === 'line') {
      const w = obj.width || 180;
      return (
        <div
          key={obj.id}
          onPointerDown={(e) => handleObjectPointerDown(e, obj)}
          style={{
            transform: `translate(${obj.x}px, ${obj.y}px)`,
            width: w,
            height: Math.max(16, (obj.strokeWidth || 2) + 12),
          }}
          className={`absolute flex items-center cursor-move pointer-events-auto select-none ${
            isSelected ? 'ring-2 ring-[#F26B5B] rounded px-1' : ''
          }`}
        >
          {isSelected && renderSelectionHandles(obj)}
          <div
            style={{
              height: `${obj.strokeWidth || 2}px`,
              backgroundColor: obj.strokeColor || '#64748b',
            }}
            className="w-full rounded-full"
          />
        </div>
      );
    }

    // 8. ARROW
    if (obj.type === 'arrow') {
      const width = obj.width || 180;
      const strokeW = obj.strokeWidth || 2;
      const color = obj.strokeColor || '#F26B5B';

      return (
        <div
          key={obj.id}
          onPointerDown={(e) => handleObjectPointerDown(e, obj)}
          style={{
            transform: `translate(${obj.x}px, ${obj.y}px)`,
            width: width,
            height: 32,
          }}
          className={`absolute flex items-center cursor-move pointer-events-auto select-none ${
            isSelected ? 'ring-2 ring-[#F26B5B] rounded-sm px-1' : ''
          }`}
        >
          {isSelected && renderSelectionHandles(obj)}
          <svg className="w-full h-8 overflow-visible">
            <defs>
              <marker
                id={`arrowhead-${obj.id}`}
                markerWidth="8"
                markerHeight="8"
                refX="6"
                refY="4"
                orient="auto"
              >
                <polygon points="0 1, 8 4, 0 7" fill={color} />
              </marker>
            </defs>
            <line
              x1="4"
              y1="16"
              x2={width - 12}
              y2="16"
              stroke={color}
              strokeWidth={strokeW}
              strokeLinecap="round"
              markerEnd={`url(#arrowhead-${obj.id})`}
            />
          </svg>
        </div>
      );
    }

    // 9. TEXT BOX
    if (obj.type === 'text') {
      return (
        <div
          key={obj.id}
          onPointerDown={(e) => handleObjectPointerDown(e, obj)}
          onDoubleClick={(e) => {
            e.stopPropagation();
            startEditing(obj);
          }}
          style={{
            transform: `translate(${obj.x}px, ${obj.y}px)`,
            width: obj.width || 280,
            color: obj.strokeColor || '#1e293b',
          }}
          className={`absolute p-1.5 cursor-move pointer-events-auto rounded-lg select-none transition ${
            isSelected ? 'bg-white/80 ring-2 ring-[#F26B5B] shadow-sm' : 'hover:bg-slate-200/40'
          }`}
        >
          {isSelected && !isEditing && renderSelectionHandles(obj)}

          {isEditing ? (
            <input
              type="text"
              value={tempText}
              onChange={(e) => setTempText(e.target.value)}
              onBlur={() => commitEditing(obj.id)}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === 'Enter') commitEditing(obj.id);
                else if (e.key === 'Escape') setEditingObjectId(null);
              }}
              autoFocus
              style={{
                fontSize: `${obj.fontSize || 16}px`,
                fontWeight: obj.fontWeight || 'normal',
                textAlign: obj.textAlign || 'left',
              }}
              className="w-full bg-white border border-indigo-500 rounded px-2 py-1 text-slate-800 outline-none shadow-xs"
            />
          ) : (
            <div>
              <p
                style={{
                  fontSize: `${obj.fontSize || 16}px`,
                  fontWeight: obj.fontWeight || 'normal',
                  textAlign: obj.textAlign || 'left',
                }}
                className="tracking-tight text-slate-800"
              >
                {obj.text || <span className="opacity-40 italic">Empty text label...</span>}
              </p>
            </div>
          )}
        </div>
      );
    }

    // 10. FREEHAND BRUSH STROKE
    if (obj.type === 'brush') {
      const color = obj.strokeColor || '#F26B5B';
      const strokeW = obj.strokeWidth || 3;
      const pts = obj.points || [];

      return (
        <div
          key={obj.id}
          onPointerDown={(e) => handleObjectPointerDown(e, obj)}
          style={{
            transform: `translate(${obj.x}px, ${obj.y}px)`,
            width: obj.width || 120,
            height: obj.height || 60,
          }}
          className={`absolute cursor-move pointer-events-auto select-none ${
            isSelected ? 'ring-2 ring-[#F26B5B] rounded-lg p-1' : ''
          }`}
        >
          {isSelected && renderSelectionHandles(obj)}
          <svg className="w-full h-full overflow-visible">
            <path
              d={pointsToSvgPath(pts)}
              fill="none"
              stroke={color}
              strokeWidth={strokeW}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      );
    }

    // 11. FREEHAND HIGHLIGHTER STROKE
    if (obj.type === 'highlighter') {
      const color = obj.strokeColor || '#fef08a';
      const strokeW = obj.strokeWidth || 16;
      const pts = obj.points || [];

      return (
        <div
          key={obj.id}
          onPointerDown={(e) => handleObjectPointerDown(e, obj)}
          style={{
            transform: `translate(${obj.x}px, ${obj.y}px)`,
            width: obj.width || 160,
            height: obj.height || 36,
          }}
          className={`absolute cursor-move pointer-events-auto select-none ${
            isSelected ? 'ring-2 ring-[#F26B5B] rounded-lg p-1' : ''
          }`}
        >
          {isSelected && renderSelectionHandles(obj)}
          <svg className="w-full h-full overflow-visible">
            <path
              d={pointsToSvgPath(pts)}
              fill="none"
              stroke={color}
              strokeWidth={strokeW}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity={obj.opacity || 0.45}
            />
          </svg>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={(e) => {
        const coords = getCanvasCoords(e.clientX, e.clientY);
        setPointerCoords(coords);
      }}
      className={`absolute inset-0 pointer-events-auto z-10 canvas-background ${
        activeTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
      }`}
    >
      {/* Simulated Error Banner */}
      {simulationSettings.isErrorState && (
        <div className="fixed top-[86px] left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 pointer-events-auto shadow-md z-30">
          <AlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0" />
          <span>
            [Simulated Error State]: Unable to reach sync endpoint. Local edits will queue for reconnection.
          </span>
        </div>
      )}

      {/* Main Canvas Objects Layer with Viewport Pan & Zoom Transform */}
      {!simulationSettings.isEmptyBoard && (
        <div
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '0 0',
          }}
          className="relative w-full h-full pointer-events-none"
        >
          {/* Render all persistent mock objects */}
          {mockObjects.map(renderMockObject)}

          {/* Active in-progress freehand stroke preview */}
          {currentStroke && (
            <svg className="absolute inset-0 w-full h-full overflow-visible pointer-events-none">
              <path
                d={pointsToSvgPath(currentStroke.points)}
                fill="none"
                stroke={
                  currentStroke.tool === 'highlighter'
                    ? '#fef08a'
                    : styleConfig.strokeColor || '#F26B5B'
                }
                strokeWidth={
                  currentStroke.tool === 'highlighter'
                    ? 16
                    : styleConfig.brushSize || styleConfig.strokeWidth || 3
                }
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={currentStroke.tool === 'highlighter' ? 0.45 : 1}
              />
            </svg>
          )}
        </div>
      )}
    </div>
  );
};
