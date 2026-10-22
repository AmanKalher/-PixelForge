/**
 * PixelForge Shared Whiteboard Domain Types
 * Defines data structures used across the frontend shell, canvas engine, and collaboration adapter.
 */

export type ShapeSubtype =
  | 'rectangle'
  | 'rounded-rectangle'
  | 'circle'
  | 'ellipse'
  | 'diamond'
  | 'triangle'
  | 'line'
  | 'arrow';

export type ToolType =
  | 'select'
  | 'pan'
  | 'brush'
  | 'highlighter'
  | 'sticky'
  | 'text'
  | ShapeSubtype;

export interface StyleConfig {
  strokeColor: string;
  fillColor: string; // Hex color or 'transparent'
  strokeWidth: number; // 1, 2, 4, 6, 8, 12, 16
  stickyColor: string;
  opacity?: number;
  fontSize?: number; // 12, 14, 18, 24, 32
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  brushSize?: number;
}

export type ExportFormat = 'png' | 'svg';

export interface ExportOptions {
  format: ExportFormat;
  includeGrid: boolean;
  includeBackground: boolean;
  quality?: number;
}

export interface ExportResult {
  format: ExportFormat;
  simulated: boolean;
  dataUrl?: string;
  svgString?: string;
  message?: string;
}

export interface UndoRedoCapabilities {
  canUndo: boolean;
  canRedo: boolean;
}

export type EngineReadinessState = 'uninitialized' | 'initializing' | 'ready' | 'error';

/**
 * High-level object representation for UI preview and object actions.
 * Member 2's Fabric.js engine remains authoritative for actual canvas rendering.
 */
export interface CanvasObject {
  id: string;
  type: ToolType;
  x: number;
  y: number;
  width?: number;
  height?: number;
  strokeColor?: string;
  fillColor?: string;
  strokeWidth?: number;
  text?: string;
  stickyColor?: string;
  opacity?: number;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  points?: { x: number; y: number }[];
  borderRadius?: number | [number, number, number, number];
  visible?: boolean;
}

export type ConnectionStatus =
  | 'connected'
  | 'reconnecting'
  | 'offline'
  | 'cached'
  | 'saved';

export interface Collaborator {
  id: string;
  name: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
  };
  lastActive?: number;
  isSelf?: boolean;
}

export interface PresenceUpdatePayload {
  collaboratorId: string;
  name: string;
  color: string;
  cursor?: {
    x: number;
    y: number;
  };
}

export interface BoardOperationPayload {
  opId: string;
  type: 'create' | 'update' | 'delete' | 'reorder';
  targetId?: string;
  data?: unknown;
  timestamp: number;
}
