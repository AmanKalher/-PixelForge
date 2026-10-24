import {
  Canvas,
  PencilBrush,
  Point,
  Textbox,
  Rect,
  Circle,
  Triangle,
  Polygon,
  Line,
  Group,
  FabricObject,
  Path,
  util,
} from 'fabric';
import { CanvasEngineContract } from '../types/contracts';
import {
  ToolType,
  ShapeSubtype,
  StyleConfig,
  CanvasObject,
  BrushSettings,
  TextFormattingSettings,
  ExportOptions,
  ExportResult,
  UndoRedoCapabilities,
  EngineReadinessState,
} from '../types/whiteboard';
import {
  getWorldPointer,
  getZoomLevel,
  clampZoom,
} from './canvasCoordinates';
import { STICKY_TEMPLATES, createStickyNote } from './stickyNoteTemplates';

const EXTRA_PROPS = [
  'id',
  'name',
  'stickyNoteData',
  'stickyPart',
  'isPixelForgeText',
  'isPixelForgeStroke',
  'isPixelForgeShape',
  'isPixelForgeSticky',
  'pixelForgeObjectType',
  'brushKind',
  'brushColor',
  'brushWidth',
  'brushOpacity',
  'pressureEnabled',
];

// Configure polished control handles across all Fabric canvas objects
if (FabricObject?.ownDefaults) {
  FabricObject.ownDefaults.transparentCorners = false;
  FabricObject.ownDefaults.cornerColor = '#ffffff';
  FabricObject.ownDefaults.cornerStrokeColor = '#F26B5B';
  FabricObject.ownDefaults.cornerStyle = 'circle';
  FabricObject.ownDefaults.cornerSize = 10;
  FabricObject.ownDefaults.touchCornerSize = 24;
  FabricObject.ownDefaults.borderColor = '#F26B5B';
  FabricObject.ownDefaults.borderScaleFactor = 1.5;
}

function colorWithAlpha(color: string, alpha: number): string {
  const hex = String(color || '#FDE047').replace('#', '');
  const normalized =
    hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return `rgba(253, 224, 71, ${alpha})`;
  }
  const red = parseInt(normalized.slice(0, 2), 16);
  const green = parseInt(normalized.slice(2, 4), 16);
  const blue = parseInt(normalized.slice(4, 6), 16);
  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

/**
 * PressurePencilBrush extends Fabric's PencilBrush to support stylus pressure,
 * pencil dash styles, calligraphy square caps, and customized opacity for pen/highlighter.
 */
class PressurePencilBrush extends PencilBrush {
  public kind: string;
  public settings: {
    width: number;
    color: string;
    opacity: number;
    pressureEnabled: boolean;
  };

  constructor(
    canvas: Canvas,
    kind: string,
    settings: {
      width: number;
      color: string;
      opacity: number;
      pressureEnabled: boolean;
    }
  ) {
    super(canvas);
    this.kind = kind;
    this.settings = settings;
    this.color = settings.color;
    this.width = settings.width;
    this.strokeLineCap = kind === 'calligraphy' ? 'square' : 'round';
    this.strokeLineJoin = 'round';
    this.strokeDashArray = kind === 'pencil' ? [1, 1.8] : null;
  }

  private _pressureWidth(event: any): number {
    const s = this.settings;
    const p =
      event && typeof event.pressure === 'number' && event.pressure > 0
        ? event.pressure
        : 0.5;
    if (
      !s.pressureEnabled ||
      !event ||
      typeof event.pressure !== 'number' ||
      event.pressure <= 0
    ) {
      return s.width;
    }
    return Math.max(1, s.width * (0.35 + p * 1.3));
  }

  onMouseDown(pointer: any, event: any) {
    this.settings.width = this.settings.width || 4;
    this.width = this._pressureWidth(event?.e || event);
    this.color = this.settings.color;
    this.strokeLineCap = this.kind === 'calligraphy' ? 'square' : 'round';
    this.strokeDashArray = this.kind === 'pencil' ? [1, 1.8] : null;
    super.onMouseDown(pointer, event);
  }

  onMouseMove(pointer: any, event: any) {
    this.width = this._pressureWidth(event?.e || event);
    this.color = this.settings.color;
    super.onMouseMove(pointer, event);
  }

  _setBrushStyles(ctx: CanvasRenderingContext2D) {
    super._setBrushStyles(ctx);
    ctx.lineCap = this.kind === 'calligraphy' ? 'square' : 'round';
    ctx.lineJoin = 'round';
    if (this.kind === 'pencil') {
      ctx.setLineDash([1, 1.8]);
    } else {
      ctx.setLineDash([]);
    }
    if (this.kind === 'highlighter') {
      ctx.globalAlpha = 0.3;
    } else {
      ctx.globalAlpha = this.settings.opacity ?? 1;
    }
  }
}

/**
 * Helper to locate text children safely inside a sticky note group.
 */
export function getStickyTextChildren(group: any): { headerText?: any; bodyText?: any; allTexts: any[] } {
  if (!group || typeof group.getObjects !== 'function') return { allTexts: [] };
  const allTexts = group.getObjects().filter((child: any) =>
    child.type === 'textbox' || child.type === 'text' || typeof child.text === 'string' || child.isPixelForgeText
  );
  const headerText = allTexts.find((c: any) => c.stickyPart === 'header') || allTexts[0];
  const bodyText = allTexts.find((c: any) => c.stickyPart === 'body') || (allTexts.length > 1 ? allTexts[1] : undefined);
  return { headerText, bodyText, allTexts };
}

/**
 * FabricCanvasAdapter
 *
 * Production adapter connecting Member 2's Fabric.js infinite canvas engine
 * to the PixelForge frontend shell via CanvasEngineContract.
 */
export class FabricCanvasAdapter implements CanvasEngineContract {
  private canvas: Canvas | null = null;
  private readiness: EngineReadinessState = 'uninitialized';
  private currentTool: ToolType = 'select';
  private styleConfig: StyleConfig = {
    strokeColor: '#F26B5B',
    fillColor: '#FFF9F0',
    strokeWidth: 2,
    stickyColor: '#F7D774',
    opacity: 1,
    fontSize: 20,
    fontWeight: 'normal',
    textAlign: 'left',
    brushSize: 4,
  };
  private isGridSnap: boolean = true;

  // Active in-place text editor for sticky notes
  private activeStickyEditor: {
    tempBox: Textbox;
    parentGroup: any;
    targetChild: any;
    exitHandler: () => void;
  } | null = null;

  // Sticky template state
  private selectedStickyTemplate: string = 'sunny';

  // Brush Studio state
  private brushSettings: BrushSettings = {
    kind: 'pen',
    color: '#252525',
    width: 4,
    opacity: 1,
    pressureEnabled: true,
    highlighterColor: '#FDE047',
    eraserMode: 'sweep',
    eraserWidth: 22,
  };

  // Eraser state
  private isErasing: boolean = false;
  private lastEraserPoint: { x: number; y: number } | null = null;

  // History state
  private undoStack: string[] = [];
  private redoStack: string[] = [];
  private isRestoringHistory: boolean = false;
  private historyDebounceTimer: number | null = null;

  // Pan state
  private isPanning: boolean = false;
  private lastPanClientX: number = 0;
  private lastPanClientY: number = 0;
  private isSpacePressed: boolean = false;

  // Key event handlers for Spacebar pan & window resize
  private windowKeydownHandler: ((e: KeyboardEvent) => void) | null = null;
  private windowKeyupHandler: ((e: KeyboardEvent) => void) | null = null;
  private windowResizeHandler: (() => void) | null = null;

  // Listeners
  private readinessListeners: Set<(state: EngineReadinessState) => void> = new Set();
  private undoRedoListeners: Set<(caps: UndoRedoCapabilities) => void> = new Set();
  private zoomListeners: Set<(zoom: number) => void> = new Set();
  private coordinatesListeners: Set<(coords: { x: number; y: number }) => void> = new Set();
  private activeObjectListeners: Set<(obj: FabricObject | null) => void> = new Set();
  private objectsListeners: Set<(objects: CanvasObject[]) => void> = new Set();
  private selectionListeners: Set<(selectedId: string | null, selectedObject?: CanvasObject | null) => void> = new Set();
  private brushSettingsListeners: Set<(settings: BrushSettings) => void> = new Set();
  private textSettingsListeners: Set<(settings: TextFormattingSettings) => void> = new Set();
  private selectionBoundsListeners: Set<(bounds: { left: number; top: number; width: number; height: number } | null) => void> = new Set();

  // Text formatting state
  private textSettings: TextFormattingSettings = {
    fontFamily: 'Arial',
    fontSize: 24,
    fill: '#302633',
    bold: false,
    italic: false,
    underline: false,
    textAlign: 'left',
    backgroundColor: 'transparent',
    lineHeight: 1.2,
  };
  private lastSelectedObjectId: string | null = null;

  // Shape creation defaults (isolated from edits to existing selected shapes)
  private defaultShapeConfig = {
    strokeColor: '#F26B5B',
    fillColor: '#FFF9F0',
    strokeWidth: 2,
  };

  /**
   * Attach the active Fabric Canvas instance.
   */
  public async attachCanvas(canvas: Canvas) {
    this.canvas = canvas;
    this.readiness = 'ready';
    this.notifyReadiness();

    this.setupEventListeners();
    this.applyToolToCanvas(this.currentTool);

    // If we have existing history snapshots (e.g. from user work before StrictMode remount), restore
    if (this.undoStack.length > 0) {
      const lastState = this.undoStack[this.undoStack.length - 1];
      try {
        await canvas.loadFromJSON(JSON.parse(lastState));
        canvas.requestRenderAll();
        this.notifyObjects();
      } catch (e) {
        console.warn('[FabricCanvasAdapter] Failed to restore previous snapshot:', e);
      }
    } else {
      // First clean mount of empty canvas: record initial empty snapshot
      this.saveHistorySnapshot();
    }

    // Initial notify of zoom
    this.notifyZoom(getZoomLevel(canvas));
  }

  /**
   * Detach the canvas instance when unmounting.
   */
  public detachCanvas() {
    if (this.activeStickyEditor) {
      try {
        this.activeStickyEditor.exitHandler();
      } catch {
        // ignore
      }
      this.activeStickyEditor = null;
    }
    if (this.historyDebounceTimer) {
      window.clearTimeout(this.historyDebounceTimer);
      this.historyDebounceTimer = null;
    }
    if (this.windowKeydownHandler) {
      window.removeEventListener('keydown', this.windowKeydownHandler);
      this.windowKeydownHandler = null;
    }
    if (this.windowKeyupHandler) {
      window.removeEventListener('keyup', this.windowKeyupHandler);
      this.windowKeyupHandler = null;
    }
    if (this.windowResizeHandler) {
      window.removeEventListener('resize', this.windowResizeHandler);
      this.windowResizeHandler = null;
    }
    this.canvas = null;
    this.readiness = 'uninitialized';
    this.notifyReadiness();
  }

  public getCanvas(): Canvas | null {
    return this.canvas;
  }

  // =========================================================================
  // CanvasEngineContract Implementation
  // =========================================================================

  public setTool(tool: ToolType): void {
    this.currentTool = tool;
    if (this.canvas) {
      this.applyToolToCanvas(tool);
    }
  }

