/**
 * PixelForge Team Integration Contracts
 * 
 * Formal TypeScript contracts proposed by Member 1 (Frontend Shell & UI/UX):
 * - CanvasEngineContract: Interface provided by Member 2 (Canvas Engine / Fabric.js)
 * - CollaborationClientContract: Interface provided by Member 3 (Real-time Collaboration / Socket.IO)
 * 
 * Assumptions & Boundary Notes:
 * 1. UI components call these methods without knowing the underlying implementation (Fabric.js vs. Mock, Socket.IO vs. Mock).
 * 2. Unsubscribe functions are returned from listeners for clean React effect teardown.
 * 3. Method calls return Promises where async lifecycle or network transit may occur.
 */

import {
  ToolType,
  ShapeSubtype,
  CanvasObject,
  StyleConfig,
  BrushSettings,
  TextFormattingSettings,
  ExportOptions,
  ExportResult,
  UndoRedoCapabilities,
  EngineReadinessState,
  ConnectionStatus,
  Collaborator,
  BoardOperationPayload,
  BoardRevision,
} from './whiteboard';

/**
 * CanvasEngineContract
 * Provided by Member 2 (Canvas Engine) and consumed by the Frontend UI shell.
 */
export interface CanvasEngineContract {
  /**
   * Activates the selected drawing/interaction tool.
   */
  setTool(tool: ToolType): void;

  /**
   * Subscribes to tool changes emitted by the canvas engine (e.g. after completing lasso selection).
   */
  onToolChange?(listener: (tool: ToolType) => void): () => void;

  /**
   * Updates global or selected object styling parameters (stroke, fill, width, sticky color).
   */
  setStyle(style: Partial<StyleConfig>): void;

  /**
   * Sets the canvas zoom level (e.g. 1.0 = 100%).
   */
  setZoom(zoomLevel: number): void;

  /**
   * Zoom In step (typically +10% or +25%).
   */
  zoomIn(): void;

  /**
   * Zoom Out step (typically -10% or -25%).
   */
  zoomOut(): void;

  /**
   * Resets viewport zoom to 100% or fits all content on screen.
   */
  resetZoom(): void;

  /**
   * Toggles canvas grid snapping.
   */
  setGridSnap?(enabled: boolean): void;

  /**
   * Requests an undo operation within the canvas history.
   */
  undo(): Promise<void> | void;

  /**
   * Requests a redo operation within the canvas history.
   */
  redo(): Promise<void> | void;

  /**
   * Deletes currently selected canvas object(s).
   */
  deleteSelected(): Promise<void> | void;

  /**
   * Duplicates currently selected canvas object(s).
   */
  duplicateSelected(): Promise<void> | void;

  /**
   * Reorders currently selected canvas object forward by one layer.
   */
  bringForwardSelected(): Promise<void> | void;

  /**
   * Reorders currently selected canvas object all the way to the front.
   */
  bringToFrontSelected?(): Promise<void> | void;

  /**
   * Locks or unlocks the currently selected object(s).
   */
  lockSelected?(locked?: boolean): void;

  /**
   * Returns whether the active selection is locked.
   */
  isSelectionLocked?(): boolean;

  /**
   * Exports the canvas as PNG or SVG string/data-URI.
   */
  exportCanvas(options: ExportOptions): Promise<ExportResult>;

  /**
   * Serializes current canvas state to a JSON-compatible snapshot object.
   */
  getCanvasSnapshot?(): Record<string, unknown> | null;

  /**
   * Returns current engine readiness.
   */
  getReadiness(): EngineReadinessState;

  /**
   * Returns current undo/redo availability.
   */
  getUndoRedoCapabilities(): UndoRedoCapabilities;

  /**
   * Subscribes to engine readiness status changes.
   */
  onReadinessChange(listener: (state: EngineReadinessState) => void): () => void;

  /**
   * Subscribes to undo/redo capability changes.
   */
  onUndoRedoChange(listener: (caps: UndoRedoCapabilities) => void): () => void;

