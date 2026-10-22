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
} from '../types/whiteboard';
import {
  CanvasEngineContract,
  CollaborationClientContract,
} from '../types/contracts';
import { MockCanvasAdapter } from '../adapters/mockCanvasAdapter';
import { MockCollabAdapter } from '../adapters/mockCollabAdapter';
import {
  DEFAULT_STYLE_CONFIG,
  INITIAL_PREVIEW_OBJECTS,
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

  // Preview Mode & Mock Selection
  isUIPreviewMode: boolean;
  toggleUIPreviewMode: () => void;
  selectedMockObjectId: string | null;
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

  // Underlying Adapters
  canvasEngine: CanvasEngineContract;
  collabClient: CollaborationClientContract;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

// Default singleton fallback adapters for clean dependency injection
const defaultMockCanvasAdapter = new MockCanvasAdapter();
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
            color: parsed.color || '#4f46e5',
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
    color: '#4f46e5',
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
  canvasEngine = defaultMockCanvasAdapter,
  collabClient = defaultMockCollabAdapter,
}) => {
  // Guest Identity
  const [guestUser, setGuestUserState] = useState<GuestUserInfo>(getInitialGuestUser);

  // Board Title
  const [boardTitle, setBoardTitle] = useState<string>('Webster Sprint Canvas');

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

  // Preview Mode & Mock Selection
  const [isUIPreviewMode, setIsUIPreviewMode] = useState<boolean>(true);
  const [selectedMockObjectId, setSelectedMockObjectIdState] = useState<string | null>(null);
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null);

  // =========================================================================
  // FUNCTIONAL IMMUTABLE HISTORY ENGINE (Undo / Redo for Mock Preview Objects)
  // =========================================================================
  const [history, setHistory] = useState<{
    past: CanvasObject[][];
    present: CanvasObject[];
    future: CanvasObject[][];
  }>({
    past: [],
    present: INITIAL_PREVIEW_OBJECTS,
    future: [],
  });

  // Derived mockObjects directly from immutable present state
  const mockObjects = history.present;

  // Dynamically compute undo/redo capabilities based on history stack length
  const undoRedoCapabilities = useMemo<UndoRedoCapabilities>(() => {
    return {
      canUndo: history.past.length > 0,
      canRedo: history.future.length > 0,
    };
  }, [history.past.length, history.future.length]);

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

  // Functional Undo
  const undo = useCallback(() => {
    const current = historyRef.current;
    if (current.past.length === 0) return;

    const previous = current.past[current.past.length - 1];
    const newPast = current.past.slice(0, current.past.length - 1);

    setHistory({
      past: newPast,
      present: previous,
      future: [current.present, ...current.future],
    });

    // Deselect or ensure valid selection
    setSelectedMockObjectIdState((prevId) => {
      if (prevId && previous.some((o) => o.id === prevId)) {
        return prevId;
      }
      return null;
    });
    setEditingObjectId(null);

    // Call engine contract for contract fidelity
    canvasEngine.undo();
  }, [canvasEngine]);

  // Functional Redo
  const redo = useCallback(() => {
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

    // Call engine contract for contract fidelity
    canvasEngine.redo();
  }, [canvasEngine]);

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

  // Simulation settings
  const [simulationSettings, setSimulationSettings] = useState<SimulationSettings>({
    simulatedStatus: 'connected',
    showDemoCollaborators: true,
    isEmptyBoard: false,
    isErrorState: false,
  });

  // Subscribe to engine readiness, zoom & world coordinates events
  useEffect(() => {
    const unsubReadiness = canvasEngine.onReadinessChange(setEngineReadiness);
    const unsubZoom = canvasEngine.onZoomChange(setZoomState);
    const unsubCoords = canvasEngine.onCoordinatesChange
      ? canvasEngine.onCoordinatesChange(setPointerCoords)
      : () => {};

    return () => {
      unsubReadiness();
      unsubZoom();
      unsubCoords();
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
      setStyleConfig((prev) => {
        const updated = { ...prev, ...newStyle };
        canvasEngine.setStyle(updated);
        return updated;
      });

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

  // Mock object selection handler - preserves and populates object's own styles
  const setSelectedMockObjectId = useCallback(
    (id: string | null) => {
      setSelectedMockObjectIdState(id);
      if (id) {
        const found = historyRef.current.present.find((obj) => obj.id === id);
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
        setEditingObjectId(null);
      }
    },
    []
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
            strokeColor: styleConfig.strokeColor || '#6366f1',
            fillColor: styleConfig.fillColor || '#eef2ff',
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
            strokeColor: styleConfig.strokeColor || '#6366f1',
            fillColor: styleConfig.fillColor || '#eef2ff',
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
            strokeColor: styleConfig.strokeColor || '#6366f1',
            strokeWidth: styleConfig.strokeWidth || 2,
            fillColor: styleConfig.strokeColor || '#6366f1',
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
            strokeColor: styleConfig.strokeColor || '#1e293b',
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
            strokeColor: styleConfig.strokeColor || '#6366f1',
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
      const currentObjects = historyRef.current.present;
      const target = currentObjects.find((o) => o.id === id);
      if (!target) return;
      const newObjects = currentObjects.map((o) =>
        o.id === id ? { ...o, ...updates } : o
      );
      commitSnapshot(newObjects, id);
    },
    [commitSnapshot]
  );

  const toggleObjectVisibility = useCallback(
    (id: string) => {
      const currentObjects = historyRef.current.present;
      const newObjects = currentObjects.map((o) =>
        o.id === id ? { ...o, visible: o.visible === false ? true : false } : o
      );
      commitSnapshot(newObjects, selectedMockObjectId);
    },
    [commitSnapshot, selectedMockObjectId]
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
      isUIPreviewMode,
      toggleUIPreviewMode,
      selectedMockObjectId,
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
      isUIPreviewMode,
      toggleUIPreviewMode,
      selectedMockObjectId,
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
