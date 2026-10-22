import React, { useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { ConnectionStatus } from '../../types/whiteboard';
import {
  Sliders,
  X,
  Wifi,
  RefreshCw,
  WifiOff,
  Database,
  CloudCheck,
  Users,
  Eye,
  FileQuestion,
  AlertTriangle,
  Code2,
} from 'lucide-react';
import { MockCanvasAdapter } from '../../adapters/mockCanvasAdapter';

export const SimulationDrawer: React.FC = () => {
  const {
    isSimulationDrawerOpen,
    setIsSimulationDrawerOpen,
    simulationSettings,
    updateSimulatedStatus,
    toggleDemoCollaborators,
    setSimulatedCollaboratorCount,
    toggleEmptyBoard,
    toggleErrorState,
    isUIPreviewMode,
    toggleUIPreviewMode,
    canvasEngine,
    collaborators,
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

  const statuses: { label: string; status: ConnectionStatus; icon: React.ReactNode }[] = [
    { label: 'Connected', status: 'connected', icon: <Wifi className="w-3.5 h-3.5" /> },
    { label: 'Reconnecting', status: 'reconnecting', icon: <RefreshCw className="w-3.5 h-3.5" /> },
    { label: 'Offline', status: 'offline', icon: <WifiOff className="w-3.5 h-3.5" /> },
    { label: 'Cached (IndexedDB)', status: 'cached', icon: <Database className="w-3.5 h-3.5" /> },
    { label: 'Saved (PostgreSQL)', status: 'saved', icon: <CloudCheck className="w-3.5 h-3.5" /> },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex justify-end"
      onClick={() => setIsSimulationDrawerOpen(false)}
    >
      <div
        className="w-full max-w-sm h-full bg-white border-l border-slate-200 p-5 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                  Dev Simulation Drawer
                </h3>
                <p className="text-[11px] text-slate-500">
                  UI Preview & Edge Case Harness
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSimulationDrawerOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Warning Banner */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
            <strong>Development Tooling Only:</strong> The switches below toggle mock UI states to evaluate edge states without requiring real backend/engine connections.
          </div>

          {/* Connection & Persistence Status Simulators */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-700">
              Simulate Connection & Storage Status
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {statuses.map(({ label, status, icon }) => {
                const isSelected = simulationSettings.simulatedStatus === status;
                return (
                  <button
                    key={status}
                    onClick={() => updateSimulatedStatus(status)}
                    className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium border transition ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs font-semibold'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {icon}
                      <span>{label}</span>
                    </div>
                    {isSelected && (
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">
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
            <label className="block text-xs font-semibold text-slate-700">
              Workspace Simulation Flags
            </label>
            <div className="bg-slate-50 border border-slate-200 rounded-xl divide-y divide-slate-200">
              {/* Toggle UI Preview Mode */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <Eye className="w-4 h-4 text-indigo-600" />
                  <div>
                    <div className="font-semibold text-slate-800">UI Preview Objects</div>
                    <div className="text-[10px] text-slate-500">
                      Sample notes and shapes
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isUIPreviewMode}
                  onChange={toggleUIPreviewMode}
                  className="w-4 h-4 rounded text-indigo-600 bg-white border-slate-300 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Toggle Demo Collaborators */}
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-700">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-semibold text-slate-800">Demo Collaborators</div>
                      <div className="text-[10px] text-slate-500">
                        {collaborators.length} active in room
                      </div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={simulationSettings.showDemoCollaborators}
                    onChange={() => toggleDemoCollaborators()}
                    className="w-4 h-4 rounded text-indigo-600 bg-white border-slate-300 focus:ring-0 cursor-pointer"
                  />
                </div>

                {simulationSettings.showDemoCollaborators && (
                  <div className="pt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] text-slate-500 font-medium">Presets:</span>
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
                        className={`text-[10px] px-2 py-0.5 rounded-full border transition ${
                          collaborators.length === count
                            ? 'bg-indigo-600 text-white border-indigo-600 font-semibold'
                            : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
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
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <FileQuestion className="w-4 h-4 text-amber-600" />
                  <div>
                    <div className="font-semibold text-slate-800">Empty Board State</div>
                    <div className="text-[10px] text-slate-500">
                      Hide all sample elements
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={simulationSettings.isEmptyBoard}
                  onChange={() => toggleEmptyBoard()}
                  className="w-4 h-4 rounded text-indigo-600 bg-white border-slate-300 focus:ring-0 cursor-pointer"
                />
              </div>

              {/* Toggle Error State */}
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <div>
                    <div className="font-semibold text-slate-800">Simulate Error Alert</div>
                    <div className="text-[10px] text-slate-500">
                      Test disconnected banner
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={simulationSettings.isErrorState}
                  onChange={() => toggleErrorState()}
                  className="w-4 h-4 rounded text-indigo-600 bg-white border-slate-300 focus:ring-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Last Contract Invocation Inspector */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
              <Code2 className="w-3.5 h-3.5 text-indigo-600" />
              <span>Last Canvas Contract Call</span>
            </div>
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-800 overflow-x-auto">
              {lastCanvasAction ? (
                <div>
                  <div className="text-indigo-600 font-bold">
                    .{lastCanvasAction.action}()
                  </div>
                  <pre className="text-slate-500 text-[10px] mt-1">
                    {JSON.stringify(lastCanvasAction.payload ?? {}, null, 2)}
                  </pre>
                </div>
              ) : (
                <span className="text-slate-400">No calls dispatched yet</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-400 text-center">
          PixelForge v0.1 • Member 1 UI/UX Shell
        </div>
      </div>
    </div>
  );
};

