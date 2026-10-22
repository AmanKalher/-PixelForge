import { CanvasEngineContract } from '../types/contracts';
import {
  ToolType,
  StyleConfig,
  ExportOptions,
  ExportResult,
  UndoRedoCapabilities,
  EngineReadinessState,
} from '../types/whiteboard';

/**
 * MockCanvasAdapter
 * 
 * Standalone mock implementation of CanvasEngineContract.
 * Satisfies the contract for frontend UI verification without implementing Fabric.js
 * or drawing mathematics, keeping responsibilities cleanly bounded for Member 2.
 */
export class MockCanvasAdapter implements CanvasEngineContract {
  private readiness: EngineReadinessState = 'ready';
  private zoom: number = 1.0;
  private undoRedoState: UndoRedoCapabilities = {
    canUndo: true,
    canRedo: false,
  };
  private readinessListeners: Set<(state: EngineReadinessState) => void> = new Set();
  private undoRedoListeners: Set<(caps: UndoRedoCapabilities) => void> = new Set();
  private zoomListeners: Set<(zoom: number) => void> = new Set();
  private coordinatesListeners: Set<(coords: { x: number; y: number }) => void> = new Set();

  public lastAction: { action: string; payload?: unknown; timestamp: number } | null = null;

  private recordAction(action: string, payload?: unknown) {
    this.lastAction = { action, payload, timestamp: Date.now() };
    // UI feedback / diagnostic logging
    console.debug(`[MockCanvasAdapter] ${action}`, payload ?? '');
  }

  setTool(tool: ToolType): void {
    this.recordAction('setTool', { tool });
  }

  setStyle(style: Partial<StyleConfig>): void {
    this.recordAction('setStyle', style);
  }

  setZoom(zoomLevel: number): void {
    this.zoom = Math.max(0.1, Math.min(5.0, zoomLevel));
    this.recordAction('setZoom', { zoom: this.zoom });
    this.notifyZoom();
  }

  zoomIn(): void {
    this.setZoom(Math.round((this.zoom + 0.1) * 10) / 10);
  }

  zoomOut(): void {
    this.setZoom(Math.round((this.zoom - 0.1) * 10) / 10);
  }

  resetZoom(): void {
    this.setZoom(1.0);
  }

  setGridSnap(enabled: boolean): void {
    this.recordAction('setGridSnap', { enabled });
  }

  async undo(): Promise<void> {
    this.recordAction('undo');
    // Simulate toggling capabilities for UI demonstration
    this.undoRedoState = {
      canUndo: false,
      canRedo: true,
    };
    this.notifyUndoRedo();
  }

  async redo(): Promise<void> {
    this.recordAction('redo');
    this.undoRedoState = {
      canUndo: true,
      canRedo: false,
    };
    this.notifyUndoRedo();
  }

  async deleteSelected(): Promise<void> {
    this.recordAction('deleteSelected');
  }

  async duplicateSelected(): Promise<void> {
    this.recordAction('duplicateSelected');
  }

  async bringForwardSelected(): Promise<void> {
    this.recordAction('bringForwardSelected');
  }

  async exportCanvas(options: ExportOptions): Promise<ExportResult> {
    this.recordAction('exportCanvas', options);
    // Explicitly return a simulated result per section 6J
    return {
      format: options.format,
      simulated: true,
      message: `[Simulated] Export request for ${options.format.toUpperCase()} (Grid: ${options.includeGrid ? 'yes' : 'no'}, Bg: ${options.includeBackground ? 'yes' : 'no'}) processed by MockCanvasAdapter. Fabric.js engine is required for real file generation.`,
    };
  }

  getReadiness(): EngineReadinessState {
    return this.readiness;
  }

  getUndoRedoCapabilities(): UndoRedoCapabilities {
    return this.undoRedoState;
  }

  onReadinessChange(listener: (state: EngineReadinessState) => void): () => void {
    this.readinessListeners.add(listener);
    listener(this.readiness);
    return () => this.readinessListeners.delete(listener);
  }

  onUndoRedoChange(listener: (caps: UndoRedoCapabilities) => void): () => void {
    this.undoRedoListeners.add(listener);
    listener(this.undoRedoState);
    return () => this.undoRedoListeners.delete(listener);
  }

  onZoomChange(listener: (zoom: number) => void): () => void {
    this.zoomListeners.add(listener);
    listener(this.zoom);
    return () => this.zoomListeners.delete(listener);
  }

  onCoordinatesChange(listener: (coords: { x: number; y: number }) => void): () => void {
    this.coordinatesListeners.add(listener);
    return () => this.coordinatesListeners.delete(listener);
  }

  private notifyUndoRedo() {
    for (const listener of this.undoRedoListeners) {
      listener(this.undoRedoState);
    }
  }

  private notifyZoom() {
    for (const listener of this.zoomListeners) {
      listener(this.zoom);
    }
  }

  /**
   * Diagnostic helper for dev simulation controls
   */
  setSimulatedReadiness(state: EngineReadinessState) {
    this.readiness = state;
    for (const listener of this.readinessListeners) {
      listener(this.readiness);
    }
  }
}

