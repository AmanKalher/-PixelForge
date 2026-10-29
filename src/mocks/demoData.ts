import { CanvasObject, Collaborator, StyleConfig } from '../types/whiteboard';

/**
 * Centralized Mock & Demo Data Fixtures
 * Kept strictly isolated from actual engine state and backend protocol.
 */

export const DEFAULT_STYLE_CONFIG: StyleConfig = {
  strokeColor: '#8b5cf6',
  fillColor: 'transparent',
  strokeWidth: 2,
  stickyColor: '#fef08a',
  opacity: 1,
  fontSize: 16,
  fontWeight: 'normal',
  textAlign: 'left',
  brushSize: 4,
};

export const COLOR_PALETTE = {
  strokeColors: [
    '#ffffff', // White
    '#94a3b8', // Slate
    '#64748b', // Dark Slate
    '#ef4444', // Red
    '#f97316', // Orange
    '#f59e0b', // Amber
    '#eab308', // Yellow
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#6366f1', // Indigo
    '#8b5cf6', // Violet
    '#d946ef', // Fuchsia
    '#ec4899', // Pink
    '#0f172a', // Midnight / Black
  ],
  fillColors: [
    'transparent',
    '#1e293b', // Dark Slate
    '#334155', // Slate Fill
    '#ef444433', // Translucent Red
    '#f9731633', // Translucent Orange
    '#f59e0b33', // Translucent Amber
    '#10b98133', // Translucent Emerald
    '#06b6d433', // Translucent Cyan
    '#3b82f633', // Translucent Blue
    '#6366f133', // Translucent Indigo
    '#8b5cf633', // Translucent Violet
    '#ec489933', // Translucent Pink
    '#ffffff22', // Translucent White
  ],
  stickyColors: [
    '#fef08a', // Classic Pastel Yellow
    '#bbf7d0', // Pastel Mint Green
    '#fed7aa', // Pastel Peach
    '#bfdbfe', // Pastel Sky Blue
    '#fbcfe8', // Pastel Blossom Pink
    '#e9d5ff', // Pastel Lavender
  ],
  guestColors: [
    '#6366f1', // Indigo
    '#ec4899', // Pink
    '#f97316', // Orange
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#8b5cf6', // Purple
  ],
  strokeWidths: [1, 2, 4, 6, 8, 12, 16] as const,
  brushSizes: [2, 4, 8, 12, 20] as const,
};

/**
 * Preview Mode Initial Sample Visual Objects
 * Aligned with the Webster Sprint Canvas architecture demo
 */