  public setStyle(style: Partial<StyleConfig>): void {
    this.styleConfig = { ...this.styleConfig, ...style };
    if (!this.canvas) return;

    // 1. Keep brush studio in sync if stroke color or brush size changed
    if (style.strokeColor) {
      this.brushSettings.color = style.strokeColor;
    }
    if (style.strokeWidth) {
      this.brushSettings.width = style.strokeWidth;
    }
    if (style.brushSize) {
      this.brushSettings.width = style.brushSize;
    }
    if (style.opacity !== undefined) {
      this.brushSettings.opacity = style.opacity;
    }

    const isDrawingTool =
      this.currentTool === 'brush' ||
      this.currentTool === 'highlighter' ||
      ['pen', 'marker', 'pencil', 'calligraphy'].includes(this.currentTool);

    if (isDrawingTool) {
      this.applyBrushSettings();
    }

    // 2. Resolve active object or fallback to last selected object
    let active = this.canvas.getActiveObject() as any;
    if (!active && this.lastSelectedObjectId) {
      active = this.canvas.getObjects().find((o: any) => (o as any).id === this.lastSelectedObjectId);
      if (active) {
        this.canvas.setActiveObject(active);
      }
    }

    if (!active) {
      // No active selection: update shape creation defaults
      if (style.strokeColor !== undefined) this.defaultShapeConfig.strokeColor = style.strokeColor;
      if (style.fillColor !== undefined) this.defaultShapeConfig.fillColor = style.fillColor;
      if (style.strokeWidth !== undefined) this.defaultShapeConfig.strokeWidth = Math.max(0, style.strokeWidth);
      return;
    }

    if (active) {
      if (active.type === 'activeselection' && typeof active.getObjects === 'function') {
        // Multi-selection: update each child object
        active.getObjects().forEach((child: any) => {
          if (child.isPixelForgeSticky || child.stickyNoteData) {
            const { allTexts } = getStickyTextChildren(child);
            const color = style.strokeColor || style.fillColor;
            if (color) allTexts.forEach((t) => { t.set('fill', color); t.dirty = true; });
            if (style.opacity !== undefined) child.set('opacity', style.opacity);
          } else if (child.type === 'textbox' || child.isPixelForgeText) {
            const color = style.fillColor || style.strokeColor;
            if (color && color !== 'transparent') child.set('fill', color);
            if (style.fontSize !== undefined) child.set('fontSize', style.fontSize);
            if (style.fontWeight !== undefined) child.set('fontWeight', style.fontWeight);
            if (style.textAlign !== undefined) child.set('textAlign', style.textAlign);
            if (style.opacity !== undefined) child.set('opacity', style.opacity);
            if (typeof child.initDimensions === 'function') child.initDimensions();
          } else {
            const updates: any = {};
            if (style.strokeColor !== undefined) {
              updates.stroke = (style.strokeColor === 'transparent' || style.strokeColor === 'none') ? 'transparent' : style.strokeColor;
            }
            if (style.fillColor !== undefined) {
              if (child.type === 'line') {
                updates.fill = 'transparent';
              } else {
                updates.fill = (style.fillColor === 'transparent' || !style.fillColor || style.fillColor === 'none') ? 'transparent' : style.fillColor;
              }
            }
            if (style.strokeWidth !== undefined) updates.strokeWidth = Math.max(0, style.strokeWidth);
            if (style.opacity !== undefined) updates.opacity = Math.max(0, Math.min(1, style.opacity));
            child.set(updates);
          }
          child.dirty = true;
          child.setCoords();
        });
        active.dirty = true;
      } else if (active.isPixelForgeSticky || active.stickyNoteData) {
        const { headerText, bodyText, allTexts } = getStickyTextChildren(active);
        const sub = (active as any)._activeSubTarget;

        if (style.strokeColor !== undefined || style.fillColor !== undefined) {
          const color = style.strokeColor || style.fillColor;
          if (color) {
            if (sub) {
              sub.set('fill', color);
              if (active.stickyNoteData) {
                if (sub.stickyPart === 'header') active.stickyNoteData.headerColor = color;
                else active.stickyNoteData.bodyColor = color;
              }
            } else {
              allTexts.forEach((t) => t.set('fill', color));
              if (active.stickyNoteData) {
                active.stickyNoteData.headerColor = color;
                active.stickyNoteData.bodyColor = color;
              }
            }
          }
        }
        if (style.fontSize !== undefined) {
          if (sub) {
            sub.set('fontSize', style.fontSize);
            if (active.stickyNoteData) {
              if (sub.stickyPart === 'header') active.stickyNoteData.headerSize = style.fontSize;
              else active.stickyNoteData.bodySize = style.fontSize;
            }
          } else {
            if (headerText) headerText.set('fontSize', style.fontSize);
            if (bodyText) bodyText.set('fontSize', Math.max(12, Math.round(style.fontSize * 0.72)));
            if (active.stickyNoteData) {
              active.stickyNoteData.headerSize = style.fontSize;
              active.stickyNoteData.bodySize = Math.max(12, Math.round(style.fontSize * 0.72));
            }
          }
        }
        if (style.fontWeight !== undefined) {
          if (sub) sub.set('fontWeight', style.fontWeight);
          else allTexts.forEach((t) => t.set('fontWeight', style.fontWeight));
        }
        if (style.textAlign !== undefined) {
          if (sub) sub.set('textAlign', style.textAlign);
          else allTexts.forEach((t) => t.set('textAlign', style.textAlign));
        }
        if (style.opacity !== undefined) {
          active.set('opacity', style.opacity);
        }
        allTexts.forEach((t) => {
          t.dirty = true;
          if (typeof t.initDimensions === 'function') t.initDimensions();
        });
        active.dirty = true;
      } else if (
        active.type === 'group' &&
        (active.pixelForgeObjectType === 'arrow' || (active.id && active.id.includes('arrow')))
      ) {
        // Arrow group with line + triangle head
        const line = active.getObjects().find((o: any) => o.type === 'line');
        const head = active.getObjects().find((o: any) => o.type === 'triangle');
        if (style.strokeColor !== undefined) {
          const sc = (style.strokeColor === 'transparent' || style.strokeColor === 'none') ? 'transparent' : style.strokeColor;
          if (line) line.set('stroke', sc);
          if (head) head.set('fill', sc);
        }
        if (style.strokeWidth !== undefined && line) {
          line.set('strokeWidth', Math.max(0, style.strokeWidth));
        }
        if (style.opacity !== undefined) {
          active.set('opacity', Math.max(0, Math.min(1, style.opacity)));
        }
        active.dirty = true;
      } else if (active.type === 'textbox' || active.isPixelForgeText) {
        // Standalone Textbox
        const updates: any = {};
        if (style.fillColor !== undefined && style.fillColor !== 'transparent') {
          updates.fill = style.fillColor;
        } else if (style.strokeColor !== undefined) {
          updates.fill = style.strokeColor;
        }
        if (style.fontSize !== undefined) updates.fontSize = style.fontSize;
        if (style.fontWeight !== undefined) updates.fontWeight = style.fontWeight;
        if (style.textAlign !== undefined) updates.textAlign = style.textAlign;
        if (style.opacity !== undefined) updates.opacity = style.opacity;

        active.set(updates);
        active.dirty = true;
        if (typeof active.initDimensions === 'function') active.initDimensions();
      } else {
        // Vector Shapes & Drawings
        const updates: any = {};
        if (style.strokeColor !== undefined) {
          updates.stroke = (style.strokeColor === 'transparent' || style.strokeColor === 'none') ? 'transparent' : style.strokeColor;
        }
        if (style.fillColor !== undefined) {
          if (active.type === 'line') {
            updates.fill = 'transparent';
          } else {
            updates.fill = (style.fillColor === 'transparent' || !style.fillColor || style.fillColor === 'none') ? 'transparent' : style.fillColor;
          }
        }
        if (style.strokeWidth !== undefined) updates.strokeWidth = Math.max(0, style.strokeWidth);
        if (style.opacity !== undefined) updates.opacity = Math.max(0, Math.min(1, style.opacity));

        active.set(updates);
        active.dirty = true;
      }

      if (typeof active.initDimensions === 'function') active.initDimensions();
      active.setCoords();
      this.canvas.requestRenderAll();
      this.notifyObjects();
      this.notifySelection(active);
      this.notifySelectionBounds();
      this.saveHistorySnapshot();
    }
  }

  public setZoom(zoomLevel: number): void {
    if (!this.canvas) return;
    const clamped = clampZoom(zoomLevel);
    const center = new Point(this.canvas.getWidth() / 2, this.canvas.getHeight() / 2);
    this.canvas.zoomToPoint(center, clamped);
    this.notifyZoom(clamped);
    this.notifySelectionBounds();
    this.canvas.requestRenderAll();
  }

  public zoomIn(): void {
    if (!this.canvas) return;
    const currentZoom = getZoomLevel(this.canvas);
    this.setZoom(currentZoom * 1.15);
  }

  public zoomOut(): void {
    if (!this.canvas) return;
    const currentZoom = getZoomLevel(this.canvas);
    this.setZoom(currentZoom / 1.15);
  }

  public resetZoom(): void {
    if (!this.canvas) return;
    this.canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    this.notifyZoom(1.0);
    this.notifySelectionBounds();
    this.canvas.requestRenderAll();
  }

  public setGridSnap(enabled: boolean): void {
    this.isGridSnap = enabled;
  }

  public async undo(): Promise<void> {
    if (!this.canvas || this.undoStack.length <= 1) return;
    this.isRestoringHistory = true;
    try {
      const current = this.undoStack.pop();
      if (current) this.redoStack.push(current);
      const targetState = this.undoStack[this.undoStack.length - 1];
      if (targetState) {
        await this.canvas.loadFromJSON(JSON.parse(targetState));
        this.canvas.requestRenderAll();
        this.notifyObjects();
        this.notifySelection(this.canvas.getActiveObject() || null);
        this.notifySelectionBounds();
      }
    } finally {
      this.isRestoringHistory = false;
      this.notifyUndoRedo();
    }
  }

  public async redo(): Promise<void> {
    if (!this.canvas || this.redoStack.length === 0) return;
    this.isRestoringHistory = true;
    try {
      const nextState = this.redoStack.pop();
      if (nextState) {
        this.undoStack.push(nextState);
        await this.canvas.loadFromJSON(JSON.parse(nextState));
        this.canvas.requestRenderAll();
        this.notifyObjects();
        this.notifySelection(this.canvas.getActiveObject() || null);
        this.notifySelectionBounds();
      }
    } finally {
      this.isRestoringHistory = false;
      this.notifyUndoRedo();
    }
  }

