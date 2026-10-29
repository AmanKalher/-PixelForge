import { useEffect } from 'react';
import { ToolType } from '../types/whiteboard';
import { globalFabricCanvasAdapter } from '../engine/fabricCanvasAdapter';

interface KeyboardShortcutsOptions {
  onSelectTool: (tool: ToolType) => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onEscape: () => void;
  onDelete: () => void;
  disabled?: boolean;
}

export function useKeyboardShortcuts({
  onSelectTool,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onEscape,
  onDelete,
  disabled = false,
}: KeyboardShortcutsOptions) {
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Guard against active text editing in inputs, textareas, selects, contenteditables, or Fabric.js editing
      const activeFabricObj = globalFabricCanvasAdapter.getCanvas()?.getActiveObject() as any;
      if (activeFabricObj && activeFabricObj.isEditing) {
        if (e.key === 'Escape') {
          activeFabricObj.exitEditing?.();
          onEscape();
        }
        return;
      }

      const target = e.target as HTMLElement | null;
      const isFabricHiddenTextarea =
        target &&
        target.tagName === 'TEXTAREA' &&
        (target.classList.contains('fabric-canvas-textarea') ||
          target.classList.contains('canvas-hidden-textarea') ||
          Boolean(target.closest?.('.canvas-container')) ||
          Boolean(target.closest?.('[data-fabric]')));

      if (
        target &&
        !isFabricHiddenTextarea &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        // If Escape is pressed while inside an input/textarea, blur it or handle escape
        if (e.key === 'Escape') {
          target.blur();
          onEscape();
        }
        return;
      }

      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      // Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        onEscape();
        return;
      }

      // Delete / Backspace
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        onDelete();
        return;
      }

      // Undo / Redo
      if (isCtrlOrMeta && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        if (e.shiftKey) {
          onRedo();
        } else {
          onUndo();
        }
        return;
      }

      // Redo alternative (Ctrl+Y)
      if (isCtrlOrMeta && (e.key === 'y' || e.key === 'Y')) {
        e.preventDefault();
        onRedo();
        return;
      }

      // Duplicate shortcut (Ctrl+D / Cmd+D)
      if (isCtrlOrMeta && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        globalFabricCanvasAdapter.duplicateSelected();
        return;
      }

      // Arrow keys nudging
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const canvas = globalFabricCanvasAdapter.getCanvas();
        const active = canvas?.getActiveObject() as any;
        if (active && !active.isEditing) {
          e.preventDefault();
          const step = e.shiftKey ? 10 : 1;
          const delta: Record<string, [number, number]> = {
            ArrowUp: [0, -step],
            ArrowDown: [0, step],
            ArrowLeft: [-step, 0],
            ArrowRight: [step, 0],
          };
          const [dx, dy] = delta[e.key] || [0, 0];
          globalFabricCanvasAdapter.nudgeSelected(dx, dy);
          return;
        }
      }

      // Zoom In (+ or =)
      if (e.key === '+' || e.key === '=') {
        e.preventDefault();
        onZoomIn();
        return;
      }

      // Zoom Out (-)
      if (e.key === '-' || e.key === '_') {
        e.preventDefault();
        onZoomOut();
        return;
      }

      // Don't intercept tools if modifier keys are pressed
      if (isCtrlOrMeta || e.altKey) return;

      // Tool shortcuts (Section 7)
      switch (e.key.toLowerCase()) {
        case 'v':
          e.preventDefault();
          onSelectTool('select');
          break;
        case 'q':
          e.preventDefault();
          onSelectTool('lasso');
          break;
        case 'h':
          e.preventDefault();
          onSelectTool('pan');
          break;
        case 'p':
          e.preventDefault();
          onSelectTool('brush');
          break;
        case 'r':
          e.preventDefault();
          onSelectTool('rectangle');
          break;
        case 'o':
          e.preventDefault();
          onSelectTool('circle');
          break;
        case 'l':
          e.preventDefault();
          onSelectTool('highlighter');
          break;
        case 'e':
          e.preventDefault();
          onSelectTool('eraser');
          break;
        case 'a':
          e.preventDefault();
          onSelectTool('arrow');
          break;
        case 's':
          e.preventDefault();
          onSelectTool('sticky');
          break;
        case 't':
          e.preventDefault();
          onSelectTool('text');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onSelectTool,
    onUndo,
    onRedo,
    onZoomIn,
    onZoomOut,
    onEscape,
    onDelete,
    disabled,
  ]);
}