export const INITIAL_PREVIEW_OBJECTS: CanvasObject[] = [
  // 1. Sticky Note 1 (Yellow)
  {
    id: 'mock-sticky-1',
    type: 'sticky',
    x: 230,
    y: 90,
    width: 210,
    height: 170,
    stickyColor: '#fef08a',
    strokeColor: '#ca8a04',
    fillColor: '#fef08a',
    strokeWidth: 1,
    fontSize: 13,
    fontWeight: 'normal',
    textAlign: 'left',
    text: '⚡ Sprint Focus\n• Infinite Canvas Shell\n• Fabric.js Engine Mount\n• Realtime Socket Sync',
  },
  // 2. Sticky Note 2 (Mint Green)
  {
    id: 'mock-sticky-2',
    type: 'sticky',
    x: 230,
    y: 280,
    width: 210,
    height: 170,
    stickyColor: '#bbf7d0',
    strokeColor: '#16a34a',
    fillColor: '#bbf7d0',
    strokeWidth: 1,
    fontSize: 13,
    fontWeight: 'normal',
    textAlign: 'left',
    text: '🌱 Backlog Tasks\n• Vector anchor snapping\n• Multi-cursor interpolation\n• Export SVG / PNG vectors',
  },
  // 3. Text Label 1: Main Title
  {
    id: 'mock-text-1',
    type: 'text',
    x: 480,
    y: 85,
    width: 320,
    height: 36,
    strokeColor: '#1e293b',
    fillColor: 'transparent',
    strokeWidth: 1,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'left',
    text: 'Webster Sprint Canvas',
  },
  // 4. Text Label 2: Flow Subtitle
  {
    id: 'mock-text-2',
    type: 'text',
    x: 480,
    y: 125,
    width: 260,
    height: 28,
    strokeColor: '#64748b',
    fillColor: 'transparent',
    strokeWidth: 1,
    fontSize: 14,
    fontWeight: 'normal',
    textAlign: 'left',
    text: 'System Architecture Flow',
  },
  // 5. Flowchart Node 1: Circle ("Frontend")
  {
    id: 'mock-circle-1',
    type: 'circle',
    x: 480,
    y: 180,
    width: 100,
    height: 100,
    strokeColor: '#6366f1',
    fillColor: '#eef2ff',
    strokeWidth: 2,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    text: 'Frontend',
  },
  // 6. Arrow 1: Frontend -> API
  {
    id: 'mock-arrow-1',
    type: 'arrow',
    x: 590,
    y: 230,
    width: 60,
    height: 16,
    strokeColor: '#6366f1',
    strokeWidth: 2,
    fillColor: '#6366f1',
    text: '',
  },
  // 7. Flowchart Node 2: Diamond ("API")
  {
    id: 'mock-diamond-1',
    type: 'diamond',
    x: 660,
    y: 180,
    width: 100,
    height: 100,
    strokeColor: '#8b5cf6',
    fillColor: '#ede9fe',
    strokeWidth: 2,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    text: 'API',
  },
  // 8. Arrow 2: API -> Database
  {
    id: 'mock-arrow-2',
    type: 'arrow',
    x: 770,
    y: 230,
    width: 60,
    height: 16,
    strokeColor: '#8b5cf6',
    strokeWidth: 2,
    fillColor: '#8b5cf6',
    text: '',
  },
  // 9. Flowchart Node 3: Rounded Rect ("Database")
  {
    id: 'mock-rect-2',
    type: 'rectangle',
    x: 840,
    y: 185,
    width: 110,
    height: 90,
    strokeColor: '#10b981',
    fillColor: '#ecfdf5',
    strokeWidth: 2,
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    text: 'Database',
    borderRadius: 8,
  },
  // 10. Main Shape: Architecture Blueprint Rectangle
  {
    id: 'mock-rect-1',
    type: 'rectangle',
    x: 480,
    y: 310,
    width: 470,
    height: 150,
    strokeColor: '#8b5cf6',
    fillColor: '#ede9fe',
    strokeWidth: 2,
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
    text: 'Architecture Blueprint',
    borderRadius: 8,
    opacity: 1,
  },
  // 11. Freehand Sketch / Drawing 1
  {
    id: 'mock-brush-1',
    type: 'brush',
    x: 760,
    y: 110,
    width: 140,
    height: 35,
    strokeColor: '#6366f1',
    strokeWidth: 3,
    text: '',
    points: [
      { x: 0, y: 15 },
      { x: 25, y: 5 },
      { x: 50, y: 20 },
      { x: 80, y: 8 },
      { x: 110, y: 18 },
      { x: 135, y: 10 },
    ],
  },
];

/**
 * Simulated Collaborator Presence for UI Preview and Simulation Mode
 */
export const MOCK_COLLABORATORS: Collaborator[] = [
  {
    id: 'collab-1',
    name: 'Alex Lee (Engine Lead)',
    color: '#3b82f6',
    cursor: { x: 380, y: 230 },
    lastActive: Date.now(),
  },
  {
    id: 'collab-2',
    name: 'Sam Blake (Backend Lead)',
    color: '#10b981',
    cursor: { x: 660, y: 290 },
    lastActive: Date.now(),
  },
  {
    id: 'collab-3',
    name: 'Elena Morales (UI/UX)',
    color: '#f59e0b',
    cursor: { x: 790, y: 160 },
    lastActive: Date.now(),
  },
  {
    id: 'collab-4',
    name: 'Marcus Vance (DevOps)',
    color: '#8b5cf6',
    cursor: { x: 520, y: 440 },
    lastActive: Date.now(),
  },
  {
    id: 'collab-5',
    name: 'Priya Sharma (QA Lead)',
    color: '#ec4899',
    cursor: { x: 410, y: 350 },
    lastActive: Date.now(),
  },
  {
    id: 'collab-6',
    name: 'Maya Lin (Product)',
    color: '#06b6d4',
    cursor: { x: 920, y: 210 },
    lastActive: Date.now(),
  },
];
