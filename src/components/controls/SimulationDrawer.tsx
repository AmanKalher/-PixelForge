import React, { useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { ConnectionStatus } from '../../types/whiteboard';
import { MockCanvasAdapter } from '../../adapters/mockCanvasAdapter';
import {
  Sliders,
  X,
  Wifi,
  WifiOff,
  RefreshCw,
  HardDrive,
  Eye,
  Users,
  AlertTriangle,
  Code2,
  FileQuestion,
} from 'lucide-react';

export const SimulationDrawer: React.FC = () => {
  const {
    isSimulationDrawerOpen,
    setIsSimulationDrawerOpen,
    simulationSettings,
    updateSimulatedStatus,
    toggleUIPreviewMode,
    isUIPreviewMode,
    toggleDemoCollaborators,
    setSimulatedCollaboratorCount,
    collaborators,
    toggleEmptyBoard,
    toggleErrorState,
    canvasEngine,
  } = useWorkspace();

  useEffect(() => {
    if (!isSimulationDrawerOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSimulationDrawerOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSimulationDrawerOpen, setIsSimulationDrawerOpen]);

  if (!isSimulationDrawerOpen) return null;

  const lastCanvasAction =
    canvasEngine instanceof MockCanvasAdapter
      ? canvasEngine.lastAction
      : null;

  const statuses: {
    label: string;
    status: ConnectionStatus;
    icon: React.ReactNode;
  }[] = [
    {
      label: 'Live Connected (WebSocket Active)',
      status: 'connected',
      icon: <Wifi className="w-4 h-4 text-[#5D8B55]" />,
    },
    {
      label: 'Connecting / Reconnecting Socket',
      status: 'reconnecting',
      icon: <RefreshCw className="w-4 h-4 text-[#F7D774] animate-spin" />,
    },
    {
      label: 'Disconnected / Offline Mode',
      status: 'offline',
      icon: <WifiOff className="w-4 h-4 text-[#F26B5B]" />,
    },
    {
      label: 'Cached (IndexedDB)',
      status: 'cached',
      icon: <HardDrive className="w-4 h-4 text-[#6D3B67]" />,
    },
    {
      label: 'Saved (PostgreSQL)',
      status: 'saved',
      icon: <HardDrive className="w-4 h-4 text-[#5D8B55]" />,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-[#302633]/30 backdrop-blur-xs flex justify-end animate-in fade-in duration-150 select-none"
      onClick={() => setIsSimulationDrawerOpen(false)}
    >
      <div
        className="w-full max-w-sm h-full bg-white border-l border-[#EFE5D8] p-5 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 text-[#302633]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1]">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-[#FFF0ED] text-[#F26B5B]">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#302633] tracking-tight">
                  Dev Simulation Drawer
                </h3>
                <p className="text-[11px] text-[#302633]/60">
                  UI Preview & Edge Case Harness
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSimulationDrawerOpen(false)}
              className="p-1 rounded-lg text-[#302633]/40 hover:text-[#302633] hover:bg-[#FFF9F0] transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Warning Banner */}
          <div className="p-3 bg-[#FFFDF0] border border-[#F7D774]/50 rounded-xl text-xs text-[#302633]/80">
            <strong>Development Tooling Only:</strong> The switches below toggle mock UI states to evaluate edge states without requiring real backend/engine connections.
          </div>

          {/* Connection & Persistence Status Simulators */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#302633]">
              Simulate Connection & Storage Status
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {statuses.map(({ label, status, icon }) => {
                const isSelected = simulationSettings.simulatedStatus === status;
                return (
                  <button
                    key={status}
                    onClick={() => updateSimulatedStatus(status)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#FFF0ED] border-[#F26B5B] text-[#F26B5B] shadow-2xs font-semibold'
                        : 'bg-[#FFFDF9] border-[#EFE5D8] text-[#302633]/70 hover:text-[#302633] hover:border-[#F26B5B]/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {icon}
                      <span>{label}</span>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#FFF0ED] text-[#F26B5B]">
                        Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* UI Feature Toggles */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#302633]">
              Workspace Simulation Flags
            </label>
            <div className="bg-[#FFFDF9] border border-[#EFE5D8] rounded-xl divide-y divide-[#EFE5D8]">
              {/* Toggle UI Preview Mode */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2 text-xs text-[#302633]">
                  <Eye className="w-4 h-4 text-[#6D3B67]" />
                  <div>
                    <div className="font-semibold text-[#302633]">UI Preview Objects</div>
                    <div className="text-[10px] text-[#302633]/50">
                      Sample notes and shapes
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isUIPreviewMode}
                  onChange={toggleUIPreviewMode}
                  className="w-4 h-4 rounded text-[#F26B5B] accent-[#F26B5B] bg-white border-[#EFE5D8] cursor-pointer"
                />
              </div>

              {/* Toggle Demo Collaborators */}
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-[#302633]">
                    <Users className="w-4 h-4 text-[#5D8B55]" />
                    <div>
                      <div className="font-semibold text-[#302633]">Demo Collaborators</div>
                      <div className="text-[10px] text-[#302633]/50">
                        {collaborators.length} active in room
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={simulationSettings.showDemoCollaborators}
                    onChange={() => toggleDemoCollaborators()}
                    className="w-4 h-4 rounded text-[#F26B5B] accent-[#F26B5B] bg-white border-[#EFE5D8] cursor-pointer"
                  />
                </div>

                {simulationSettings.showDemoCollaborators && (
                  <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-[#302633]/50 font-medium">Presets:</span>
                    {[
                      { label: 'Solo (0)', count: 0 },
                      { label: '1 User', count: 1 },
                      { label: '3 Users', count: 3 },
                      { label: '5 Users (+2)', count: 5 },
                      { label: '6 Users (+3)', count: 6 },
                    ].map(({ label, count }) => (
                      <button
                        key={count}
                        onClick={() => setSimulatedCollaboratorCount(count)}
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition cursor-pointer ${
                          collaborators.length === count
                            ? 'bg-[#F26B5B] text-white border-[#F26B5B] font-semibold'
                            : 'bg-white text-[#302633]/70 border-[#EFE5D8] hover:border-[#F26B5B]/30'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Toggle Empty Board */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2 text-xs text-[#302633]">
                  <FileQuestion className="w-4 h-4 text-[#F7D774]" />
                  <div>
                    <div className="font-semibold text-[#302633]">Empty Board State</div>
                    <div className="text-[10px] text-[#302633]/50">
                      Hide all sample elements
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={simulationSettings.isEmptyBoard}
                  onChange={() => toggleEmptyBoard()}
                  className="w-4 h-4 rounded text-[#F26B5B] accent-[#F26B5B] bg-white border-[#EFE5D8] cursor-pointer"
                />
              </div>

              {/* Toggle Error State */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2 text-xs text-[#302633]">
                  <AlertTriangle className="w-4 h-4 text-[#F26B5B]" />
                  <div>
                    <div className="font-semibold text-[#302633]">Simulate Error Alert</div>
                    <div className="text-[10px] text-[#302633]/50">
                      Test disconnected banner
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={simulationSettings.isErrorState}
                  onChange={() => toggleErrorState()}
                  className="w-4 h-4 rounded text-[#F26B5B] accent-[#F26B5B] bg-white border-[#EFE5D8] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Last Contract Invocation Inspector */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[#302633]">
              <Code2 className="w-3.5 h-3.5 text-[#6D3B67]" />
              <span>Last Canvas Contract Call</span>
            </div>
            <div className="bg-[#FFFDF9] p-2.5 rounded-xl border border-[#EFE5D8] text-[11px] font-mono text-[#302633] overflow-x-auto">
              {lastCanvasAction ? (
                <div>
                  <div className="text-[#6D3B67] font-bold">
                    .{lastCanvasAction.action}()
                  </div>
                  <pre className="text-[#302633]/60 text-[10px] mt-1">
                    {JSON.stringify(lastCanvasAction.payload ?? {}, null, 2)}
                  </pre>
                </div>
              ) : (
                <span className="text-[#302633]/40">No calls dispatched yet</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-[#EFE5D8] text-[10px] text-[#302633]/40 text-center">
          PixelForge v0.1 • Member 1 UI/UX Shell
        </div>
      </div>
    </div>
  );
};
