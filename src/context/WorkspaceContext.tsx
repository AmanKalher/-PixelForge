import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import {
  ToolType,
  ShapeSubtype,
  StyleConfig,
  CanvasObject,
  ConnectionStatus,
  Collaborator,
  UndoRedoCapabilities,
  EngineReadinessState,
  ExportOptions,
  ExportResult,
  BrushSettings,
  TextFormattingSettings,
} from '../types/whiteboard';
import { CanvasEngineContract, CollaborationClientContract } from '../types/contracts';
import { MockCanvasAdapter } from '../adapters/mockCanvasAdapter';
import { MockCollabAdapter } from '../adapters/mockCollabAdapter';
import { globalFabricCanvasAdapter } from '../engine/fabricCanvasAdapter';
import {
  DEFAULT_STYLE_CONFIG,
  MOCK_COLLABORATORS,
} from '../mocks/demoData';

export interface GuestUserInfo {
  name: string;
  color: string;
  hasEntered: boolean;
}

export interface SimulationSettings {
  simulatedStatus: ConnectionStatus;
  showDemoCollaborators: boolean;
  isEmptyBoard: boolean;
  isErrorState: boolean;
}

export interface WorkspaceContextValue {
  // User & Board State
  guestUser: GuestUserInfo;
  setGuestUser: (user: Partial<GuestUserInfo>) => void;
  boardTitle: string;
  setBoardTitle: (title: string) => void;

  // Active Tool & Shapes
  activeTool: ToolType;
  activeShape: ShapeSubtype;
  setActiveTool: (tool: ToolType) => void;
  setActiveShape: (shape: ShapeSubtype) => void;
  styleConfig: StyleConfig;
  updateStyle: (style: Partial<StyleConfig>) => void;

  // Canvas Settings & State
  isGridSnapEnabled: boolean;
  toggleGridSnap: () => void;
  zoom: number;
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  pan: { x: number; y: number };
  setPan: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  updateObjectPosition: (id: string, x: number, y: number, commitToHistory: boolean) => void;
  updateObjectBounds: (id: string, bounds: Partial<CanvasObject>, commitToHistory: boolean) => void;
  pointerCoords: { x: number; y: number };
  setPointerCoords: (coords: { x: number; y: number }) => void;

  // Engine Capabilities
  engineReadiness: EngineReadinessState;
  undoRedoCapabilities: UndoRedoCapabilities;
  undo: () => void;
  redo: () => void;
  deleteSelected: () => void;
  duplicateSelected: () => void;
  bringForwardSelected: () => void;
  sendBackwardSelected: () => void;

  // Brush Studio & Sticky Gallery
  brushSettings: BrushSettings;
  updateBrushSettings: (settings: Partial<BrushSettings>) => void;
  selectedStickyTemplate: string;
  setSelectedStickyTemplate: (template: string) => void;
  isStickyGalleryOpen: boolean;
  setIsStickyGalleryOpen: (open: boolean) => void;
  isBrushStudioOpen: boolean;
  setIsBrushStudioOpen: (open: boolean) => void;
  applyTextStyle: (style: Partial<TextFormattingSettings>) => void;
  highlightSelectedText: (color?: string) => void;
  highlightWholeText: (color?: string) => void;
  changeStickyTemplate: (templateKey: string) => void;
  loadDemoFixtures: () => void;

  // Preview Mode & Mock Selection
  isUIPreviewMode: boolean;
  toggleUIPreviewMode: () => void;
  selectedCanvasObject: CanvasObject | null;
  selectedMockObjectId: string | null;
  hasActiveObject: boolean;
  setSelectedMockObjectId: (id: string | null) => void;
  mockObjects: CanvasObject[];
  createMockObject: (type?: ToolType, position?: { x: number; y: number }, customProps?: Partial<CanvasObject>) => CanvasObject;
  updateObjectText: (id: string, text: string) => void;
  editingObjectId: string | null;
  setEditingObjectId: (id: string | null) => void;

  // Collaboration State
  connectionStatus: ConnectionStatus;
  collaborators: Collaborator[];

  // Modals & Panels Visibility
  isGuestModalOpen: boolean;
  setIsGuestModalOpen: (open: boolean) => void;
  isExportModalOpen: boolean;
  setIsExportModalOpen: (open: boolean) => void;
  isShareModalOpen: boolean;
  setIsShareModalOpen: (open: boolean) => void;
  isSimulationDrawerOpen: boolean;
  setIsSimulationDrawerOpen: (open: boolean) => void;
  isHistoryModalOpen: boolean;
  setIsHistoryModalOpen: (open: boolean) => void;
  isMinimapOpen: boolean;
  toggleMinimap: () => void;
  isLayersPanelOpen: boolean;
  toggleLayersPanel: () => void;
  updateObjectProperties: (id: string, updates: Partial<CanvasObject>) => void;
  toggleObjectVisibility: (id: string) => void;
  isShapesPopoverOpen: boolean;
  setIsShapesPopoverOpen: (open: boolean) => void;

  // Simulation controls
  simulationSettings: SimulationSettings;
  updateSimulatedStatus: (status: ConnectionStatus) => void;
  toggleDemoCollaborators: (show?: boolean) => void;
  setSimulatedCollaboratorCount: (count: number) => void;
  toggleEmptyBoard: (empty?: boolean) => void;
  toggleErrorState: (error?: boolean) => void;

