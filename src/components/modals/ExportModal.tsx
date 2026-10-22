import React, { useState, useEffect } from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';
import { ExportFormat, ExportResult } from '../../types/whiteboard';
import {
  Download,
  FileImage,
  Code,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
} from 'lucide-react';

export const ExportModal: React.FC = () => {
  const { isExportModalOpen, setIsExportModalOpen, exportCanvas } = useWorkspace();

  const [format, setFormat] = useState<ExportFormat>('png');
  const [includeGrid, setIncludeGrid] = useState<boolean>(false);
  const [includeBackground, setIncludeBackground] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isExportModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsExportModalOpen(false);
        setResult(null);
        setError(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isExportModalOpen, setIsExportModalOpen]);

  if (!isExportModalOpen) return null;

  const handleExport = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      // Simulate network / render tick
      await new Promise((res) => setTimeout(res, 400));
      const res = await exportCanvas({
        format,
        includeGrid,
        includeBackground,
      });
      setResult(res);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'An error occurred during canvas export.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsExportModalOpen(false);
    setResult(null);
    setError(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 shadow-xl animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Export Canvas</h3>
              <p className="text-xs text-slate-500">
                Save whiteboard snapshot as image or vector
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close modal"
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selection */}
        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setFormat('png')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium transition ${
                  format === 'png'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <FileImage className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-semibold text-slate-800">PNG Image</div>
                  <span className="text-[10px] text-slate-500">Raster bitmap</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('svg')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium transition ${
                  format === 'svg'
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 shadow-2xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Code className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <div className="text-left">
                  <div className="font-semibold text-slate-800">SVG Vector</div>
                  <span className="text-[10px] text-slate-500">Scalable vector</span>
                </div>
              </button>
            </div>
          </div>

          {/* Options toggles */}
          <div className="space-y-2.5 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer">
              <span>Include Background Color</span>
              <input
                type="checkbox"
                checked={includeBackground}
                onChange={(e) => setIncludeBackground(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between text-xs text-slate-700 cursor-pointer">
              <span>Include Canvas Grid Pattern</span>
              <input
                type="checkbox"
                checked={includeGrid}
                onChange={(e) => setIncludeGrid(e.target.checked)}
                className="w-4 h-4 rounded text-indigo-600 bg-white border-slate-300 focus:ring-0 focus:ring-offset-0 cursor-pointer"
              />
            </label>
          </div>

          {/* Result Feedback Banner */}
          {result && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1 animate-in fade-in duration-100">
              <div className="flex items-center gap-1.5 font-medium text-emerald-800">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Simulated Export Request Executed</span>
              </div>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                {result.message}
              </p>
              <p className="text-[10px] text-emerald-600 italic">
                (Member 2's Fabric.js canvas will produce the binary file download when integrated.)
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-xs transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Confirm Export</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

