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
      await new Promise((res) => setTimeout(res, 300));
      const res = await exportCanvas({
        format,
        includeGrid,
        includeBackground,
      });
      setResult(res);

      // Trigger automatic file download if real binary data-URI was generated
      if (res.dataUrl) {
        const link = document.createElement('a');
        link.download = `pixelforge-canvas-${Date.now()}.${format}`;
        link.href = res.dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
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
      className="fixed inset-0 z-50 bg-[#302633]/30 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div
        className="bg-white border border-[#EFE5D8] rounded-2xl w-full max-w-md p-6 shadow-xl shadow-[#6D3B67]/5 animate-in zoom-in-95 duration-150 text-[#302633]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F0EAE1]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FFF0ED] border border-[#FCD9D3] text-[#F26B5B] flex items-center justify-center">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#302633]">Export Canvas</h3>
              <p className="text-xs text-[#302633]/60">
                Save whiteboard snapshot as image or vector
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            aria-label="Close modal"
            className="p-1 rounded-md text-[#302633]/40 hover:text-[#302633] hover:bg-[#FFF9F0] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selection */}
        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#302633] mb-2">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setFormat('png')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium transition cursor-pointer ${
                  format === 'png'
                    ? 'bg-[#FFF0ED] border-[#F26B5B] text-[#F26B5B] shadow-2xs font-semibold'
                    : 'bg-[#FFFDF9] border-[#EFE5D8] text-[#302633]/70 hover:text-[#302633] hover:border-[#F26B5B]/30'
                }`}
              >
                <FileImage className="w-4 h-4 text-[#F26B5B] flex-shrink-0" />
                <div className="text-left">
                  <div className="font-semibold text-[#302633]">PNG Image</div>
                  <span className="text-[10px] text-[#302633]/50">Raster bitmap</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormat('svg')}
                className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-medium transition cursor-pointer ${
                  format === 'svg'
                    ? 'bg-[#FFF0ED] border-[#F26B5B] text-[#F26B5B] shadow-2xs font-semibold'
                    : 'bg-[#FFFDF9] border-[#EFE5D8] text-[#302633]/70 hover:text-[#302633] hover:border-[#F26B5B]/30'
                }`}
              >
                <Code className="w-4 h-4 text-[#F26B5B] flex-shrink-0" />
                <div className="text-left">
                  <div className="font-semibold text-[#302633]">SVG Vector</div>
                  <span className="text-[10px] text-[#302633]/50">Scalable vector</span>
                </div>
              </button>
            </div>
          </div>

          {/* Options toggles */}
          <div className="space-y-2.5 bg-[#FFFDF9] p-3.5 rounded-xl border border-[#EFE5D8]">
            <label className="flex items-center justify-between text-xs text-[#302633] cursor-pointer">
              <span>Include Background Color</span>
              <input
                type="checkbox"
                checked={includeBackground}
                onChange={(e) => setIncludeBackground(e.target.checked)}
                className="w-4 h-4 rounded text-[#F26B5B] accent-[#F26B5B] bg-white border-[#EFE5D8] cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between text-xs text-[#302633] cursor-pointer">
              <span>Include Canvas Grid Pattern</span>
              <input
                type="checkbox"
                checked={includeGrid}
                onChange={(e) => setIncludeGrid(e.target.checked)}
                className="w-4 h-4 rounded text-[#F26B5B] accent-[#F26B5B] bg-white border-[#EFE5D8] cursor-pointer"
              />
            </label>
          </div>

          {/* Result Feedback Banner */}
          {result && (
            <div className="p-3 bg-[#EAF0E8] border border-[#A8B9A0]/50 rounded-xl text-xs space-y-1 animate-in fade-in duration-100">
              <div className="flex items-center gap-1.5 font-medium text-[#2E4731]">
                <CheckCircle2 className="w-4 h-4 text-[#5D8B55]" />
                <span>
                  {result.simulated
                    ? 'Simulated Export Request Executed'
                    : 'Export Generated & Downloaded'}
                </span>
              </div>
              <p className="text-[11px] text-[#3B5B3E] leading-relaxed">
                {result.message}
              </p>
            </div>
          )}

          {error && (
            <div className="p-3 bg-[#FFF0ED] border border-[#FCD9D3] rounded-xl text-xs text-[#F26B5B] flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-[#F26B5B] flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-[#302633]/70 hover:text-[#302633] hover:bg-[#FFF9F0] transition cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-[#F26B5B] hover:bg-[#E05A4A] active:bg-[#CC4E3F] text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
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
