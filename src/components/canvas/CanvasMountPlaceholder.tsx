import React from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';

export const CanvasMountPlaceholder: React.FC = () => {
  const { isGridSnapEnabled, zoom, pan } = useWorkspace();

  const gridStep = (isGridSnapEnabled ? 24 : 32) * zoom;

  return (
    <div
      id="pixelforge-canvas-container"
      className="absolute inset-0 overflow-hidden bg-[#F8FAFC] flex items-center justify-center pt-12"
      style={{
        backgroundImage: isGridSnapEnabled
          ? `radial-gradient(circle, #CBD5E1 ${Math.max(1, 1.5 * zoom)}px, transparent ${Math.max(1, 1.5 * zoom)}px)`
          : `radial-gradient(circle, #CBD5E1 ${Math.max(1, 1 * zoom)}px, transparent ${Math.max(1, 1 * zoom)}px)`,
        backgroundSize: `${gridStep}px ${gridStep}px`,
        backgroundPosition: `${pan.x}px ${pan.y}px`,
      }}
    >
      {/* 
        MEMBER 2 INTEGRATION BOUNDARY:
        canvas#pixelforge-fabric-mount is strictly reserved for Member 2's Fabric.js instance.
        Do NOT initialize Fabric.js, draw on canvas context, or add low-level event listeners here.
      */}
      <canvas
        id="pixelforge-fabric-mount"
        className="w-full h-full block cursor-crosshair pointer-events-auto"
      />
    </div>
  );
};
