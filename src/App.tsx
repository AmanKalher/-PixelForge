import React from 'react';
import { WorkspaceProvider, useWorkspace } from './context/WorkspaceContext';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { WorkspaceHeader } from './components/header/WorkspaceHeader';
import { LeftToolbar } from './components/toolbar/LeftToolbar';
import { FloatingBoardToolbar } from './components/toolbar/FloatingBoardToolbar';
import { ContextualStyleBar } from './components/controls/ContextualStyleBar';
import { CanvasMountPlaceholder } from './components/canvas/CanvasMountPlaceholder';
import { UIPreviewOverlay } from './components/canvas/UIPreviewOverlay';
import { LiveCursorOverlay } from './components/presence/LiveCursorOverlay';
import { BottomLeftControls } from './components/controls/BottomLeftControls';
import { BottomRightControls } from './components/controls/BottomRightControls';
import { LayersPanel } from './components/controls/LayersPanel';
import { SimulationDrawer } from './components/controls/SimulationDrawer';
import { GuestEntryModal } from './components/modals/GuestEntryModal';
import { GuestEntryPage } from './components/entry/GuestEntryPage';
import { ExportModal } from './components/modals/ExportModal';
import { ShareModal } from './components/modals/ShareModal';
import { HistoryModal } from './components/modals/HistoryModal';

const WorkspaceShell: React.FC = () => {
  const {
    activeNav,
    setActiveNav,
    setActiveTool,
    undo,
    redo,
    zoomIn,
    zoomOut,
    deleteSelected,
    setSelectedMockObjectId,
    setEditingObjectId,
    setIsShapesPopoverOpen,
    setIsSimulationDrawerOpen,
    isLayersPanelOpen,
    toggleLayersPanel,
    isGuestModalOpen,
    isExportModalOpen,
    isShareModalOpen,
    isHistoryModalOpen,
    guestUser,
  } = useWorkspace();

  const isAnyModalOpen =
    isGuestModalOpen || isExportModalOpen || isShareModalOpen || isHistoryModalOpen;

  // Global Keyboard Shortcuts
  useKeyboardShortcuts({
    onSelectTool: setActiveTool,
    onUndo: undo,
    onRedo: redo,
    onZoomIn: zoomIn,
    onZoomOut: zoomOut,
    onDelete: deleteSelected,
    onEscape: () => {
      if (activeNav) setActiveNav(null);
      setIsShapesPopoverOpen(false);
      setIsSimulationDrawerOpen(false);
      if (isLayersPanelOpen) toggleLayersPanel();
      setSelectedMockObjectId(null);
      setEditingObjectId(null);
    },
    disabled: isAnyModalOpen || !guestUser.hasEntered,
  });

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#FAF8F5] font-sans text-[#302633] select-none">
      {/* 1. Canvas Host Container (Member 2 Fabric.js mount point) */}
      <CanvasMountPlaceholder />

      {/* 2. UI Preview Mode Visual Objects Overlay */}
      <UIPreviewOverlay />

      {/* 3. Realtime Collaborator Live Cursors Overlay */}
      <LiveCursorOverlay />

      {/* 5. Top Header & Navigation Bar */}
      <WorkspaceHeader />

      {/* 6. Left Navigation Rail & Flyout Panels */}
      <LeftToolbar />

      {/* 7. Tools Panel (Toolbar rendered in vertical panel beside rail when Tools is selected) */}
      {activeNav === 'tools' && (
        <FloatingBoardToolbar
          vertical
          onClose={() => setActiveNav(null)}
        />
      )}

      {/* 8. Contextual Style Bar (active when drawing or mock object selected) */}
      <ContextualStyleBar />

      {/* 7. Bottom-Left History & Undo/Redo Controls */}
      <BottomLeftControls />

      {/* 8. Bottom-Right Zoom, Viewport & Minimap Controls */}
      <BottomRightControls />

      {/* 9. Layers / Objects Management Panel */}
      <LayersPanel />

      {/* 10. Dev Simulation Settings Drawer */}
      <SimulationDrawer />

      {/* 11. Modals & Dialogs */}
      <GuestEntryModal />
      <ExportModal />
      <ShareModal />
      <HistoryModal />

      {/* 12. Full-Page Guest Entry Gate (Shows when user hasn't joined board yet) */}
      {!guestUser.hasEntered && <GuestEntryPage />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <WorkspaceProvider>
      <WorkspaceShell />
    </WorkspaceProvider>
  );
};

export default App;