  public async deleteSelected(): Promise<void> {
    if (!this.canvas) return;
    const activeObjects = this.canvas.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach((obj) => this.canvas?.remove(obj));
      this.canvas.discardActiveObject();
      this.canvas.requestRenderAll();
      this.notifyObjects();
      this.notifySelection(null);
      this.notifySelectionBounds();
      this.saveHistorySnapshot();
    }
  }

  public async duplicateSelected(): Promise<void> {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObject() as any;
    if (!active) return;

    try {
      if (active.type === 'activeselection') {
        const clones: any[] = [];
        const objects = active.getObjects ? active.getObjects() : [];
        for (const obj of objects) {
          const cl = await obj.clone(EXTRA_PROPS);
          cl.id = `obj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          cl.set({
            left: (obj.left || 0) + 24,
            top: (obj.top || 0) + 24,
          });
          this.canvas.add(cl);
          clones.push(cl);
        }
        this.canvas.discardActiveObject();
        if (clones.length > 0) {
          const ActiveSelClass = active.constructor;
          const sel = new ActiveSelClass(clones, { canvas: this.canvas });
          this.canvas.setActiveObject(sel);
        }
      } else {
        const clone = await active.clone(EXTRA_PROPS);
        clone.id = `obj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        clone.set({
          left: (active.left || 0) + 24,
          top: (active.top || 0) + 24,
        });
        this.canvas.add(clone);
        this.canvas.setActiveObject(clone);
      }
      this.canvas.requestRenderAll();
      this.notifyObjects();
      this.notifySelection(this.canvas.getActiveObject() || null);
      this.notifySelectionBounds();
      this.saveHistorySnapshot();
    } catch (err) {
      console.error('[FabricCanvasAdapter] Duplicate failed:', err);
    }
  }

  public async bringForwardSelected(): Promise<void> {
    if (!this.canvas) return;
    const objects = this.canvas.getActiveObjects();
    if (objects.length > 0) {
      const all = (this.canvas as any)._objects || [];
      const sorted = [...objects].sort((a, b) => all.indexOf(a) - all.indexOf(b));
      sorted.reverse().forEach((obj) => {
        if (typeof (this.canvas as any).bringObjectForward === 'function') {
          (this.canvas as any).bringObjectForward(obj);
        } else {
          (this.canvas as any).bringObjectToFront(obj);
        }
      });
      this.canvas.requestRenderAll();
      this.notifyObjects();
      this.saveHistorySnapshot();
    }
  }

  public async sendBackwardSelected(): Promise<void> {
    if (!this.canvas) return;
    const objects = this.canvas.getActiveObjects();
    if (objects.length > 0) {
      const all = (this.canvas as any)._objects || [];
      const sorted = [...objects].sort((a, b) => all.indexOf(a) - all.indexOf(b));
      sorted.forEach((obj) => {
        if (typeof (this.canvas as any).sendObjectBackwards === 'function') {
          (this.canvas as any).sendObjectBackwards(obj);
        } else {
          (this.canvas as any).sendObjectToBack(obj);
        }
      });
      this.canvas.requestRenderAll();
      this.notifyObjects();
      this.saveHistorySnapshot();
    }
  }

  public async bringToFrontSelected(): Promise<void> {
    if (!this.canvas) return;
    const objects = this.canvas.getActiveObjects();
    if (objects.length > 0) {
      const all = (this.canvas as any)._objects || [];
      const sorted = [...objects].sort((a, b) => all.indexOf(a) - all.indexOf(b));
      sorted.forEach((obj) => (this.canvas as any).bringObjectToFront(obj));
      this.canvas.requestRenderAll();
      this.notifyObjects();
      this.saveHistorySnapshot();
    }
  }

  public async sendToBackSelected(): Promise<void> {
    if (!this.canvas) return;
    const objects = this.canvas.getActiveObjects();
    if (objects.length > 0) {
      const all = (this.canvas as any)._objects || [];
      const sorted = [...objects].sort((a, b) => all.indexOf(a) - all.indexOf(b));
      sorted.reverse().forEach((obj) => (this.canvas as any).sendObjectToBack(obj));
      this.canvas.requestRenderAll();
      this.notifyObjects();
      this.saveHistorySnapshot();
    }
  }

  public nudgeSelected(dx: number, dy: number): void {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObject();
    if (!active || (active as any).isEditing) return;
    active.set({
      left: (active.left || 0) + dx,
      top: (active.top || 0) + dy,
    });
    active.setCoords();
    if (active.type === 'activeselection' && typeof (active as any).getObjects === 'function') {
      (active as any).getObjects().forEach((child: any) => child.setCoords());
    }
    this.canvas.requestRenderAll();
    this.notifyObjects();
    this.notifySelectionBounds();
    this.saveHistorySnapshot();
  }

  public panTo(worldX: number, worldY: number): void {
    if (!this.canvas) return;
    const zoom = getZoomLevel(this.canvas);
    const vpt = this.canvas.viewportTransform;
    vpt[4] = this.canvas.getWidth() / 2 - worldX * zoom;
    vpt[5] = this.canvas.getHeight() / 2 - worldY * zoom;
    this.canvas.setViewportTransform(vpt);
    this.canvas.requestRenderAll();
    this.notifySelectionBounds();
  }

  public updateObjectProperties(id: string, updates: Partial<CanvasObject>): void {
    if (!this.canvas) return;
    const found = this.canvas.getObjects().find((o) => (o as any).id === id) as any;
    if (!found) return;

    if (updates.fillColor !== undefined) {
      if (found.isPixelForgeSticky || found.stickyNoteData) {
        const { allTexts } = getStickyTextChildren(found);
        allTexts.forEach((t) => {
          t.set('fill', updates.fillColor);
          t.dirty = true;
        });
        if (found.stickyNoteData) {
          found.stickyNoteData.headerColor = updates.fillColor;
          found.stickyNoteData.bodyColor = updates.fillColor;
        }
      } else {
        found.set({ fill: (updates.fillColor === 'transparent' || !updates.fillColor) ? '' : updates.fillColor });
      }
    }
    if (updates.strokeColor !== undefined) {
      if (found.type === 'group' && (found.pixelForgeObjectType === 'arrow' || (found.id && found.id.includes('arrow')))) {
        const line = found.getObjects().find((o: any) => o.type === 'line');
        const head = found.getObjects().find((o: any) => o.type === 'triangle');
        if (line) line.set('stroke', updates.strokeColor);
        if (head) head.set('fill', updates.strokeColor);
      } else {
        found.set({ stroke: updates.strokeColor });
      }
    }
    if (updates.strokeWidth !== undefined) {
      if (found.type === 'group' && (found.pixelForgeObjectType === 'arrow' || (found.id && found.id.includes('arrow')))) {
        const line = found.getObjects().find((o: any) => o.type === 'line');
        if (line) line.set('strokeWidth', updates.strokeWidth);
      } else {
        found.set({ strokeWidth: updates.strokeWidth });
      }
    }
    if (updates.opacity !== undefined) {
      found.set({ opacity: updates.opacity });
    }
    if (updates.borderRadius !== undefined && found.type === 'rect') {
      const r = Array.isArray(updates.borderRadius) ? updates.borderRadius[0] : updates.borderRadius;
      found.set({ rx: r, ry: r });
    }
    if (updates.text !== undefined) {
      if (found.type === 'textbox' || found.isPixelForgeText) {
        found.set('text', updates.text);
        if (typeof found.initDimensions === 'function') found.initDimensions();
      } else if (found.isPixelForgeSticky || found.stickyNoteData) {
        const { headerText, bodyText } = getStickyTextChildren(found);
        const parts = updates.text.split('\n');
        if (headerText && parts[0] !== undefined) {
          headerText.set('text', parts[0]);
          if (found.stickyNoteData) found.stickyNoteData.header = parts[0];
          if (typeof headerText.initDimensions === 'function') headerText.initDimensions();
        }
        if (bodyText && parts.length > 1) {
          const bodyStr = parts.slice(1).join('\n');
          bodyText.set('text', bodyStr);
          if (found.stickyNoteData) found.stickyNoteData.body = bodyStr;
          if (typeof bodyText.initDimensions === 'function') bodyText.initDimensions();
        }
      }
    }

    found.dirty = true;
    found.setCoords();
    this.canvas.requestRenderAll();
    this.notifyObjects();
    this.notifySelection(found);
    this.notifySelectionBounds();
    this.saveHistorySnapshot();
  }

  // =========================================================================
  // Brush Studio & Template Methods
  // =========================================================================

  public setBrushSettings(settings: Partial<BrushSettings>): void {
    this.brushSettings = { ...this.brushSettings, ...settings };
    if (settings.color) {
      this.styleConfig.strokeColor = settings.color;
    }
    if (settings.width) {
      this.styleConfig.brushSize = settings.width;
    }
    const isDrawingTool =
      this.currentTool === 'brush' ||
      this.currentTool === 'highlighter' ||
      ['pen', 'marker', 'pencil', 'calligraphy'].includes(this.currentTool);
    if (this.canvas && isDrawingTool) {
      this.applyBrushSettings();
      this.canvas.requestRenderAll();
    }
    for (const listener of this.brushSettingsListeners) {
      listener(this.brushSettings);
    }
  }

  public getBrushSettings(): BrushSettings {
    return { ...this.brushSettings };
  }

  public onBrushSettingsChange(listener: (settings: BrushSettings) => void): () => void {
    this.brushSettingsListeners.add(listener);
    listener(this.brushSettings);
    return () => this.brushSettingsListeners.delete(listener);
  }

  public setStickyTemplate(template: string): void {
    this.selectedStickyTemplate = template;
  }

  public getStickyTemplate(): string {
    return this.selectedStickyTemplate;
  }

  public async changeStickyTemplate(templateKey: string): Promise<void> {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObject() as any;
    if (!active || !(active.isPixelForgeSticky || active.stickyNoteData)) return;
    const style = STICKY_TEMPLATES[templateKey];
    if (!style) return;

    try {
      const { headerText, bodyText } = getStickyTextChildren(active);
      const curHeader = headerText?.text || active.stickyNoteData?.header || 'Idea Note';
      const curBody = bodyText?.text || active.stickyNoteData?.body || 'Write something...';
      const left = active.left || 0;
      const top = active.top || 0;
      const width = (active.width || 280) * (active.scaleX || 1);
      const height = (active.height || 200) * (active.scaleY || 1);
      const angle = active.angle || 0;
      const existingId = active.id;

      const objects = (this.canvas as any)._objects || [];
      const index = objects.indexOf(active);

      const newNote = await createStickyNote({
        template: templateKey,
        header: curHeader,
        body: curBody,
        left,
        top,
        width,
        height,
        headerFont: active.stickyNoteData?.headerFont || 'Georgia',
        bodyFont: active.stickyNoteData?.bodyFont || 'Arial',
        headerSize: active.stickyNoteData?.headerSize || 25,
        bodySize: active.stickyNoteData?.bodySize || 17,
        headerColor: style.foreground,
        bodyColor: style.foreground,
      });

      newNote.set({ angle });
      (newNote as any).id = existingId;
      (newNote as any).name = style.name;

      if (index >= 0) {
        this.canvas.remove(active);
        this.canvas.insertAt(index, newNote);
      } else {
        this.canvas.remove(active);
        this.canvas.add(newNote);
      }

      this.canvas.setActiveObject(newNote);
      newNote.setCoords();
      this.canvas.requestRenderAll();
      this.notifyObjects();
      this.notifySelection(newNote);
      this.notifySelectionBounds();
      this.saveHistorySnapshot();
    } catch (err) {
      console.warn('[FabricCanvasAdapter] Failed to change sticky template:', err);
    }
  }

  public async seedDemoContent(): Promise<void> {
    if (!this.canvas) return;
    await seedInitialSprintObjects(this.canvas);
    this.saveHistorySnapshot();
  }

  public async createStickyNoteAt(options: {
    template?: string;
    x: number;
    y: number;
    header?: string;
    body?: string;
  }): Promise<void> {
    if (!this.canvas) return;
    try {
      const template = options.template || this.selectedStickyTemplate;
      const note = await createStickyNote({
        template,
        header: options.header || 'Idea Note',
        body: options.body || 'Double click to edit text...',
        left: options.x - 140,
        top: options.y - 100,
        width: 280,
        height: 200,
      });
      (note as any).id = `sticky-${Date.now()}`;
      (note as any).name = `${STICKY_TEMPLATES[template]?.name || 'Sticky Note'}`;
      this.canvas.add(note);
      this.canvas.setActiveObject(note);
      this.setTool('select');
      this.notifyObjects();
      this.notifySelection(note);
      this.notifySelectionBounds();
      this.saveHistorySnapshot();
    } catch (err) {
      console.error('[FabricCanvasAdapter] Failed to create sticky note:', err);
    }
  }

  // =========================================================================
  // Text Formatting Methods
  // =========================================================================

  public setTextSettings(settings: Partial<TextFormattingSettings>): void {
    this.textSettings = { ...this.textSettings, ...settings };
    this.notifyTextSettings(this.textSettings);
  }

  public getTextSettings(): TextFormattingSettings {
    return { ...this.textSettings };
  }

  public onTextSettingsChange(listener: (settings: TextFormattingSettings) => void): () => void {
    this.textSettingsListeners.add(listener);
    listener(this.getTextSettings());
    return () => {
      this.textSettingsListeners.delete(listener);
    };
  }

  private notifyTextSettings(settings: TextFormattingSettings) {
    for (const listener of this.textSettingsListeners) {
      listener(settings);
    }
  }

  public applyTextStyle(style: Partial<TextFormattingSettings> & Record<string, any>): void {
    const boldVal = style.bold !== undefined ? style.bold : (style.fontWeight !== undefined ? style.fontWeight === 'bold' : undefined);
    const italicVal = style.italic !== undefined ? style.italic : (style.fontStyle !== undefined ? style.fontStyle === 'italic' : undefined);
    const fillVal = style.fill || style.textColor || style.color;
    const bgVal = style.backgroundColor !== undefined ? style.backgroundColor : style.textBackground;
    const lhVal = style.lineHeight !== undefined ? style.lineHeight : style.lineSpacing;
    const alignVal = style.textAlign;
    const fontVal = style.fontFamily;
    const sizeVal = style.fontSize ? Number(style.fontSize) : undefined;
    const underlineVal = style.underline !== undefined ? Boolean(style.underline) : undefined;

    // Update internal text settings state
    this.textSettings = {
      ...this.textSettings,
      ...(fontVal ? { fontFamily: fontVal } : {}),
      ...(sizeVal ? { fontSize: sizeVal } : {}),
      ...(fillVal ? { fill: fillVal } : {}),
      ...(boldVal !== undefined ? { bold: Boolean(boldVal) } : {}),
      ...(italicVal !== undefined ? { italic: Boolean(italicVal) } : {}),
      ...(underlineVal !== undefined ? { underline: Boolean(underlineVal) } : {}),
      ...(alignVal ? { textAlign: alignVal } : {}),
      ...(bgVal !== undefined ? { backgroundColor: bgVal } : {}),
      ...(lhVal !== undefined ? { lineHeight: Number(lhVal) } : {}),
    };
    this.notifyTextSettings(this.textSettings);

    if (!this.canvas) return;
    let active = this.canvas.getActiveObject() as any;
    if (!active && this.lastSelectedObjectId) {
      active = this.canvas.getObjects().find((o: any) => (o as any).id === this.lastSelectedObjectId);
      if (active) {
        this.canvas.setActiveObject(active);
      }
    }
    if (!active) return;

    if (active.isPixelForgeSticky || active.stickyNoteData) {
      const { headerText, bodyText, allTexts } = getStickyTextChildren(active);
      const sub = (active as any)._activeSubTarget;

      if (fontVal) {
        if (sub) {
          sub.set('fontFamily', fontVal);
          if (active.stickyNoteData) {
            if (sub.stickyPart === 'header') active.stickyNoteData.headerFont = fontVal;
            else active.stickyNoteData.bodyFont = fontVal;
          }
        } else {
          allTexts.forEach((t) => t.set('fontFamily', fontVal));
          if (active.stickyNoteData) {
            active.stickyNoteData.headerFont = fontVal;
            active.stickyNoteData.bodyFont = fontVal;
          }
        }
      }
      if (sizeVal) {
        if (sub) {
          sub.set('fontSize', sizeVal);
          if (active.stickyNoteData) {
            if (sub.stickyPart === 'header') active.stickyNoteData.headerSize = sizeVal;
            else active.stickyNoteData.bodySize = sizeVal;
          }
        } else {
          if (headerText) headerText.set('fontSize', sizeVal);
          if (bodyText) bodyText.set('fontSize', Math.max(12, Math.round(sizeVal * 0.72)));
          if (active.stickyNoteData) {
            active.stickyNoteData.headerSize = sizeVal;
            active.stickyNoteData.bodySize = Math.max(12, Math.round(sizeVal * 0.72));
          }
        }
      }
      if (fillVal) {
        if (sub) {
          sub.set('fill', fillVal);
          if (active.stickyNoteData) {
            if (sub.stickyPart === 'header') active.stickyNoteData.headerColor = fillVal;
            else active.stickyNoteData.bodyColor = fillVal;
          }
        } else {
          allTexts.forEach((t) => t.set('fill', fillVal));
          if (active.stickyNoteData) {
            active.stickyNoteData.headerColor = fillVal;
            active.stickyNoteData.bodyColor = fillVal;
          }
        }
      }
      if (boldVal !== undefined) {
        const wt = boldVal ? 'bold' : 'normal';
        if (sub) sub.set('fontWeight', wt);
        else allTexts.forEach((t) => t.set('fontWeight', wt));
      }
      if (italicVal !== undefined) {
        const fs = italicVal ? 'italic' : 'normal';
        if (sub) sub.set('fontStyle', fs);
        else allTexts.forEach((t) => t.set('fontStyle', fs));
      }
      if (underlineVal !== undefined) {
        if (sub) sub.set('underline', underlineVal);
        else allTexts.forEach((t) => t.set('underline', underlineVal));
      }
      if (alignVal) {
        if (sub) sub.set('textAlign', alignVal);
        else allTexts.forEach((t) => t.set('textAlign', alignVal));
      }
      allTexts.forEach((t) => {
        t.dirty = true;
        if (typeof t.initDimensions === 'function') t.initDimensions();
      });
      active.dirty = true;
    } else {
      const isEditingWithSelection =
        (active.isEditing &&
        active.selectionStart !== undefined &&
        active.selectionEnd !== undefined &&
        active.selectionStart !== active.selectionEnd) ||
        (active._lastSelectionStart !== undefined &&
         active._lastSelectionEnd !== undefined &&
         active._lastSelectionStart !== active._lastSelectionEnd);

      const selStart = (active.selectionStart !== undefined && active.selectionStart !== active.selectionEnd)
        ? active.selectionStart
        : active._lastSelectionStart;
      const selEnd = (active.selectionStart !== undefined && active.selectionStart !== active.selectionEnd)
        ? active.selectionEnd
        : active._lastSelectionEnd;

      if (isEditingWithSelection && selStart !== undefined && selEnd !== undefined && selStart !== selEnd) {
        const patch: any = {};
        if (fontVal !== undefined) patch.fontFamily = fontVal;
        if (sizeVal !== undefined) patch.fontSize = sizeVal;
        if (fillVal !== undefined) patch.fill = fillVal;
        if (boldVal !== undefined) patch.fontWeight = boldVal ? 'bold' : 'normal';
        if (italicVal !== undefined) patch.fontStyle = italicVal ? 'italic' : 'normal';
        if (underlineVal !== undefined) patch.underline = underlineVal;
        if (bgVal !== undefined) {
          patch.textBackgroundColor = bgVal === 'transparent' ? '' : bgVal;
        }
        if (lhVal !== undefined) patch.lineHeight = lhVal;

        if (typeof active.setSelectionStyles === 'function' && active.isEditing) {
          active.setSelectionStyles(patch);
        } else if (typeof active.text === 'string') {
          const lines = active.text.split(/\r?\n/);
          const styles = { ...(active.styles || {}) };
          let globalIndex = 0;
          lines.forEach((line: string, lineIndex: number) => {
            const lineStyles = { ...(styles[lineIndex] || {}) };
            for (let charIndex = 0; charIndex < line.length; charIndex++) {
              if (globalIndex >= selStart && globalIndex < selEnd) {
                lineStyles[charIndex] = { ...(lineStyles[charIndex] || {}), ...patch };
              }
              globalIndex++;
            }
            styles[lineIndex] = lineStyles;
            if (lineIndex < lines.length - 1) globalIndex++;
          });
          active.set('styles', styles);
        }
      } else {
        const updates: any = {};
        if (fontVal !== undefined) updates.fontFamily = fontVal;
        if (sizeVal !== undefined) updates.fontSize = sizeVal;
        if (fillVal !== undefined) updates.fill = fillVal;
        if (boldVal !== undefined) updates.fontWeight = boldVal ? 'bold' : 'normal';
        if (italicVal !== undefined) updates.fontStyle = italicVal ? 'italic' : 'normal';
        if (underlineVal !== undefined) updates.underline = underlineVal;
        if (alignVal !== undefined) updates.textAlign = alignVal;
        if (bgVal !== undefined) {
          const bgTextVal = bgVal === 'transparent' ? '' : bgVal;
          updates.textBackgroundColor = bgTextVal;
          updates.backgroundColor = bgTextVal;
        }
        if (lhVal !== undefined) updates.lineHeight = lhVal;

        active.set(updates);

        // Clear overriding character-level styles for modified keys
        if (active.styles) {
          const keysToClear = Object.keys(updates);
          if (updates.textBackgroundColor !== undefined) {
            keysToClear.push('textBackgroundColor', 'backgroundColor');
          }
          Object.values(active.styles).forEach((lineObj: any) => {
            if (lineObj && typeof lineObj === 'object') {
              Object.values(lineObj).forEach((charObj: any) => {
                if (charObj && typeof charObj === 'object') {
                  keysToClear.forEach((k) => delete charObj[k]);
                }
              });
            }
          });
        }
      }

      active.dirty = true;
      if (typeof active.initDimensions === 'function') active.initDimensions();
    }

    active.setCoords();
    this.canvas.requestRenderAll();
    this.notifyObjects();
    this.notifySelection(active);
    this.notifySelectionBounds();
    this.saveHistorySnapshot();
  }

  public highlightSelectedText(color?: string): void {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObject() as any;
    const highlightColor = color || this.brushSettings.highlighterColor || '#FDE047';
    if (!active) return;

    let start = active.selectionStart;
    let end = active.selectionEnd;
    if (
      (start === undefined || start === end) &&
      active._lastSelectionStart !== undefined &&
      active._lastSelectionStart !== active._lastSelectionEnd
    ) {
      start = active._lastSelectionStart;
      end = active._lastSelectionEnd;
    }

    if (start !== undefined && end !== undefined && start !== end && typeof active.text === 'string') {
      const lines = active.text.split(/\r?\n/);
      const styles = { ...(active.styles || {}) };
      let globalIndex = 0;
      lines.forEach((line: string, lineIndex: number) => {
        const lineStyles = { ...(styles[lineIndex] || {}) };
        for (let charIndex = 0; charIndex < line.length; charIndex++) {
          if (globalIndex >= start && globalIndex < end) {
            lineStyles[charIndex] = { ...(lineStyles[charIndex] || {}), textBackgroundColor: highlightColor };
          }
          globalIndex++;
        }
        styles[lineIndex] = lineStyles;
        if (lineIndex < lines.length - 1) globalIndex++;
      });
      active.set('styles', styles);
      active.dirty = true;
      if (typeof active.initDimensions === 'function') active.initDimensions();
    } else {
      active.set('backgroundColor', highlightColor);
      active.dirty = true;
    }
    this.canvas.requestRenderAll();
    this.saveHistorySnapshot();
  }

  public highlightWholeText(color?: string): void {
    if (!this.canvas) return;
    const active = this.canvas.getActiveObject() as any;
    if (!active) return;
    active.set('backgroundColor', color || this.brushSettings.highlighterColor || '#FDE047');
    active.dirty = true;
    this.canvas.requestRenderAll();
    this.saveHistorySnapshot();
  }

  // =========================================================================
  // Export Implementation
  // =========================================================================

  public async exportCanvas(options: ExportOptions): Promise<ExportResult> {
    if (!this.canvas) {
      return {
        format: options.format,
        simulated: true,
        message: 'Canvas engine is not yet mounted.',
      };
    }

    try {
      if (options.format === 'svg') {
        const svgString = this.canvas.toSVG();
        const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString)}`;
        return {
          format: 'svg',
          simulated: false,
          svgString,
          dataUrl,
          message: 'Canvas exported successfully as SVG.',
        };
      } else {
        const dataUrl = this.canvas.toDataURL({
          format: 'png',
          multiplier: 2,
          enableRetinaScaling: true,
        });
        return {
          format: 'png',
          simulated: false,
          dataUrl,
          message: 'Canvas exported successfully as PNG.',
        };
      }
    } catch (err: any) {
      return {
        format: options.format,
        simulated: false,
        message: `Export failed: ${err?.message || 'Unknown error'}`,
      };
    }
  }

  public getReadiness(): EngineReadinessState {
    return this.readiness;
  }

  public getUndoRedoCapabilities(): UndoRedoCapabilities {
    return {
      canUndo: this.undoStack.length > 1,
      canRedo: this.redoStack.length > 0,
    };
  }

  // =========================================================================
  // Subscriptions & Selection Bounds Tracking
  // =========================================================================

  public onReadinessChange(listener: (state: EngineReadinessState) => void): () => void {
    this.readinessListeners.add(listener);
    listener(this.readiness);
    return () => this.readinessListeners.delete(listener);
  }

  public onUndoRedoChange(listener: (caps: UndoRedoCapabilities) => void): () => void {
    this.undoRedoListeners.add(listener);
    listener(this.getUndoRedoCapabilities());
    return () => this.undoRedoListeners.delete(listener);
  }

  public onZoomChange(listener: (zoom: number) => void): () => void {
    this.zoomListeners.add(listener);
    if (this.canvas) {
      listener(getZoomLevel(this.canvas));
    }
    return () => this.zoomListeners.delete(listener);
  }

  public onCoordinatesChange(listener: (coords: { x: number; y: number }) => void): () => void {
    this.coordinatesListeners.add(listener);
    return () => this.coordinatesListeners.delete(listener);
  }

  public onActiveObjectChange(listener: (obj: FabricObject | null) => void): () => void {
    this.activeObjectListeners.add(listener);
    return () => this.activeObjectListeners.delete(listener);
  }

  public onObjectsChange(listener: (objects: CanvasObject[]) => void): () => void {
    this.objectsListeners.add(listener);
    if (this.canvas) {
      listener(this.canvas.getObjects().map((o) => this.convertFabricObjectToCanvasObject(o)));
    }
    return () => this.objectsListeners.delete(listener);
  }

  public onSelectionChange(listener: (selectedId: string | null, selectedObject?: CanvasObject | null) => void): () => void {
    this.selectionListeners.add(listener);
    const active = this.canvas?.getActiveObject();
    if (active) {
      const converted = this.convertFabricObjectToCanvasObject(active);
      listener(converted.id, converted);
    } else {
      listener(null, null);
    }
    return () => this.selectionListeners.delete(listener);
  }

  public onSelectionBoundsChange(listener: (bounds: { left: number; top: number; width: number; height: number } | null) => void): () => void {
    this.selectionBoundsListeners.add(listener);
    listener(this.getActiveSelectionScreenBounds());
    return () => this.selectionBoundsListeners.delete(listener);
  }

  public getActiveSelectionScreenBounds(): { left: number; top: number; width: number; height: number } | null {
    if (!this.canvas) return null;
    const active = this.canvas.getActiveObject();
    if (!active) return null;

    const bounds = active.getBoundingRect();
    const vpt = this.canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
    const zoom = this.canvas.getZoom() || 1;
    const canvasRect = this.canvas.upperCanvasEl?.getBoundingClientRect();
    if (!canvasRect) return null;

    const left = canvasRect.left + (bounds.left * zoom + vpt[4]);
    const top = canvasRect.top + (bounds.top * zoom + vpt[5]);
    const width = bounds.width * zoom;
    const height = bounds.height * zoom;

    return { left, top, width, height };
  }

  public notifySelectionBounds() {
    const bounds = this.getActiveSelectionScreenBounds();
    for (const listener of this.selectionBoundsListeners) {
      listener(bounds);
    }
  }

  public selectObject(id: string | null): void {
    if (!this.canvas) return;
    if (!id) {
      this.canvas.discardActiveObject();
      this.canvas.requestRenderAll();
      this.notifySelection(null);
      this.notifySelectionBounds();
      return;
    }
    const found = this.canvas.getObjects().find((o) => (o as any).id === id);
    if (found) {
      this.canvas.setActiveObject(found);
      this.canvas.requestRenderAll();
      this.notifySelection(found);
      this.notifySelectionBounds();
    }
  }

  public setObjectVisibility(id: string, visible: boolean): void {
    if (!this.canvas) return;
    const found = this.canvas.getObjects().find((o) => (o as any).id === id);
    if (found) {
      found.set({ visible });
      this.canvas.requestRenderAll();
      this.notifyObjects();
    }
  }

  public notifyObjects() {
    if (!this.canvas) return;
    const objects = this.canvas.getObjects().map((o) => this.convertFabricObjectToCanvasObject(o));
    for (const listener of this.objectsListeners) {
      listener(objects);
    }
  }

  public notifySelection(selected: FabricObject | null) {
    if (!selected) {
      this.notifyActiveObject(null);
      for (const listener of this.selectionListeners) {
        listener(null, null);
      }
      this.notifySelectionBounds();
      return;
    }
    const canvasObj = this.convertFabricObjectToCanvasObject(selected);
    this.lastSelectedObjectId = canvasObj.id || null;

    if (canvasObj.type === 'text' || canvasObj.type === 'sticky') {
      const nextSettings: TextFormattingSettings = {
        fontFamily: canvasObj.fontFamily || this.textSettings.fontFamily || 'Arial',
        fontSize: canvasObj.fontSize || this.textSettings.fontSize || 24,
        fill: canvasObj.fillColor || canvasObj.strokeColor || this.textSettings.fill || '#302633',
        bold: canvasObj.fontWeight === 'bold',
        italic: canvasObj.fontStyle === 'italic',
        underline: Boolean(canvasObj.underline),
        textAlign: (canvasObj.textAlign as any) || this.textSettings.textAlign || 'left',
        backgroundColor: canvasObj.backgroundColor || 'transparent',
        lineHeight: canvasObj.lineHeight || this.textSettings.lineHeight || 1.2,
      };
      this.textSettings = nextSettings;
      this.notifyTextSettings(nextSettings);
    }

    this.notifyActiveObject(selected);
    for (const listener of this.selectionListeners) {
      listener(canvasObj.id, canvasObj);
    }
    this.notifySelectionBounds();
  }

  public convertFabricObjectToCanvasObject(obj: FabricObject): CanvasObject {
    const custom = obj as any;
    const id = custom.id || custom._customId || `obj-${Math.random().toString(36).substring(2, 9)}`;
    custom.id = id;

    let type: ToolType = 'rectangle';
    if (custom.pixelForgeObjectType) {
      type = custom.pixelForgeObjectType as ToolType;
    } else if (obj.type === 'activeselection') {
      type = 'select';
    } else if (custom.isPixelForgeSticky || custom.stickyNoteData) {
      type = 'sticky';
    } else if (custom.isPixelForgeText || obj.type === 'textbox') {
      type = 'text';
    } else if (custom.isPixelForgeStroke || obj.type === 'path') {
      type = custom.brushKind === 'highlighter' ? 'highlighter' : 'brush';
    } else if (obj.type === 'circle') {
      type = (custom.scaleX && custom.scaleX !== 1) ? 'ellipse' : 'circle';
    } else if (obj.type === 'rect') {
      type = (obj as any).rx ? 'rounded-rectangle' : 'rectangle';
    } else if (obj.type === 'triangle') {
      type = 'triangle';
    } else if (obj.type === 'line') {
      type = 'line';
    } else if (obj.type === 'polygon') {
      type = 'diamond';
    } else if (obj.type === 'group' && (custom.pixelForgeObjectType === 'arrow' || (custom.id && custom.id.includes('arrow')))) {
      type = 'arrow';
    }

    let text = '';
    let fontFamily = 'Arial';
    let fontSize = 20;
    let fontWeight: 'normal' | 'bold' = 'normal';
    let fontStyle: 'normal' | 'italic' = 'normal';
    let underline = false;
    let textAlign: 'left' | 'center' | 'right' = 'left';
    let lineHeight = 1.2;
    let backgroundColor = '';
    let template = 'sunny';
    let fillColor = (typeof obj.fill === 'string' && obj.fill) ? obj.fill : (obj.fill === null || obj.fill === '' || obj.fill === 'transparent' ? 'transparent' : undefined);
    let strokeColor = (typeof obj.stroke === 'string' && obj.stroke) ? obj.stroke : (obj.stroke === null || obj.stroke === '' || obj.stroke === 'transparent' ? 'transparent' : undefined);
    let strokeWidth = typeof obj.strokeWidth === 'number' ? obj.strokeWidth : 2;

    if (obj.type === 'activeselection') {
      const children = (obj as any).getObjects?.() || [];
      const firstChild = children[0];
      if (firstChild) {
        fillColor = (typeof firstChild.fill === 'string' && firstChild.fill) ? firstChild.fill : (firstChild.fill === null || firstChild.fill === '' || firstChild.fill === 'transparent' ? 'transparent' : undefined);
        strokeColor = (typeof firstChild.stroke === 'string' && firstChild.stroke) ? firstChild.stroke : (firstChild.stroke === null || firstChild.stroke === '' || firstChild.stroke === 'transparent' ? 'transparent' : undefined);
        strokeWidth = typeof firstChild.strokeWidth === 'number' ? firstChild.strokeWidth : 2;
      }
    } else if (type === 'sticky') {
      const { headerText, bodyText } = getStickyTextChildren(obj);
      text = `${headerText?.text || ''}\n${bodyText?.text || ''}`;
      template = custom.stickyNoteData?.template || 'sunny';
      const sub = custom._activeSubTarget;
      const sample = sub || headerText || bodyText;
      if (sample) {
        fontFamily = sample.fontFamily || 'Arial';
        fontSize = sample.fontSize || 22;
        fontWeight = sample.fontWeight === 'bold' ? 'bold' : 'normal';
        fontStyle = sample.fontStyle === 'italic' ? 'italic' : 'normal';
        underline = Boolean(sample.underline);
        textAlign = (sample.textAlign as any) || 'left';
        fillColor = sample.fill || custom.stickyNoteData?.headerColor || '#252525';
      }
      strokeColor = fillColor;
      strokeWidth = 0;
    } else if (type === 'text') {
      text = custom.text || '';
      fontFamily = custom.fontFamily || 'Arial';
      fontSize = custom.fontSize || 20;
      fontWeight = custom.fontWeight === 'bold' ? 'bold' : 'normal';
      fontStyle = custom.fontStyle === 'italic' ? 'italic' : 'normal';
      underline = Boolean(custom.underline);
      textAlign = (custom.textAlign as any) || 'left';
      lineHeight = custom.lineHeight || 1.2;
      backgroundColor = custom.textBackgroundColor || custom.backgroundColor || '';
      fillColor = typeof obj.fill === 'string' ? obj.fill : '#1E293B';
      strokeColor = fillColor;
      strokeWidth = 0;
    } else if (type === 'arrow') {
      const line = (obj as any).getObjects?.().find((o: any) => o.type === 'line');
      strokeColor = line?.stroke || '#F26B5B';
      strokeWidth = typeof line?.strokeWidth === 'number' ? line.strokeWidth : 2;
      fillColor = 'transparent';
    } else if (type === 'line') {
      strokeColor = typeof obj.stroke === 'string' ? obj.stroke : '#F26B5B';
      strokeWidth = typeof obj.strokeWidth === 'number' ? obj.strokeWidth : 2;
      fillColor = 'transparent';
    }

    return {
      id,
      type,
      x: Math.round(obj.left || 0),
      y: Math.round(obj.top || 0),
      width: Math.round((obj.width || 0) * (obj.scaleX || 1)),
      height: Math.round((obj.height || 0) * (obj.scaleY || 1)),
      strokeColor,
      fillColor,
      strokeWidth,
      opacity: obj.opacity !== undefined ? obj.opacity : 1,
      text,
      fontFamily,
      fontSize,
      fontWeight,
      fontStyle,
      underline,
      textAlign,
      lineHeight,
      backgroundColor,
      template,
      stickyColor: custom.stickyNoteData?.headerColor || custom.stickyColor || '#fef08a',
      visible: obj.visible !== false,
      borderRadius: (obj as any).rx,
    };
  }

  // =========================================================================
  // Internal Helpers & Event Handlers
  // =========================================================================

  private applyToolToCanvas(tool: ToolType) {
    const canvas = this.canvas;
    if (!canvas) return;

    const isDrawingTool =
      tool === 'brush' ||
      tool === 'highlighter' ||
      tool === 'pen' ||
      tool === 'marker' ||
      tool === 'pencil' ||
      tool === 'calligraphy';

    if (isDrawingTool) {
      if (tool === 'pen' || tool === 'marker' || tool === 'pencil' || tool === 'calligraphy') {
        this.brushSettings.kind = tool;
      }
      canvas.isDrawingMode = true;
      canvas.selection = false;
      this.applyBrushSettings();
      canvas.defaultCursor = 'crosshair';
    } else if (tool === 'eraser') {
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.defaultCursor = 'cell';
    } else if (tool === 'pan') {
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.defaultCursor = 'grab';
    } else if (tool === 'text') {
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.defaultCursor = 'text';
    } else if (tool === 'select') {
      canvas.isDrawingMode = false;
      canvas.selection = true;
      canvas.defaultCursor = 'default';
    } else {
      // Shapes / Sticky Note
      canvas.isDrawingMode = false;
      canvas.selection = false;
      canvas.defaultCursor = 'crosshair';
    }

    // Toggle object selectability depending on tool
    canvas.getObjects().forEach((obj) => {
      if (isDrawingTool || tool === 'eraser' || tool === 'pan') {
        obj.selectable = false;
        obj.evented = false;
      } else {
        obj.selectable = true;
        obj.evented = true;
      }
    });

    canvas.requestRenderAll();
  }

  private applyBrushSettings() {
    if (!this.canvas) return;
    const isHighlighter = this.currentTool === 'highlighter';
    const kind = isHighlighter
      ? 'highlighter'
      : (['pen', 'marker', 'pencil', 'calligraphy'].includes(this.currentTool)
          ? this.currentTool
          : this.brushSettings.kind || 'pen');

    if (kind !== 'highlighter') {
      this.brushSettings.kind = kind as any;
    }

    let defaultWidth = this.brushSettings.width || this.styleConfig.brushSize || 4;
    if (kind === 'marker' && (!this.brushSettings.width || this.brushSettings.width === 4)) {
      defaultWidth = 10;
    } else if (kind === 'pencil' && (!this.brushSettings.width || this.brushSettings.width === 4)) {
      defaultWidth = 2;
    } else if (kind === 'calligraphy' && (!this.brushSettings.width || this.brushSettings.width === 4)) {
      defaultWidth = 8;
    }

    const settings = {
      kind,
      color: isHighlighter
        ? this.brushSettings.highlighterColor || '#FDE047'
        : this.brushSettings.color || this.styleConfig.strokeColor || '#252525',
      width: isHighlighter
        ? Math.max(this.brushSettings.width || 20, 18)
        : defaultWidth,
      opacity: isHighlighter ? 0.3 : (this.brushSettings.opacity ?? 1),
      pressureEnabled: this.brushSettings.pressureEnabled,
    };

    const brush = new PressurePencilBrush(this.canvas, kind, settings);
    brush.color = settings.color;
    brush.width = settings.width;
    brush.strokeLineCap = kind === 'calligraphy' ? 'square' : 'round';
    brush.strokeDashArray = kind === 'pencil' ? [1, 1.8] : null;
    this.canvas.freeDrawingBrush = brush;
  }

  /**
   * Whole-stroke eraser: removes the entire stroke path on intersection.
   */
  private eraseWholeStrokeAt(point: { x: number; y: number }) {
    if (!this.canvas) return;
    const radius = this.brushSettings.eraserWidth || 22;
    const objects = this.canvas.getObjects().slice().reverse();
    const target = objects.find((obj: any) => {
      if (!obj.isPixelForgeStroke && obj.type !== 'path') return false;
      if (obj.containsPoint(point)) return true;
      const bounds = obj.getBoundingRect();
      const nearestX = Math.max(bounds.left, Math.min(point.x, bounds.left + bounds.width));
      const nearestY = Math.max(bounds.top, Math.min(point.y, bounds.top + bounds.height));
      const dx = point.x - nearestX;
      const dy = point.y - nearestY;
      return dx * dx + dy * dy <= radius * radius;
    });

    if (target) {
      this.canvas.remove(target);
      this.canvas.requestRenderAll();
      this.notifyObjects();
      this.notifySelectionBounds();
      this.saveHistorySnapshot();
    }
  }

  /**
   * Sweep eraser: erases only intersected stroke segments while preserving unaffected portions.
   */
  private eraseSweepAt(point: { x: number; y: number }) {
    if (!this.canvas) return;
    const radius = this.brushSettings.eraserWidth || 22;
    const objects = this.canvas.getObjects().slice().reverse();
    let hasMutated = false;

    for (const rawObj of objects) {
      const obj = rawObj as any;
      if (!obj.isPixelForgeStroke && obj.type !== 'path') continue;
      const pathObj = obj as any;
      if (!Array.isArray(pathObj.path) || pathObj.path.length === 0) continue;

      // Quick bounding box check
      const bounds = pathObj.getBoundingRect();
      const nearestX = Math.max(bounds.left, Math.min(point.x, bounds.left + bounds.width));
      const nearestY = Math.max(bounds.top, Math.min(point.y, bounds.top + bounds.height));
      const dx = point.x - nearestX;
      const dy = point.y - nearestY;
      if (dx * dx + dy * dy > radius * radius) {
        continue;
      }

      // Detailed segment check with sub-path splitting
      const matrix = pathObj.calcTransformMatrix();
      const pathOffset = pathObj.pathOffset || { x: 0, y: 0 };
      let hasErasedAny = false;
      const newCommands: any[] = [];
      let isDrawingSubpath = false;

      for (let i = 0; i < pathObj.path.length; i++) {
        const cmd = pathObj.path[i];
        const x = cmd[cmd.length - 2];
        const y = cmd[cmd.length - 1];
        if (typeof x !== 'number' || typeof y !== 'number') {
          newCommands.push(cmd);
          continue;
        }

        const localPt = new Point(x - pathOffset.x, y - pathOffset.y);
        const worldPt = util.transformPoint(localPt, matrix);
        const dist = Math.hypot(worldPt.x - point.x, worldPt.y - point.y);

        if (dist <= radius) {
          hasErasedAny = true;
          isDrawingSubpath = false; // Break line here
        } else {
          if (!isDrawingSubpath) {
            newCommands.push(['M', x, y]);
            isDrawingSubpath = true;
          } else {
            newCommands.push(cmd);
          }
        }
      }

      if (hasErasedAny) {
        hasMutated = true;
        if (newCommands.length < 2) {
          // Entire stroke erased
          this.canvas.remove(pathObj);
        } else {
          // Update path with surviving sub-paths
          pathObj.set('path', newCommands);
          pathObj.setCoords();
          pathObj.dirty = true;
        }
      }
    }

    if (hasMutated) {
      this.canvas.requestRenderAll();
      this.notifyObjects();
      this.notifySelectionBounds();
      this.saveHistorySnapshot();
    }
  }

  private setupEventListeners() {
    const canvas = this.canvas;
    if (!canvas) return;

    // 1. Mouse Wheel Zoom
    canvas.on('mouse:wheel', (opt) => {
      const e = opt.e;
      let zoom = getZoomLevel(canvas);
      zoom = clampZoom(zoom * Math.pow(0.999, e.deltaY));
      canvas.zoomToPoint(new Point(e.offsetX, e.offsetY), zoom);
      this.notifyZoom(zoom);
      this.notifySelectionBounds();
      e.preventDefault();
      e.stopPropagation();
    });

    // Helper to get client coordinates
    const getPointerClientXY = (e: any) => {
      if ('clientX' in e && typeof e.clientX === 'number') {
        return { clientX: e.clientX, clientY: e.clientY };
      }
      const touch = e.touches?.[0] || e.changedTouches?.[0];
      return {
        clientX: touch ? touch.clientX : 0,
        clientY: touch ? touch.clientY : 0,
      };
    };

    // 2. Mouse Move: coordinates, pan tracking & sweep eraser
    canvas.on('mouse:move', (opt) => {
      const point = getWorldPointer(canvas, opt.e);
      this.notifyCoordinates(point);

      if (this.isPanning) {
        const { clientX, clientY } = getPointerClientXY(opt.e);
        const dx = clientX - this.lastPanClientX;
        const dy = clientY - this.lastPanClientY;
        const vpt = canvas.viewportTransform;
        vpt[4] += dx;
        vpt[5] += dy;
        this.lastPanClientX = clientX;
        this.lastPanClientY = clientY;
        canvas.setViewportTransform(vpt);
        canvas.requestRenderAll();
        this.notifySelectionBounds();
        return;
      }

      if (
        this.currentTool === 'eraser' &&
        this.isErasing &&
        this.brushSettings.eraserMode === 'sweep'
      ) {
        const last = this.lastEraserPoint;
        const steps = last
          ? Math.max(
              1,
              Math.ceil(
                Math.hypot(point.x - last.x, point.y - last.y) /
                  Math.max(4, this.brushSettings.eraserWidth / 2)
              )
            )
          : 1;
        for (let i = 1; i <= steps; i++) {
          const p = last
            ? {
                x: last.x + ((point.x - last.x) * i) / steps,
                y: last.y + ((point.y - last.y) * i) / steps,
              }
            : point;
          this.eraseSweepAt(p);
        }
        this.lastEraserPoint = point;
      }
    });

    // 3. Mouse Down: Tool creation, Panning & Eraser
    canvas.on('mouse:down', async (opt) => {
      const e = opt.e;
      const target = opt.target;
      const point = getWorldPointer(canvas, e);

      // If active sticky editor is open and clicked elsewhere, conclude editing
      if (this.activeStickyEditor && target !== this.activeStickyEditor.tempBox) {
        this.activeStickyEditor.exitHandler();
      }

      // Panning trigger
      if (this.currentTool === 'pan' || this.isSpacePressed) {
        const { clientX, clientY } = getPointerClientXY(e);
        this.isPanning = true;
        this.lastPanClientX = clientX;
        this.lastPanClientY = clientY;
        canvas.discardActiveObject();
        canvas.defaultCursor = 'grabbing';
        canvas.requestRenderAll();
        this.notifySelectionBounds();
        return;
      }

      // Eraser trigger
      if (this.currentTool === 'eraser') {
        if (this.brushSettings.eraserMode === 'whole') {
          this.eraseWholeStrokeAt(point);
        } else {
          this.isErasing = true;
          this.lastEraserPoint = point;
          this.eraseSweepAt(point);
        }
        return;
      }

      // If user clicked on an existing object, let Fabric handle selection
      if (target) {
        if ((target as any).isPixelForgeSticky || (target as any).stickyNoteData) {
          if (opt.subTargets && opt.subTargets.length > 0) {
            const { allTexts } = getStickyTextChildren(target);
            const sub = opt.subTargets.find((s: any) => allTexts.includes(s));
            (target as any)._activeSubTarget = sub || null;
          } else {
            (target as any)._activeSubTarget = null;
          }
          this.notifySelection(target);
        }
        this.notifySelectionBounds();
        return;
      }

      // Click on canvas background:
      if (this.currentTool === 'text') {
        const textObj = new Textbox('Type something...', {
          left: point.x,
          top: point.y,
          width: 260,
          fontFamily: this.textSettings.fontFamily || 'Arial',
          fontSize: this.textSettings.fontSize || 24,
          fill: this.textSettings.fill || '#302633',
          fontWeight: this.textSettings.bold ? 'bold' : 'normal',
          fontStyle: this.textSettings.italic ? 'italic' : 'normal',
          underline: Boolean(this.textSettings.underline),
          textAlign: this.textSettings.textAlign || 'left',
          backgroundColor: this.textSettings.backgroundColor === 'transparent' ? '' : this.textSettings.backgroundColor,
          lineHeight: this.textSettings.lineHeight || 1.2,
          editable: true,
          splitByGrapheme: true,
          objectCaching: false,
          padding: 4,
        });
        (textObj as any).id = `text-${Date.now()}`;
        (textObj as any).name = 'Text Box';
        (textObj as any).isPixelForgeText = true;
        (textObj as any).pixelForgeObjectType = 'text';

        canvas.add(textObj);
        canvas.setActiveObject(textObj);
        textObj.enterEditing();
        textObj.selectAll();
        this.setTool('select');
        this.notifyObjects();
        this.notifySelection(textObj);
        this.notifySelectionBounds();
        this.saveHistorySnapshot();
        return;
      }

      if (this.currentTool === 'sticky') {
        await this.createStickyNoteAt({
          template: this.selectedStickyTemplate,
          x: point.x,
          y: point.y,
        });
        return;
      }

      // Shape placement
      const shapeTools: ShapeSubtype[] = [
        'rectangle',
        'rounded-rectangle',
        'circle',
        'ellipse',
        'diamond',
        'triangle',
        'line',
        'arrow',
      ];

      if (shapeTools.includes(this.currentTool as ShapeSubtype)) {
        this.createShapeAtPoint(this.currentTool as ShapeSubtype, point);
        this.setTool('select');
        this.saveHistorySnapshot();
      }
    });

    // 4. Mouse Up
    canvas.on('mouse:up', () => {
      this.isPanning = false;
      this.isErasing = false;
      this.lastEraserPoint = null;

      if (this.currentTool === 'pan' || this.isSpacePressed) {
        canvas.defaultCursor = 'grab';
      } else {
        canvas.defaultCursor =
          this.currentTool === 'text'
            ? 'text'
            : this.currentTool === 'brush' || this.currentTool === 'highlighter'
            ? 'crosshair'
            : this.currentTool === 'eraser'
            ? 'cell'
            : 'default';
      }
      this.notifySelectionBounds();
    });

    // 5. Double Click on Text or Sticky Note
    canvas.on('mouse:dblclick', (opt) => {
      const target = opt.target;
      if (!target) return;

      // Case A: Standalone Textbox
      if (
        ((target as any).isPixelForgeText || target.type === 'textbox') &&
        typeof (target as any).enterEditing === 'function'
      ) {
        canvas.setActiveObject(target);
        (target as any).enterEditing();
        (target as any).selectAll();
        canvas.requestRenderAll();
        this.notifySelection(target);
        this.notifySelectionBounds();
        return;
      }

      // Case B: Sticky Note Group
      if ((target as any).isPixelForgeSticky || (target as any).stickyNoteData) {
        // Exit any active editor first
        if (this.activeStickyEditor) {
          this.activeStickyEditor.exitHandler();
        }

        const { headerText, bodyText, allTexts } = getStickyTextChildren(target);
        if (allTexts.length === 0) return;

        let targetChild = headerText;
        if (opt.subTargets && opt.subTargets.length > 0) {
          const sub = opt.subTargets.find((s: any) => allTexts.includes(s));
          if (sub) targetChild = sub;
        } else {
          // Check pointer Y against group midpoint
          const pointer = getWorldPointer(canvas, opt.e);
          const top = target.top || 0;
          const height = (target.height || 200) * (target.scaleY || 1);
          const boundary = top + height * 0.38;
          if (pointer.y >= boundary && bodyText) {
            targetChild = bodyText;
          }
        }
        if (!targetChild) targetChild = allTexts[0];

        const matrix = target.calcTransformMatrix();
        const worldPt = util.transformPoint(new Point(targetChild.left, targetChild.top), matrix);
        const scaleX = target.scaleX || 1;
        const scaleY = target.scaleY || 1;

        // Hide child inside group
        targetChild.set('visible', false);
        target.dirty = true;

        const tempBox = new Textbox(targetChild.text || '', {
          left: worldPt.x,
          top: worldPt.y,
          width: Math.max(60, (targetChild.width || 200) * scaleX),
          fontFamily: targetChild.fontFamily || 'Arial',
          fontSize: (targetChild.fontSize || 18) * scaleY,
          fontWeight: targetChild.fontWeight || 'normal',
          fontStyle: targetChild.fontStyle || 'normal',
          underline: Boolean(targetChild.underline),
          fill: targetChild.fill || '#252525',
          textAlign: targetChild.textAlign || 'left',
          lineHeight: targetChild.lineHeight || 1.2,
          editable: true,
          splitByGrapheme: true,
          objectCaching: false,
          padding: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
        });
        (tempBox as any).isTempStickyEditor = true;
        (tempBox as any).isPixelForgeText = true;
        (tempBox as any).id = `temp-sticky-editor-${Date.now()}`;

        const exitHandler = () => {
          if (!this.activeStickyEditor) return;
          tempBox.off('editing:exited', exitHandler);
          const newText = tempBox.text || '';
          targetChild.set({
            text: newText,
            fontFamily: tempBox.fontFamily,
            fontSize: tempBox.fontSize / scaleY,
            fontWeight: tempBox.fontWeight,
            fontStyle: tempBox.fontStyle,
            underline: tempBox.underline,
            fill: tempBox.fill,
            textAlign: tempBox.textAlign,
            lineHeight: tempBox.lineHeight,
            visible: true,
          });
          targetChild.dirty = true;
          if (typeof targetChild.initDimensions === 'function') targetChild.initDimensions();

          const noteGroup = target as any;
          if (noteGroup.stickyNoteData) {
            if (targetChild.stickyPart === 'header') {
              noteGroup.stickyNoteData.header = newText;
              noteGroup.stickyNoteData.headerFont = tempBox.fontFamily;
              noteGroup.stickyNoteData.headerColor = tempBox.fill;
            } else {
              noteGroup.stickyNoteData.body = newText;
              noteGroup.stickyNoteData.bodyFont = tempBox.fontFamily;
              noteGroup.stickyNoteData.bodyColor = tempBox.fill;
            }
          }
          noteGroup.dirty = true;
          canvas.remove(tempBox);
          this.activeStickyEditor = null;
          canvas.setActiveObject(noteGroup);
          canvas.requestRenderAll();
          this.notifyObjects();
          this.notifySelection(target);
          this.notifySelectionBounds();
          this.saveHistorySnapshot();
        };

        tempBox.on('editing:exited', exitHandler);
        this.activeStickyEditor = { tempBox, parentGroup: target, targetChild, exitHandler };

        canvas.add(tempBox);
        canvas.setActiveObject(tempBox);
        tempBox.enterEditing();
        tempBox.selectAll();
        canvas.requestRenderAll();
        this.notifyObjects();
        this.notifySelection(tempBox);
        this.notifySelectionBounds();
      }
    });

    // 6. Path Created (Drawings & Highlighter)
    canvas.on('path:created', (opt: any) => {
      if (!opt.path) return;
      const path = opt.path;
      path.isPixelForgeStroke = true;
      path.pixelForgeObjectType = 'stroke';
      path.brushKind = this.currentTool === 'highlighter' ? 'highlighter' : this.brushSettings.kind || 'pen';
      path.brushColor =
        this.currentTool === 'highlighter'
          ? this.brushSettings.highlighterColor
          : this.brushSettings.color;
      path.brushWidth =
        this.currentTool === 'highlighter'
          ? Math.max(this.brushSettings.width, 18)
          : this.brushSettings.width;
      path.brushOpacity =
        this.currentTool === 'highlighter' ? 0.3 : this.brushSettings.opacity;
      path.pressureEnabled = this.brushSettings.pressureEnabled;

      if (this.currentTool === 'highlighter') {
        path.set({
          stroke: colorWithAlpha(this.brushSettings.highlighterColor, 0.3),
          opacity: 1,
          objectCaching: false,
        });
        path.dirty = true;
      } else {
        path.set({
          stroke: this.brushSettings.color,
          opacity: this.brushSettings.opacity ?? 1,
          strokeLineCap: this.brushSettings.kind === 'calligraphy' ? 'square' : 'round',
          strokeDashArray: this.brushSettings.kind === 'pencil' ? [1, 1.8] : null,
        });
        path.dirty = true;
      }

      path.selectable = true;
      path.evented = true;
      (path as any).id = `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      (path as any).name = path.brushKind === 'highlighter' ? 'Highlighter' : 'Brush Stroke';
      this.notifyObjects();
      this.saveHistorySnapshot();
    });

    // Track active selection in text for toolbar formatting
    canvas.on('text:selection:changed', (opt: any) => {
      const target = opt.target as any;
      if (target && target.selectionStart !== undefined && target.selectionEnd !== undefined) {
        target._lastSelectionStart = target.selectionStart;
        target._lastSelectionEnd = target.selectionEnd;
      }
    });

    // 7. Grid Snapping on Object Move & Transform Bounds Notification
    canvas.on('object:moving', (opt) => {
      const obj = opt.target;
      if (!obj) return;
      if (this.isGridSnap) {
        const grid = 24;
        obj.set({
          left: Math.round((obj.left || 0) / grid) * grid,
          top: Math.round((obj.top || 0) / grid) * grid,
        });
        obj.setCoords();
      }
      this.notifySelectionBounds();
    });

    canvas.on('object:scaling', () => this.notifySelectionBounds());
    canvas.on('object:rotating', () => this.notifySelectionBounds());

    // 8. Selection Tracking
    const onSelection = (opt: any) => {
      const activeObj = canvas.getActiveObject() || null;
      const selected = activeObj || opt.selected?.[0] || null;
      this.notifySelection(selected);
      this.notifySelectionBounds();
    };

    canvas.on('selection:created', onSelection);
    canvas.on('selection:updated', onSelection);
    canvas.on('selection:cleared', () => {
      this.notifySelection(null);
      this.notifySelectionBounds();
    });
    canvas.on('object:modified', () => {
      onSelection({});
      this.notifyObjects();
      this.notifySelectionBounds();
      this.saveHistorySnapshot();
    });
    canvas.on('object:added', () => this.notifyObjects());
    canvas.on('object:removed', () => {
      this.notifyObjects();
      this.notifySelection(canvas.getActiveObject() || null);
      this.notifySelectionBounds();
    });

    // 9. Spacebar listener for temporary pan
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && canvas.upperCanvasEl?.matches(':hover')) {
        const activeObj = canvas.getActiveObject() as any;
        if (
          activeObj?.isEditing ||
          ['INPUT', 'TEXTAREA', 'SELECT'].includes(
            (document.activeElement as any)?.tagName
          )
        ) {
          return;
        }
        e.preventDefault();
        this.isSpacePressed = true;
        canvas.defaultCursor = 'grab';
        canvas.selection = false;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        this.isSpacePressed = false;
        this.isPanning = false;
        this.applyToolToCanvas(this.currentTool);
        this.notifySelectionBounds();
      }
    };

    const handleResize = () => {
      this.notifySelectionBounds();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('resize', handleResize);
    this.windowKeydownHandler = handleKeyDown;
    this.windowKeyupHandler = handleKeyUp;
    this.windowResizeHandler = handleResize;
  }

  public createShapeAtPoint(shape: ShapeSubtype, point: { x: number; y: number }) {
    if (!this.canvas) return;
    let shapeObj: FabricObject | null = null;
    const stroke = (this.defaultShapeConfig.strokeColor === 'transparent' || this.defaultShapeConfig.strokeColor === 'none')
      ? 'transparent'
      : (this.defaultShapeConfig.strokeColor || '#F26B5B');
    const fill =
      (this.defaultShapeConfig.fillColor === 'transparent' || !this.defaultShapeConfig.fillColor || this.defaultShapeConfig.fillColor === 'none')
        ? 'transparent'
        : (this.defaultShapeConfig.fillColor || '#EEF2FF');
    const strokeWidth = this.defaultShapeConfig.strokeWidth !== undefined ? Math.max(0, this.defaultShapeConfig.strokeWidth) : 2;

    switch (shape) {
      case 'circle':
        shapeObj = new Circle({
          left: point.x - 60,
          top: point.y - 60,
          radius: 60,
          fill,
          stroke,
          strokeWidth,
        });
        break;
      case 'ellipse':
        shapeObj = new Circle({
          left: point.x - 75,
          top: point.y - 50,
          radius: 50,
          scaleX: 1.5,
          fill,
          stroke,
          strokeWidth,
        });
        break;
      case 'rounded-rectangle':
        shapeObj = new Rect({
          left: point.x - 100,
          top: point.y - 60,
          width: 200,
          height: 120,
          rx: 16,
          ry: 16,
          fill,
          stroke,
          strokeWidth,
        });
        break;
      case 'triangle':
        shapeObj = new Triangle({
          left: point.x - 70,
          top: point.y - 60,
          width: 140,
          height: 120,
          fill,
          stroke,
          strokeWidth,
        });
        break;
      case 'diamond':
        shapeObj = new Polygon(
          [
            { x: 75, y: 0 },
            { x: 150, y: 65 },
            { x: 75, y: 130 },
            { x: 0, y: 65 },
          ],
          {
            left: point.x - 75,
            top: point.y - 65,
            fill,
            stroke,
            strokeWidth,
          }
        );
        break;
      case 'line':
        shapeObj = new Line([point.x - 80, point.y, point.x + 80, point.y], {
          stroke,
          strokeWidth,
        });
        break;
      case 'arrow': {
        const line = new Line([0, 0, 140, 0], {
          stroke,
          strokeWidth,
        });
        const head = new Triangle({
          left: 140,
          top: -8,
          width: 16,
          height: 16,
          angle: 90,
          fill: stroke,
        });
        shapeObj = new Group([line, head], {
          left: point.x - 75,
          top: point.y - 8,
        });
        break;
      }
      case 'rectangle':
      default:
        shapeObj = new Rect({
          left: point.x - 100,
          top: point.y - 60,
          width: 200,
          height: 120,
          rx: 8,
          ry: 8,
          fill,
          stroke,
          strokeWidth,
        });
        break;
    }

    if (shapeObj) {
      (shapeObj as any).id = `shape-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      (shapeObj as any).name = `${shape.charAt(0).toUpperCase() + shape.slice(1)}`;
      (shapeObj as any).isPixelForgeShape = true;
      (shapeObj as any).pixelForgeObjectType = shape;
      this.canvas.add(shapeObj);
      this.canvas.setActiveObject(shapeObj);
      this.canvas.requestRenderAll();
      this.notifyObjects();
      this.notifySelection(shapeObj);
      this.notifySelectionBounds();
    }
  }

  private saveHistorySnapshot() {
    if (!this.canvas || this.isRestoringHistory) return;

    if (this.historyDebounceTimer) {
      window.clearTimeout(this.historyDebounceTimer);
    }

    this.historyDebounceTimer = window.setTimeout(() => {
      if (!this.canvas || this.isRestoringHistory) return;
      const json = JSON.stringify(this.canvas.toObject(EXTRA_PROPS));
      if (this.undoStack[this.undoStack.length - 1] !== json) {
        this.undoStack.push(json);
        if (this.undoStack.length > 80) this.undoStack.shift();
        this.redoStack = [];
        this.notifyUndoRedo();
      }
    }, 100);
  }

  private notifyReadiness() {
    for (const listener of this.readinessListeners) {
      listener(this.readiness);
    }
  }

  private notifyUndoRedo() {
    const caps = this.getUndoRedoCapabilities();
    for (const listener of this.undoRedoListeners) {
      listener(caps);
    }
  }

  private notifyZoom(zoom: number) {
    for (const listener of this.zoomListeners) {
      listener(zoom);
    }
  }

  private notifyCoordinates(coords: { x: number; y: number }) {
    for (const listener of this.coordinatesListeners) {
      listener(coords);
    }
  }

  private notifyActiveObject(obj: FabricObject | null) {
    for (const listener of this.activeObjectListeners) {
      listener(obj);
    }
  }
}

// Export singleton instance for seamless injection
export const globalFabricCanvasAdapter = new FabricCanvasAdapter();

/**
 * Seed initial sprint whiteboard objects onto the canvas.
 * Exactly 11 authentic interactive objects with zero overlap.
 * 2 Sticky Notes, 4 Shapes, 2 Text, 1 Drawing, 2 Arrows.
 */
export async function seedInitialSprintObjects(canvas: Canvas): Promise<void> {
  // Prevent duplicate seeding during React 19 remount or hot reloads
  if (canvas.getObjects().length > 0) {
    return;
  }

  // 1. Sticky Note 1: Sprint Focus (Sunny Fold)
  try {
    const note1 = await createStickyNote({
      template: 'sunny',
      header: '⚡ Sprint Focus',
      body: '• Infinite Canvas Shell\n• Fabric.js Engine Mount\n• Realtime Socket Sync',
      left: 140,
      top: 110,
      width: 260,
      height: 180,
    });
    (note1 as any).id = 'mock-sticky-1';
    (note1 as any).name = 'Sprint Focus';
    canvas.add(note1);
  } catch (err) {
    console.warn('Failed to seed note1:', err);
  }

  // 2. Sticky Note 2: Backlog Tasks (Botanical Green)
  try {
    const note2 = await createStickyNote({
      template: 'botanical',
      header: '🌱 Backlog Tasks',
      body: '• Vector anchor snapping\n• Multi-cursor interpolation\n• Export SVG / PNG vectors',
      left: 140,
      top: 320,
      width: 260,
      height: 180,
    });
    (note2 as any).id = 'mock-sticky-2';
    (note2 as any).name = 'Backlog Tasks';
    canvas.add(note2);
  } catch (err) {
    console.warn('Failed to seed note2:', err);
  }

  // 3. Title Text: Webster Sprint Canvas
  const titleText = new Textbox('Webster Sprint Canvas', {
    left: 480,
    top: 50,
    width: 320,
    fontSize: 22,
    fontFamily: 'Arial',
    fontWeight: 'bold',
    fill: '#1E293B',
    editable: true,
  });
  (titleText as any).id = 'mock-text-1';
  (titleText as any).name = 'Webster Sprint Canvas';
  (titleText as any).isPixelForgeText = true;
  (titleText as any).pixelForgeObjectType = 'text';
  canvas.add(titleText);

  // 4. Subtitle Text: System Architecture Flow
  const subtitleText = new Textbox('System Architecture Flow', {
    left: 480,
    top: 85,
    width: 260,
    fontSize: 14,
    fontFamily: 'Arial',
    fill: '#64748B',
    editable: true,
  });
  (subtitleText as any).id = 'mock-text-2';
  (subtitleText as any).name = 'System Architecture Flow';
  (subtitleText as any).isPixelForgeText = true;
  (subtitleText as any).pixelForgeObjectType = 'text';
  canvas.add(subtitleText);

  // 5. Shape 1: Frontend (Circle)
  const circle1 = new Circle({
    left: 480,
    top: 140,
    radius: 45,
    fill: '#EEF2FF',
    stroke: '#6366F1',
    strokeWidth: 2,
  });
  (circle1 as any).id = 'mock-circle-1';
  (circle1 as any).name = 'Frontend';
  (circle1 as any).isPixelForgeShape = true;
  (circle1 as any).pixelForgeObjectType = 'circle';
  canvas.add(circle1);

  // 6. Arrow 1: Frontend -> API
  const line1 = new Line([580, 185, 638, 185], { stroke: '#6366F1', strokeWidth: 2 });
  const arrowHead1 = new Triangle({ left: 632, top: 178, width: 14, height: 14, angle: 90, fill: '#6366F1' });
  const arrow1 = new Group([line1, arrowHead1], { selectable: true });
  (arrow1 as any).id = 'mock-arrow-1';
  (arrow1 as any).name = 'Arrow 1';
  (arrow1 as any).pixelForgeObjectType = 'arrow';
  canvas.add(arrow1);

  // 7. Shape 2: API (Diamond)
  const diamond1 = new Polygon(
    [
      { x: 50, y: 0 },
      { x: 100, y: 45 },
      { x: 50, y: 90 },
      { x: 0, y: 45 },
    ],
    {
      left: 655,
      top: 140,
      fill: '#EDE9FE',
      stroke: '#8B5CF6',
      strokeWidth: 2,
    }
  );
  (diamond1 as any).id = 'mock-diamond-1';
  (diamond1 as any).name = 'API';
  (diamond1 as any).isPixelForgeShape = true;
  (diamond1 as any).pixelForgeObjectType = 'diamond';
  canvas.add(diamond1);

  // 8. Arrow 2: API -> Database
  const line2 = new Line([765, 185, 818, 185], { stroke: '#8B5CF6', strokeWidth: 2 });
  const arrowHead2 = new Triangle({ left: 812, top: 178, width: 14, height: 14, angle: 90, fill: '#8B5CF6' });
  const arrow2 = new Group([line2, arrowHead2], { selectable: true });
  (arrow2 as any).id = 'mock-arrow-2';
  (arrow2 as any).name = 'Arrow 2';
  (arrow2 as any).pixelForgeObjectType = 'arrow';
  canvas.add(arrow2);

  // 9. Shape 3: Database (Rounded Rectangle)
  const rect2 = new Rect({
    left: 835,
    top: 145,
    width: 125,
    height: 80,
    rx: 10,
    ry: 10,
    fill: '#ECFDF5',
    stroke: '#10B981',
    strokeWidth: 2,
  });
  (rect2 as any).id = 'mock-rect-2';
  (rect2 as any).name = 'Database';
  (rect2 as any).isPixelForgeShape = true;
  (rect2 as any).pixelForgeObjectType = 'rectangle';
  canvas.add(rect2);

  // 10. Shape 4: Architecture Blueprint (Main Rectangle)
  const rect1 = new Rect({
    left: 480,
    top: 260,
    width: 480,
    height: 125,
    rx: 12,
    ry: 12,
    fill: '#EDE9FE',
    stroke: '#8B5CF6',
    strokeWidth: 2,
  });
  (rect1 as any).id = 'mock-rect-1';
  (rect1 as any).name = 'Architecture Blueprint';
  (rect1 as any).isPixelForgeShape = true;
  (rect1 as any).pixelForgeObjectType = 'rectangle';
  canvas.add(rect1);

  // 11. Drawing 1: Freehand Vector Sketch 1
  const sketchPath = new Path('M 480 420 Q 560 390 640 420 T 800 420 T 960 410', {
    stroke: '#6366F1',
    strokeWidth: 3,
    fill: 'transparent',
    opacity: 0.85,
    selectable: true,
  });
  (sketchPath as any).id = 'mock-brush-1';
  (sketchPath as any).name = 'Vector Sketch 1';
  (sketchPath as any).isPixelForgeStroke = true;
  (sketchPath as any).pixelForgeObjectType = 'brush';
  (sketchPath as any).brushKind = 'pen';
  canvas.add(sketchPath);

  canvas.requestRenderAll();
  globalFabricCanvasAdapter.notifyObjects();
}