  // Actions
  exportCanvas: (options: ExportOptions) => Promise<ExportResult>;

  // Selection Screen Bounds for dynamic floating contextual bar
  selectionScreenBounds: { left: number; top: number; width: number; height: number } | null;

  // Underlying Adapters
  canvasEngine: CanvasEngineContract;
  collabClient: CollaborationClientContract;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

// Default singleton fallback adapters for clean dependency injection
export const defaultMockCanvasAdapter = new MockCanvasAdapter();
const defaultMockCollabAdapter = new MockCollabAdapter();

const getInitialGuestUser = (): GuestUserInfo => {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      const saved = sessionStorage.getItem('pixelforge_guest_session');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.name === 'string' && parsed.name.trim().length > 0 && parsed.hasEntered) {
          return {
            name: parsed.name,
            color: parsed.color || '#F26B5B',
            hasEntered: true,
          };
        }
      }
    }
  } catch {
    // sessionStorage fallback
  }
  return {
    name: '',
    color: '#F26B5B',
    hasEntered: false,
  };
};

interface WorkspaceProviderProps {
  children: React.ReactNode;
  canvasEngine?: CanvasEngineContract;
  collabClient?: CollaborationClientContract;
}

export const WorkspaceProvider: React.FC<WorkspaceProviderProps> = ({
  children,
  canvasEngine = globalFabricCanvasAdapter,
  collabClient = defaultMockCollabAdapter,
}) => {
  // Guest Identity
  const [guestUser, setGuestUserState] = useState<GuestUserInfo>(getInitialGuestUser);

  // Board Title
  const [boardTitle, setBoardTitle] = useState<string>('Untitled Board');

  // Active Tool & Shapes
  const [activeTool, setActiveToolState] = useState<ToolType>('select');
  const [activeShape, setActiveShapeState] = useState<ShapeSubtype>('rectangle');
  const [isShapesPopoverOpen, setIsShapesPopoverOpen] = useState<boolean>(false);

  // Styling state
  const [styleConfig, setStyleConfig] = useState<StyleConfig>(DEFAULT_STYLE_CONFIG);

  // Viewport & Grid
  const [isGridSnapEnabled, setIsGridSnapEnabled] = useState<boolean>(true);
  const [zoom, setZoomState] = useState<number>(1.0);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [pointerCoords, setPointerCoords] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Engine state subscriptions
  const [engineReadiness, setEngineReadiness] = useState<EngineReadinessState>('ready');
  const [engineUndoRedo, setEngineUndoRedo] = useState<UndoRedoCapabilities>({
    canUndo: false,
    canRedo: false,
  });

  // Preview Mode & Mock Selection (false defaults to real Fabric.js canvas engine)
  const [isUIPreviewMode, setIsUIPreviewMode] = useState<boolean>(false);
  const [selectedCanvasObject, setSelectedCanvasObject] = useState<CanvasObject | null>(null);
  const [selectedMockObjectId, setSelectedMockObjectIdState] = useState<string | null>(null);
  const [hasActiveFabricObject, setHasActiveFabricObject] = useState<boolean>(false);
  const [selectionScreenBounds, setSelectionScreenBounds] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);
  const [fabricObjects, setFabricObjects] = useState<CanvasObject[]>([]);

  // =========================================================================
  // FUNCTIONAL IMMUTABLE HISTORY ENGINE (Undo / Redo for Mock Preview Objects)
  // =========================================================================
  const [history, setHistory] = useState<{
    past: CanvasObject[][];
    present: CanvasObject[];
    future: CanvasObject[][];
  }>({
    past: [],
    present: [],
    future: [],
  });

  // Derived mockObjects: uses live Fabric objects when in real engine mode
  const mockObjects = useMemo(() => {
    if (isUIPreviewMode) return history.present;
    if (engineReadiness === 'ready') return fabricObjects;
    return history.present;
  }, [isUIPreviewMode, engineReadiness, fabricObjects, history.present]);

  // Dynamically compute undo/redo capabilities based on mode and history stack
  const undoRedoCapabilities = useMemo<UndoRedoCapabilities>(() => {
    if (!isUIPreviewMode) {
      return engineUndoRedo;
    }
    return {
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
    };
  }, [isUIPreviewMode, engineUndoRedo, history.past.length, history.future.length]);

  // Keep a ref to latest history for callbacks
  const historyRef = useRef(history);
  historyRef.current = history;

  // Helper to commit immutable snapshot (ignores no-ops)
  const commitSnapshot = useCallback((newObjects: CanvasObject[], newSelectionId?: string | null) => {
    setHistory((prev) => {
      // No-op check: compare JSON of present and newObjects
      const presentJson = JSON.stringify(prev.present);
      const newJson = JSON.stringify(newObjects);
      if (presentJson === newJson) {
        return prev;
      }

      // Max history length: 50 states
      const trimmedPast = prev.past.length >= 50 ? prev.past.slice(1) : prev.past;

      return {
        past: [...trimmedPast, prev.present],
        present: newObjects,
        future: [], // New mutation clears redo stack
      };
    });

    if (newSelectionId !== undefined) {
      setSelectedMockObjectIdState(newSelectionId);
    }
  }, []);

  // Undo Handler
  const undo = useCallback(() => {
    canvasEngine.undo();

    if (isUIPreviewMode) {
      const current = historyRef.current;
      if (current.past.length === 0) return;

      const previous = current.past[current.past.length - 1];
      const newPast = current.past.slice(0, current.past.length - 1);

      setHistory({
        past: newPast,
        present: previous,
        future: [current.present, ...current.future],
      });

      setSelectedMockObjectIdState((prevId) => {
        if (prevId && previous.some((o) => o.id === prevId)) {
          return prevId;
        }
        return null;
      });
      setEditingObjectId(null);
    }
  }, [canvasEngine, isUIPreviewMode]);

  // Redo Handler
  const redo = useCallback(() => {
    canvasEngine.redo();

    if (isUIPreviewMode) {
      const current = historyRef.current;
      if (current.future.length === 0) return;

      const next = current.future[0];
      const newFuture = current.future.slice(1);

      setHistory({
        past: [...current.past, current.present],
        present: next,
        future: newFuture,
      });

      setSelectedMockObjectIdState((prevId) => {
        if (prevId && next.some((o) => o.id === prevId)) {
          return prevId;
        }
        return null;
      });
      setEditingObjectId(null);
    }
  }, [canvasEngine, isUIPreviewMode]);

  // Collaboration state subscriptions
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('connected');
  const [collaborators, setCollaborators] = useState<Collaborator[]>(MOCK_COLLABORATORS);

  // Modals & Panels
  const [isGuestModalOpen, setIsGuestModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [isSimulationDrawerOpen, setIsSimulationDrawerOpen] = useState<boolean>(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState<boolean>(false);
  const [isMinimapOpen, setIsMinimapOpen] = useState<boolean>(true);
  const [isLayersPanelOpen, setIsLayersPanelOpen] = useState<boolean>(true);
  const [isStickyGalleryOpen, setIsStickyGalleryOpen] = useState<boolean>(false);
  const [isBrushStudioOpen, setIsBrushStudioOpen] = useState<boolean>(false);

  // Brush Studio & Sticky Template State
  const [brushSettings, setBrushSettingsState] = useState<BrushSettings>({
    kind: 'pen',
    color: '#252525',
    width: 4,
    opacity: 1,
    pressureEnabled: true,
    highlighterColor: '#FDE047',
    eraserMode: 'sweep',
    eraserWidth: 22,
  });

  const updateBrushSettings = useCallback(
    (patch: Partial<BrushSettings>) => {
      setBrushSettingsState((prev) => ({ ...prev, ...patch }));
      if (canvasEngine.setBrushSettings) {
        canvasEngine.setBrushSettings(patch);
      }
    },
    [canvasEngine]
  );

  const [selectedStickyTemplate, setSelectedStickyTemplateState] = useState<string>('sunny');
  const setSelectedStickyTemplate = useCallback(
    (template: string) => {
      setSelectedStickyTemplateState(template);
      if (canvasEngine.setStickyTemplate) {
        canvasEngine.setStickyTemplate(template);
      }
    },
    [canvasEngine]
  );

  const applyTextStyle = useCallback(
    (style: Partial<TextFormattingSettings>) => {
      if (canvasEngine.applyTextStyle) {
        canvasEngine.applyTextStyle(style);
      }
    },
    [canvasEngine]
  );

  const highlightSelectedText = useCallback(
    (color?: string) => {
      if (canvasEngine.highlightSelectedText) {
        canvasEngine.highlightSelectedText(color);
      }
    },
    [canvasEngine]
  );

  const highlightWholeText = useCallback(
    (color?: string) => {
      if (canvasEngine.highlightWholeText) {
        canvasEngine.highlightWholeText(color);
      }
    },
    [canvasEngine]
  );

  const changeStickyTemplate = useCallback(
    (templateKey: string) => {
      setSelectedStickyTemplateState(templateKey);
      if (canvasEngine.changeStickyTemplate) {
        canvasEngine.changeStickyTemplate(templateKey);
      }
    },
    [canvasEngine]
  );

  const loadDemoFixtures = useCallback(() => {
    if (canvasEngine.seedDemoContent) {
      canvasEngine.seedDemoContent();
    }
  }, [canvasEngine]);

  const sendBackwardSelected = useCallback(() => {
    if (canvasEngine.sendBackwardSelected) {
      canvasEngine.sendBackwardSelected();
    }
  }, [canvasEngine]);

  // Simulation settings
  const [simulationSettings, setSimulationSettings] = useState<SimulationSettings>({
    simulatedStatus: 'connected',
    showDemoCollaborators: true,
    isEmptyBoard: false,
    isErrorState: false,
  });

  // Subscribe to engine readiness, undo/redo, zoom, world coordinates, objects & selection events
  useEffect(() => {
    const unsubReadiness = canvasEngine.onReadinessChange(setEngineReadiness);
    const unsubUndoRedo = canvasEngine.onUndoRedoChange(setEngineUndoRedo);
    const unsubZoom = canvasEngine.onZoomChange(setZoomState);
    const unsubCoords = canvasEngine.onCoordinatesChange
      ? canvasEngine.onCoordinatesChange(setPointerCoords)
      : () => {};
    const unsubObjects = canvasEngine.onObjectsChange
      ? canvasEngine.onObjectsChange((objects) => {
          setFabricObjects(objects);
          setSelectedCanvasObject((prev) => {
            if (!prev) return null;
            const updated = objects.find((o) => o.id === prev.id);
            return updated || prev;
          });
        })
      : () => {};
    const unsubSelection = canvasEngine.onSelectionChange
      ? canvasEngine.onSelectionChange((selectedId, selectedObj) => {
          setSelectedMockObjectIdState(selectedId);
          setSelectedCanvasObject(selectedObj || null);
          setHasActiveFabricObject(Boolean(selectedId));
          if (!selectedId) {
            setSelectionScreenBounds(null);
          }
          if (selectedObj) {
            setStyleConfig((prev) => ({
              ...prev,
              strokeColor: selectedObj.strokeColor || prev.strokeColor,
              fillColor: selectedObj.fillColor || prev.fillColor,
              strokeWidth: selectedObj.strokeWidth || prev.strokeWidth,
              stickyColor: selectedObj.stickyColor || prev.stickyColor,
              opacity: selectedObj.opacity !== undefined ? selectedObj.opacity : prev.opacity,
              fontSize: selectedObj.fontSize || prev.fontSize,
              fontWeight: selectedObj.fontWeight || prev.fontWeight,
              textAlign: selectedObj.textAlign || prev.textAlign,
            }));
          }
        })
      : () => {};

    const unsubBounds = canvasEngine.onSelectionBoundsChange
      ? canvasEngine.onSelectionBoundsChange(setSelectionScreenBounds)
      : () => {};

    const unsubBrush = canvasEngine.onBrushSettingsChange
      ? canvasEngine.onBrushSettingsChange(setBrushSettingsState)
      : () => {};

    return () => {
      unsubReadiness();
      unsubUndoRedo();
      unsubZoom();
      unsubCoords();
      unsubObjects();
      unsubSelection();
      unsubBounds();
      unsubBrush();
    };
  }, [canvasEngine]);

  // Subscribe to collaboration events
  useEffect(() => {
    const unsubStatus = collabClient.onStatusChange(setConnectionStatus);
    const unsubCollab = collabClient.onCollaboratorsChange(setCollaborators);

    return () => {
      unsubStatus();
      unsubCollab();
    };
  }, [collabClient]);

  // Set active tool handler
  const setActiveTool = useCallback(
    (tool: ToolType) => {
      setActiveToolState(tool);
      canvasEngine.setTool(tool);

      if (tool === 'rectangle' || tool === 'circle' || tool === 'line' || tool === 'arrow') {
        setActiveShapeState(tool);
      }
      // If switching away from select or pan, deselect object unless it's a styling action
      if (tool !== 'select' && tool !== 'pan') {
        setSelectedMockObjectIdState(null);
        setEditingObjectId(null);
        canvasEngine.selectObject?.(null);
      }
    },
    [canvasEngine]
  );

  const setActiveShape = useCallback(
    (shape: ShapeSubtype) => {
      setActiveShapeState(shape);
      setActiveToolState(shape);
      canvasEngine.setTool(shape);
      setIsShapesPopoverOpen(false);
    },
    [canvasEngine]
  );

  // Update style handler (with immediate history commit for selected object)
  const updateStyle = useCallback(
    (newStyle: Partial<StyleConfig>) => {
      setStyleConfig((prev) => ({ ...prev, ...newStyle }));
      if (canvasEngine?.setStyle) {
        canvasEngine.setStyle(newStyle);
      }

      // If a mock object is selected in Preview Mode, immediately apply the changes and commit to history
      if (selectedMockObjectId) {
        const currentObjects = historyRef.current.present;
        const target = currentObjects.find((o) => o.id === selectedMockObjectId);
        if (target) {
          const updatedTarget: CanvasObject = {
            ...target,
            ...(newStyle.strokeColor !== undefined && { strokeColor: newStyle.strokeColor }),
            ...(newStyle.fillColor !== undefined && { fillColor: newStyle.fillColor }),
            ...(newStyle.strokeWidth !== undefined && { strokeWidth: newStyle.strokeWidth }),
            ...(newStyle.stickyColor !== undefined && {
              stickyColor: newStyle.stickyColor,
              fillColor: newStyle.stickyColor,
            }),
            ...(newStyle.opacity !== undefined && { opacity: newStyle.opacity }),
            ...(newStyle.fontSize !== undefined && { fontSize: newStyle.fontSize }),
            ...(newStyle.fontWeight !== undefined && { fontWeight: newStyle.fontWeight }),
            ...(newStyle.textAlign !== undefined && { textAlign: newStyle.textAlign }),
          };

          const newObjects = currentObjects.map((obj) =>
            obj.id === selectedMockObjectId ? updatedTarget : obj
          );

          commitSnapshot(newObjects, selectedMockObjectId);
        }
      }
    },
    [canvasEngine, selectedMockObjectId, commitSnapshot]
  );

  // Object selection handler - selects on Fabric engine and updates styles
  const setSelectedMockObjectId = useCallback(
    (id: string | null) => {
      setSelectedMockObjectIdState(id);
      canvasEngine.selectObject?.(id);
      if (id) {
        const currentList = isUIPreviewMode ? historyRef.current.present : (fabricObjects.length > 0 ? fabricObjects : historyRef.current.present);
        const found = currentList.find((obj) => obj.id === id);
        setSelectedCanvasObject(found || null);
        if (found) {
          setStyleConfig((prev) => ({
            ...prev,
            strokeColor: found.strokeColor || prev.strokeColor,
            fillColor: found.fillColor || prev.fillColor,
            strokeWidth: found.strokeWidth || prev.strokeWidth,
            stickyColor: found.stickyColor || prev.stickyColor,
            opacity: found.opacity !== undefined ? found.opacity : prev.opacity,
            fontSize: found.fontSize || prev.fontSize,
            fontWeight: found.fontWeight || prev.fontWeight,
            textAlign: found.textAlign || prev.textAlign,
          }));
        }
      } else {
        setSelectedCanvasObject(null);
        setEditingObjectId(null);
      }
    },
    [canvasEngine, isUIPreviewMode, fabricObjects]
  );

  // Text updating with history recording
  const updateObjectText = useCallback(
    (id: string, text: string) => {
      const currentObjects = historyRef.current.present;
      const target = currentObjects.find((o) => o.id === id);
      if (target && target.text !== text) {
        const updated = currentObjects.map((obj) =>
          obj.id === id ? { ...obj, text } : obj
        );
        commitSnapshot(updated, id);
      }
    },
    [commitSnapshot]
  );

  // Object movement pipeline for drag & drop with history snapshot
  const updateObjectPosition = useCallback(
    (id: string, x: number, y: number, commitToHistory: boolean) => {
      const currentObjects = historyRef.current.present;
      const target = currentObjects.find((o) => o.id === id);
      if (!target || (target.x === x && target.y === y)) return;

      const newObjects = currentObjects.map((o) =>
        o.id === id ? { ...o, x, y } : o
      );

      if (commitToHistory) {
        commitSnapshot(newObjects, id);
      } else {
        setHistory((prev) => ({ ...prev, present: newObjects }));
      }
    },
    [commitSnapshot]
  );

  // Object resize and bounds transform pipeline with history snapshot
  const updateObjectBounds = useCallback(
    (id: string, bounds: Partial<CanvasObject>, commitToHistory: boolean) => {
      const currentObjects = historyRef.current.present;
      const target = currentObjects.find((o) => o.id === id);
      if (!target) return;

      const newObjects = currentObjects.map((o) =>
        o.id === id ? { ...o, ...bounds } : o
      );

      if (commitToHistory) {
        commitSnapshot(newObjects, id);
      } else {
        setHistory((prev) => ({ ...prev, present: newObjects }));
      }
    },
    [commitSnapshot]
  );

  // Object creation pipeline for Preview Mode supporting all 8 shapes & freehand strokes
  const createMockObject = useCallback(
    (
      tool?: ToolType,
      position?: { x: number; y: number },
      customProps?: Partial<CanvasObject>
    ): CanvasObject => {
      const targetType = tool || activeTool;
      const posX = position ? position.x : 350 + Math.floor(Math.random() * 80);
      const posY = position ? position.y : 220 + Math.floor(Math.random() * 80);

      const baseId = `mock-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      let newObj: CanvasObject;

      switch (targetType) {
        case 'sticky':
          newObj = {
            id: baseId,
            type: 'sticky',
            x: posX,
            y: posY,
            width: 200,
            height: 180,
            stickyColor: styleConfig.stickyColor || '#fef08a',
            strokeColor: '#ca8a04',
            fillColor: styleConfig.stickyColor || '#fef08a',
            strokeWidth: 1,
            text: 'Double click to edit note...',
            ...customProps,
          };
          break;
        case 'circle':
          newObj = {
            id: baseId,
            type: 'circle',
            x: posX,
            y: posY,
            width: 140,
            height: 140,
            strokeColor: styleConfig.strokeColor || '#F26B5B',
            fillColor: styleConfig.fillColor || '#FFF9F0',
            strokeWidth: styleConfig.strokeWidth || 2,
            text: '',
            ...customProps,
          };
          break;
        case 'ellipse':
          newObj = {
            id: baseId,
            type: 'ellipse',
            x: posX,
            y: posY,
            width: 180,
            height: 110,
            strokeColor: styleConfig.strokeColor || '#F26B5B',
            fillColor: styleConfig.fillColor || '#FFF9F0',
            strokeWidth: styleConfig.strokeWidth || 2,
            text: '',
            ...customProps,
          };
          break;
        case 'diamond':
          newObj = {
            id: baseId,
            type: 'diamond',
            x: posX,
            y: posY,
            width: 120,
            height: 120,
            strokeColor: styleConfig.strokeColor || '#8b5cf6',
            fillColor: styleConfig.fillColor || '#ede9fe',
            strokeWidth: styleConfig.strokeWidth || 2,
            text: '',
            ...customProps,
          };
          break;
        case 'triangle':
          newObj = {
            id: baseId,
            type: 'triangle',
            x: posX,
            y: posY,
            width: 140,
            height: 120,
            strokeColor: styleConfig.strokeColor || '#8b5cf6',
            fillColor: styleConfig.fillColor || '#ede9fe',
            strokeWidth: styleConfig.strokeWidth || 2,
            text: '',
            ...customProps,
          };
          break;
        case 'rounded-rectangle':
          newObj = {
            id: baseId,
            type: 'rounded-rectangle',
            x: posX,
            y: posY,
            width: 220,
            height: 150,
            strokeColor: styleConfig.strokeColor || '#8b5cf6',
            fillColor: styleConfig.fillColor || '#ede9fe',
            strokeWidth: styleConfig.strokeWidth || 2,
            borderRadius: 16,
            text: '',
            ...customProps,
          };
          break;
        case 'line':
          newObj = {
            id: baseId,
            type: 'line',
            x: posX,
            y: posY,
            width: 180,
            height: 4,
            strokeColor: styleConfig.strokeColor || '#64748b',
            strokeWidth: styleConfig.strokeWidth || 2,
            fillColor: 'transparent',
            text: '',
            ...customProps,
          };
          break;
        case 'arrow':
          newObj = {
            id: baseId,
            type: 'arrow',
            x: posX,
            y: posY,
            width: 180,
            height: 24,
            strokeColor: styleConfig.strokeColor || '#F26B5B',
            strokeWidth: styleConfig.strokeWidth || 2,
            fillColor: styleConfig.strokeColor || '#F26B5B',
            text: '',
            ...customProps,
          };
          break;
        case 'text':
          newObj = {
            id: baseId,
            type: 'text',
            x: posX,
            y: posY,
            width: 260,
            height: 48,
            strokeColor: styleConfig.strokeColor || '#302633',
            fillColor: 'transparent',
            strokeWidth: 1,
            fontSize: styleConfig.fontSize || 16,
            text: 'Click or double click to edit text',
            ...customProps,
          };
          break;
        case 'brush':
          newObj = {
            id: baseId,
            type: 'brush',
            x: posX,
            y: posY,
            width: customProps?.width || 120,
            height: customProps?.height || 60,
            strokeColor: styleConfig.strokeColor || '#F26B5B',
            strokeWidth: styleConfig.brushSize || styleConfig.strokeWidth || 3,
            fillColor: 'transparent',
            text: '',
            points: customProps?.points || [
              { x: 0, y: 15 },
              { x: 40, y: 5 },
              { x: 80, y: 25 },
              { x: 120, y: 10 },
            ],
            ...customProps,
          };
          break;
        case 'highlighter':
          newObj = {
            id: baseId,
            type: 'highlighter',
            x: posX,
            y: posY,
            width: customProps?.width || 160,
            height: customProps?.height || 32,
            strokeColor: customProps?.strokeColor || '#fef08a',
            fillColor: 'transparent',
            strokeWidth: customProps?.strokeWidth || 16,
            opacity: 0.45,
            text: '',
            points: customProps?.points || [
              { x: 0, y: 16 },
              { x: 50, y: 16 },
              { x: 100, y: 16 },
              { x: 160, y: 16 },
            ],
            ...customProps,
          };
          break;
        case 'rectangle':
        default:
          newObj = {
            id: baseId,
            type: 'rectangle',
            x: posX,
            y: posY,
            width: 220,
            height: 150,
            strokeColor: styleConfig.strokeColor || '#8b5cf6',
            fillColor: styleConfig.fillColor || '#ede9fe',
            strokeWidth: styleConfig.strokeWidth || 2,
            borderRadius: 8,
            text: '',
            ...customProps,
          };
          break;
      }

      const updated = [...historyRef.current.present, newObj];
      commitSnapshot(updated, newObj.id);

      // Notify mock canvas engine adapter for contract fidelity
      canvasEngine.setTool(targetType);
      return newObj;
    },
    [activeTool, canvasEngine, commitSnapshot, styleConfig]
  );

  // Zoom handlers
  const zoomIn = useCallback(() => {
    canvasEngine.zoomIn();
  }, [canvasEngine]);

  const zoomOut = useCallback(() => {
    canvasEngine.zoomOut();
  }, [canvasEngine]);

  const resetZoom = useCallback(() => {
    canvasEngine.resetZoom();
  }, [canvasEngine]);

  // Grid snap handler
  const toggleGridSnap = useCallback(() => {
    setIsGridSnapEnabled((prev) => {
      const next = !prev;
      canvasEngine.setGridSnap?.(next);
      return next;
    });
  }, [canvasEngine]);

  // Object action handlers (with functional history tracking)
  const deleteSelected = useCallback(() => {
    canvasEngine.deleteSelected();
    if (selectedMockObjectId) {
      const current = historyRef.current.present;
      const updated = current.filter((o) => o.id !== selectedMockObjectId);
      commitSnapshot(updated, null);
      setEditingObjectId(null);
    }
  }, [canvasEngine, selectedMockObjectId, commitSnapshot]);

  const duplicateSelected = useCallback(() => {
    canvasEngine.duplicateSelected();
    if (selectedMockObjectId) {
      const current = historyRef.current.present;
      const target = current.find((o) => o.id === selectedMockObjectId);
      if (target) {
        const clone: CanvasObject = {
          ...target,
          id: `mock-${Date.now()}`,
          x: target.x + 30,
          y: target.y + 30,
        };
        const updated = [...current, clone];
        commitSnapshot(updated, clone.id);
      }
    }
  }, [canvasEngine, selectedMockObjectId, commitSnapshot]);

  const bringForwardSelected = useCallback(() => {
    canvasEngine.bringForwardSelected();
    if (selectedMockObjectId) {
      const current = historyRef.current.present;
      const idx = current.findIndex((o) => o.id === selectedMockObjectId);
      if (idx === -1 || idx === current.length - 1) return;
      const item = current[idx];
      const remaining = current.filter((o) => o.id !== selectedMockObjectId);
      const updated = [...remaining, item];
      commitSnapshot(updated, selectedMockObjectId);
    }
  }, [canvasEngine, selectedMockObjectId, commitSnapshot]);

  // Export handler
  const exportCanvas = useCallback(
    async (options: ExportOptions) => {
      return await canvasEngine.exportCanvas(options);
    },
    [canvasEngine]
  );

  // Guest user update with session storage persistence
  const setGuestUser = useCallback((user: Partial<GuestUserInfo>) => {
    setGuestUserState((prev) => {
      const updated = { ...prev, ...user };
      if (user.name) {
        defaultMockCollabAdapter.updateDisplayName(user.name);
      }
      if (user.color) {
        defaultMockCollabAdapter.updateColor(user.color);
      }
      try {
        if (typeof window !== 'undefined' && window.sessionStorage) {
          sessionStorage.setItem('pixelforge_guest_session', JSON.stringify(updated));
        }
      } catch {
        // quota fallback
      }
      return updated;
    });
  }, []);

  // UI Preview mode toggle
  const toggleUIPreviewMode = useCallback(() => {
    setIsUIPreviewMode((prev) => {
      const next = !prev;
      if (!next) {
        setSelectedMockObjectIdState(null);
        setEditingObjectId(null);
      }
      return next;
    });
  }, []);

  // Minimap toggle
  const toggleMinimap = useCallback(() => {
    setIsMinimapOpen((prev) => !prev);
  }, []);

  // Layers panel toggle
  const toggleLayersPanel = useCallback(() => {
    setIsLayersPanelOpen((prev) => !prev);
  }, []);

  const updateObjectProperties = useCallback(
    (id: string, updates: Partial<CanvasObject>) => {
      if (canvasEngine.updateObjectProperties) {
        canvasEngine.updateObjectProperties(id, updates);
      } else {
        canvasEngine.setStyle(updates);
      }
      if (isUIPreviewMode) {
        const currentObjects = historyRef.current.present;
        const target = currentObjects.find((o) => o.id === id);
        if (!target) return;
        const newObjects = currentObjects.map((o) =>
          o.id === id ? { ...o, ...updates } : o
        );
        commitSnapshot(newObjects, id);
      }
    },
    [canvasEngine, commitSnapshot, isUIPreviewMode]
  );

  const toggleObjectVisibility = useCallback(
    (id: string) => {
      const currentList = isUIPreviewMode ? historyRef.current.present : (fabricObjects.length > 0 ? fabricObjects : historyRef.current.present);
      const target = currentList.find((o) => o.id === id);
      const nextVisible = target ? target.visible === false : false;
      canvasEngine.setObjectVisibility?.(id, nextVisible);

      if (isUIPreviewMode) {
        const currentObjects = historyRef.current.present;
        const newObjects = currentObjects.map((o) =>
          o.id === id ? { ...o, visible: o.visible === false ? true : false } : o
        );
        commitSnapshot(newObjects, selectedMockObjectId);
      }
    },
    [canvasEngine, isUIPreviewMode, fabricObjects, commitSnapshot, selectedMockObjectId]
  );

  // Simulation controls
  const updateSimulatedStatus = useCallback(
    (status: ConnectionStatus) => {
      setSimulationSettings((prev) => ({ ...prev, simulatedStatus: status }));
      if ('setSimulatedStatus' in collabClient) {
        (collabClient as MockCollabAdapter).setSimulatedStatus(status);
      } else {
        setConnectionStatus(status);
      }
    },
    [collabClient]
  );

  const toggleDemoCollaborators = useCallback(
    (show?: boolean) => {
      setSimulationSettings((prev) => {
        const nextShow = show !== undefined ? show : !prev.showDemoCollaborators;
        const selected = nextShow ? MOCK_COLLABORATORS.slice(0, 5) : [];
        if ('setSimulatedCollaborators' in collabClient) {
          (collabClient as MockCollabAdapter).setSimulatedCollaborators(selected);
        } else {
          setCollaborators(selected);
        }
        return { ...prev, showDemoCollaborators: nextShow };
      });
    },
    [collabClient]
  );

  const setSimulatedCollaboratorCount = useCallback(
    (count: number) => {
      const selected = MOCK_COLLABORATORS.slice(0, count);
      if ('setSimulatedCollaborators' in collabClient) {
        (collabClient as MockCollabAdapter).setSimulatedCollaborators(selected);
      } else {
        setCollaborators(selected);
      }
      setSimulationSettings((prev) => ({
        ...prev,
        showDemoCollaborators: count > 0,
      }));
    },
    [collabClient]
  );

  const toggleEmptyBoard = useCallback((empty?: boolean) => {
    setSimulationSettings((prev) => ({
      ...prev,
      isEmptyBoard: empty !== undefined ? empty : !prev.isEmptyBoard,
    }));
  }, []);

  const toggleErrorState = useCallback((error?: boolean) => {
    setSimulationSettings((prev) => ({
      ...prev,
      isErrorState: error !== undefined ? error : !prev.isErrorState,
    }));
  }, []);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      guestUser,
      setGuestUser,
      boardTitle,
      setBoardTitle,
      activeTool,
      activeShape,
      setActiveTool,
      setActiveShape,
      styleConfig,
      updateStyle,
      isGridSnapEnabled,
      toggleGridSnap,
      zoom,
      zoomIn,
      zoomOut,
      resetZoom,
      pan,
      setPan,
      updateObjectPosition,
      updateObjectBounds,
      pointerCoords,
      setPointerCoords,
      engineReadiness,
      undoRedoCapabilities,
      undo,
      redo,
      deleteSelected,
      duplicateSelected,
      bringForwardSelected,
      sendBackwardSelected,
      brushSettings,
      updateBrushSettings,
      selectedStickyTemplate,
      setSelectedStickyTemplate,
      isStickyGalleryOpen,
      setIsStickyGalleryOpen,
      isBrushStudioOpen,
      setIsBrushStudioOpen,
      applyTextStyle,
      highlightSelectedText,
      highlightWholeText,
      changeStickyTemplate,
      loadDemoFixtures,
      isUIPreviewMode,
      toggleUIPreviewMode,
      selectedCanvasObject,
      selectedMockObjectId,
      hasActiveObject: Boolean(selectedCanvasObject) || Boolean(selectedMockObjectId) || hasActiveFabricObject,
      setSelectedMockObjectId,
      mockObjects,
      createMockObject,
      updateObjectText,
      editingObjectId,
      setEditingObjectId,
      connectionStatus,
      collaborators,
      isGuestModalOpen,
      setIsGuestModalOpen,
      isExportModalOpen,
      setIsExportModalOpen,
      isShareModalOpen,
      setIsShareModalOpen,
      isSimulationDrawerOpen,
      setIsSimulationDrawerOpen,
      isHistoryModalOpen,
      setIsHistoryModalOpen,
      isMinimapOpen,
      toggleMinimap,
      isLayersPanelOpen,
      toggleLayersPanel,
      updateObjectProperties,
      toggleObjectVisibility,
      isShapesPopoverOpen,
      setIsShapesPopoverOpen,
      simulationSettings,
      updateSimulatedStatus,
      toggleDemoCollaborators,
      setSimulatedCollaboratorCount,
      toggleEmptyBoard,
      toggleErrorState,
      exportCanvas,
      selectionScreenBounds,
      canvasEngine,
      collabClient,
    }),
    [
      guestUser,
      setGuestUser,
      boardTitle,
      setBoardTitle,
      activeTool,
      activeShape,
      setActiveTool,
      setActiveShape,
      styleConfig,
      updateStyle,
      isGridSnapEnabled,
      toggleGridSnap,
      zoom,
      zoomIn,
      zoomOut,
      resetZoom,
      pan,
      setPan,
      updateObjectPosition,
      updateObjectBounds,
      pointerCoords,
      setPointerCoords,
      engineReadiness,
      undoRedoCapabilities,
      undo,
      redo,
      deleteSelected,
      duplicateSelected,
      bringForwardSelected,
      sendBackwardSelected,
      brushSettings,
      updateBrushSettings,
      selectedStickyTemplate,
      setSelectedStickyTemplate,
      isStickyGalleryOpen,
      setIsStickyGalleryOpen,
      isBrushStudioOpen,
      setIsBrushStudioOpen,
      applyTextStyle,
      highlightSelectedText,
      highlightWholeText,
      changeStickyTemplate,
      loadDemoFixtures,
      isUIPreviewMode,
      toggleUIPreviewMode,
      selectedCanvasObject,
      selectedMockObjectId,
      hasActiveFabricObject,
      setSelectedMockObjectId,
      mockObjects,
      createMockObject,
      updateObjectText,
      editingObjectId,
      setEditingObjectId,
      connectionStatus,
      collaborators,
      isGuestModalOpen,
      isExportModalOpen,
      isShareModalOpen,
      isSimulationDrawerOpen,
      isHistoryModalOpen,
      isMinimapOpen,
      toggleMinimap,
      isLayersPanelOpen,
      toggleLayersPanel,
      updateObjectProperties,
      toggleObjectVisibility,
      isShapesPopoverOpen,
      simulationSettings,
      updateSimulatedStatus,
      toggleDemoCollaborators,
      setSimulatedCollaboratorCount,
      toggleEmptyBoard,
      toggleErrorState,
      exportCanvas,
      canvasEngine,
      collabClient,
    ]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = (): WorkspaceContextValue => {
  const context = useContext(WorkspaceContext);
  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
};