  /**
   * Subscribes to zoom level changes triggered by mouse wheel, pinch, or engine actions.
   */
  onZoomChange(listener: (zoom: number) => void): () => void;

  /**
   * Subscribes to live cursor or world-coordinate pointer events emitted by the canvas engine.
   * Defined as a typed integration hook for Member 2's Fabric.js coordinate transformation.
   */
  onCoordinatesChange?(listener: (coords: { x: number; y: number }) => void): () => void;

  /**
   * Selects an object on the canvas by its ID.
   */
  selectObject?(id: string | null): void;

  /**
   * Sets the visibility of a canvas object by its ID.
   */
  setObjectVisibility?(id: string, visible: boolean): void;

  /**
   * Subscribes to changes in the list of objects on the canvas.
   */
  onObjectsChange?(listener: (objects: CanvasObject[]) => void): () => void;

  /**
   * Subscribes to selection changes on the canvas.
   */
  onSelectionChange?(listener: (selectedId: string | null, selectedObject?: CanvasObject | null) => void): () => void;

  /**
   * Subscribes to bounding box position changes of the active selection in screen coordinates.
   */
  onSelectionBoundsChange?(listener: (bounds: { left: number; top: number; width: number; height: number } | null) => void): () => void;

  /**
   * Reorders currently selected canvas object backward by one layer.
   */
  sendBackwardSelected?(): Promise<void> | void;

  /**
   * Reorders currently selected canvas object all the way to the back.
   */
  sendToBackSelected?(): Promise<void> | void;

  /**
   * Directly updates properties of a specific canvas object by ID.
   */
  updateObjectProperties?(id: string, updates: Partial<CanvasObject>): void;

  /**
   * Nudges the currently selected object(s) by dx and dy in world units.
   */
  nudgeSelected?(dx: number, dy: number): void;

  /**
   * Centers canvas viewport at specified world coordinates.
   */
  panTo?(worldX: number, worldY: number): void;

  /**
   * Updates Brush Studio settings.
   */
  setBrushSettings?(settings: Partial<BrushSettings>): void;

  /**
   * Retrieves active Brush Studio settings.
   */
  getBrushSettings?(): BrushSettings;

  /**
   * Subscribes to changes in brush settings.
   */
  onBrushSettingsChange?(listener: (settings: BrushSettings) => void): () => void;

  /**
   * Sets active sticky-note template ID.
   */
  setStickyTemplate?(template: string): void;

  /**
   * Gets active sticky-note template ID.
   */
  getStickyTemplate?(): string;

  /**
   * Creates a text box at world coordinates or viewport center.
   */
  addTextBox?(options?: { x?: number; y?: number; text?: string; fontSize?: number; fontWeight?: string }): void;

  /**
   * Creates a sticky note at world coordinates.
   */
  createStickyNoteAt?(options: { template?: string; x: number; y: number; header?: string; body?: string }): Promise<void>;

  /**
   * Creates a geometric shape at specified world coordinates.
   */
  createShapeAtPoint?(shape: ShapeSubtype, point: { x: number; y: number }): void;

  /**
   * Applies rich text styling to selected text on canvas.
   */
  applyTextStyle?(style: Partial<TextFormattingSettings>): void;

  /**
   * Sets the active text formatting settings used for text creation and selected text.
   */
  setTextSettings?(settings: Partial<TextFormattingSettings>): void;

  /**
   * Subscribes to text formatting settings changes.
   */
  onTextSettingsChange?(listener: (settings: TextFormattingSettings) => void): () => void;

  /**
   * Highlights selected characters in text editing mode.
   */
  highlightSelectedText?(color?: string): void;

  /**
   * Highlights whole active text object.
   */
  highlightWholeText?(color?: string): void;

  /**
   * Changes template of currently selected sticky note.
   */
  changeStickyTemplate?(templateKey: string): Promise<void>;

  /**
   * Seeds optional demo fixtures onto the canvas on user demand.
   */
  seedDemoContent?(): Promise<void>;

