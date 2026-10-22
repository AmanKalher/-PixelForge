import React from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';

/**
 * Collaborator Live Cursor Overlay
 * Renders real-time remote user cursors that scale and pan seamlessly with the infinite canvas.
 */
export const LiveCursorOverlay: React.FC = () => {
  const { collaborators, simulationSettings, pan, zoom } = useWorkspace();

  if (!simulationSettings.showDemoCollaborators || !collaborators || collaborators.length === 0) {
    return null;
  }

  return (
    <div
      style={{
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        transformOrigin: '0 0',
      }}
      className="absolute inset-0 pointer-events-none z-20 overflow-visible select-none"
    >
      {collaborators.map((collab) => {
        if (!collab.cursor) return null;
        const displayName = collab.name.replace(/\(.*?\)/g, '').trim();

        return (
          <div
            key={collab.id}
            style={{
              position: 'absolute',
              left: `${collab.cursor.x}px`,
              top: `${collab.cursor.y}px`,
              transition: 'transform 0.12s cubic-bezier(0.2, 0, 0, 1), left 0.12s ease-out, top 0.12s ease-out',
            }}
            className="flex items-start gap-1 pointer-events-none"
          >
            {/* SVG Cursor Pointer with Border & Shadow */}
            <svg
              className="w-4 h-4 drop-shadow-sm filter"
              viewBox="0 0 24 24"
              fill={collab.color}
              stroke="#ffffff"
              strokeWidth="1.5"
            >
              <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.36z" />
            </svg>

            {/* Collaborator Name Label Tag */}
            <div
              style={{ backgroundColor: collab.color }}
              className="text-white text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-xs whitespace-nowrap tracking-tight"
            >
              {displayName}
            </div>
          </div>
        );
      })}
    </div>
  );
};
