import React, { useEffect, useRef, useState } from 'react';
import { Canvas } from 'fabric';
import { useWorkspace } from '../../context/WorkspaceContext';
import { globalFabricCanvasAdapter } from '../../engine/fabricCanvasAdapter';
import { AlertCircle, RefreshCw } from 'lucide-react';

export const CanvasMountPlaceholder: React.FC = () => {
  const { isGridSnapEnabled, zoom } = useWorkspace();
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  const gridStep = (isGridSnapEnabled ? 24 : 32) * zoom;

  useEffect(() => {
    if (!canvasElRef.current || !containerRef.current) return;

    let disposed = false;
    let resizeObserver: ResizeObserver | null = null;

    try {
      const container = containerRef.current;
      const initialWidth = container.clientWidth || window.innerWidth;
      const initialHeight = container.clientHeight || window.innerHeight;

      // 1. Initialize Fabric.js Canvas instance
      const canvas = new Canvas(canvasElRef.current, {
        width: initialWidth,
        height: initialHeight,
        backgroundColor: 'rgba(0, 0, 0, 0)',
        preserveObjectStacking: true,
        selection: true,
        enablePointerEvents: true,
      });

      fabricRef.current = canvas;

      // 2. Attach to adapter contract (starts with clean empty workspace)
      globalFabricCanvasAdapter.attachCanvas(canvas);
      if (typeof window !== 'undefined') {
        (window as any).__fabricCanvas = canvas;
        (window as any).__canvasAdapter = globalFabricCanvasAdapter;
      }

      // 3. Handle container resize dynamically
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect && !disposed && canvas) {
            const { width, height } = entry.contentRect;
            if (width > 0 && height > 0) {
              canvas.setDimensions({ width, height });
              canvas.requestRenderAll();
            }
          }
        }
      });
      resizeObserver.observe(container);
    } catch (err: any) {
      console.error('[PixelForge] Fabric.js initialization failed:', err);
      setInitError(err?.message || 'Failed to initialize Fabric.js canvas');
    }

    return () => {
      disposed = true;
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
      globalFabricCanvasAdapter.detachCanvas();
      if (fabricRef.current) {
        try {
          fabricRef.current.dispose();
        } catch {
          // ignore dispose error on unmount
        }
        fabricRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="pixelforge-canvas-container"
      className="absolute inset-0 overflow-hidden bg-[#FAF8F5] flex items-center justify-center pt-[76px] select-none"
      style={{
        backgroundImage: isGridSnapEnabled
          ? `radial-gradient(circle, #DFD6CA ${Math.max(1, 1.5 * zoom)}px, transparent ${Math.max(1, 1.5 * zoom)}px)`
          : `radial-gradient(circle, #DFD6CA ${Math.max(1, 1 * zoom)}px, transparent ${Math.max(1, 1 * zoom)}px)`,
        backgroundSize: `${gridStep}px ${gridStep}px`,
      }}
    >
      {initError ? (
        <div className="z-30 p-6 bg-red-50 border border-red-200 rounded-2xl shadow-lg max-w-md text-center text-slate-800 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-red-100 flex items-center justify-center text-red-600">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-red-900">Canvas Engine Initialization Error</h3>
          <p className="text-xs text-red-700">{initError}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg shadow transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Reload Canvas
          </button>
        </div>
      ) : (
        <canvas
          ref={canvasElRef}
          id="pixelforge-fabric-mount"
          className="w-full h-full block touch-none"
        />
      )}
    </div>
  );
};