  /**
   * Adds a customizable grid table onto the canvas.
   */
  addTable?(options?: { rows?: number; cols?: number; x?: number; y?: number }): void;

  /**
   * Adds a data-driven chart / graph onto the canvas.
   */
  addGraph?(options?: { graphType?: string; data?: string; x?: number; y?: number }): void;

  /**
   * Adds an image file directly onto the canvas.
   */
  addImage?(file: File): Promise<void>;

  /**
   * Groups currently selected multiple objects.
   */
  groupSelected?(): void;

  /**
   * Ungroups currently selected group.
   */
  ungroupSelected?(): void;

  /**
   * Loads a serialized snapshot onto the canvas.
   */
  loadCanvasSnapshot?(snapshot: Record<string, unknown> | string): Promise<void>;
}

/**
 * CollaborationClientContract
 * Provided by Member 3 (Collaboration & Backend) and consumed by the Frontend UI shell.
 */
export interface CollaborationClientContract {
  /**
   * Connects to a specific board room with guest identity.
   */
  connect(boardId: string, user: { name: string; color: string }): Promise<void>;

  /**
   * Leaves the board room and terminates active connections.
   */
  disconnect(): void;

  /**
   * Broadcasts the local user's pointer/cursor position.
   */
  updatePresence(cursor: { x: number; y: number }): void;

  /**
   * Updates user display name and broadcasts to room.
   */
  updateDisplayName(name: string): void;

  /**
   * Updates user accent/cursor color and broadcasts to room.
   */
  updateColor(color: string): void;

  /**
   * Sends a canvas mutation or board operation to remote peers.
   */
  sendOperation(operation: BoardOperationPayload): void;

  /**
   * Gets the current connection/sync status.
   */
  getStatus(): ConnectionStatus;

  /**
   * Gets the list of current active collaborators in the room.
   */
  getCollaborators(): Collaborator[];

  /**
   * Subscribes to connection or persistence status changes.
   */
  onStatusChange(listener: (status: ConnectionStatus) => void): () => void;

  /**
   * Subscribes to active collaborators list or presence updates.
   */
  onCollaboratorsChange(listener: (collaborators: Collaborator[]) => void): () => void;

  /**
   * Subscribes to incoming remote board operations.
   */
  onOperationReceived(listener: (operation: BoardOperationPayload) => void): () => void;

  /**
   * Broadcasts a full canvas sync or snapshot to peers and backend persistence.
   */
  sendCanvasSync?(payload: { objects?: CanvasObject[]; fabricState?: unknown }): void;

  /**
   * Creates a named or autosave revision checkpoint in the database or local storage.
   */
  createRevision?(payload: { kind?: 'manual' | 'autosave'; label?: string; snapshot?: unknown }): Promise<BoardRevision> | BoardRevision | void;

  /**
   * Retrieves list of recorded board revisions.
   */
  getRevisions?(): BoardRevision[];

  /**
   * Subscribes to revisions list changes.
   */
  onRevisionsChange?(listener: (revisions: BoardRevision[]) => void): () => void;

  /**
   * Subscribes to remote canvas sync updates.
   */
  onCanvasSynced?(listener: (payload: { objects?: CanvasObject[]; fabricState?: unknown; timestamp: number }) => void): () => void;

  /**
   * Subscribes to revisions created by peers or server.
   */
  onRevisionCreated?(listener: (revision: BoardRevision) => void): () => void;
}

/**
 * Backend REST API Response contracts
 * Aligned with revised-canvas-engine controllers and database schema.
 */
export interface BoardSummary {
  id: string;
  name: string;
  settings?: Record<string, unknown>;
  owner_id?: string;
  is_archived?: boolean;
  created_at: string;
  updated_at: string;
}

export interface BoardDetails extends BoardSummary {
  objects: unknown[];
  recentRevisions: BoardRevision[];
}

export interface BoardApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  count?: number;
  error?: string;
  message?: string;
}

