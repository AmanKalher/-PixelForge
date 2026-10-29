import React from 'react';
import { useWorkspace } from '../../context/WorkspaceContext';

export const FONTS = [
  'Arial',
  'Georgia',
  'Verdana',
  'Trebuchet MS',
  'Courier New',
  'Times New Roman',
  'Plus Jakarta Sans',
];

export const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 42, 48, 60];
export const LINE_SPACINGS = [0.9, 1, 1.2, 1.5, 1.8, 2];

interface TextFormattingToolbarProps {
  className?: string;
}

export const TextFormattingToolbar: React.FC<TextFormattingToolbarProps> = ({ className = '' }) => {
  const { textSettings, updateTextSettings } = useWorkspace();

  return (
    <div className={`toolbar-row ${className}`} role="toolbar" aria-label="Text Formatting Controls">
      {/* 1. Font Family */}
      <select
        aria-label="Font family"
        className="text-format-select"
        value={textSettings.fontFamily || 'Arial'}
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => {
          updateTextSettings({ fontFamily: e.target.value });
        }}
      >
        {FONTS.map((f) => (
          <option key={f} value={f} style={{ fontFamily: f }}>
            {f}
          </option>
        ))}
      </select>

      {/* 2. Font Size */}
      <select
        aria-label="Font size"
        className="text-format-select"
        value={textSettings.fontSize || 24}
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => {
          updateTextSettings({ fontSize: Number(e.target.value) });
        }}
      >
        {FONT_SIZES.map((s) => (
          <option key={s} value={s}>
            {s}px
          </option>
        ))}
      </select>

      {/* 3. Bold */}
      <button
        type="button"
        aria-label="Toggle Bold"
        title="Bold"
        className={textSettings.bold ? 'format-button active' : 'format-button'}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          updateTextSettings({ bold: !textSettings.bold });
        }}
      >
        <b>B</b>
      </button>

      {/* 4. Italic */}
      <button
        type="button"
        aria-label="Toggle Italic"
        title="Italic"
        className={textSettings.italic ? 'format-button active' : 'format-button'}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          updateTextSettings({ italic: !textSettings.italic });
        }}
      >
        <i>I</i>
      </button>

      {/* 5. Underline */}
      <button
        type="button"
        aria-label="Toggle Underline"
        title="Underline"
        className={textSettings.underline ? 'format-button active' : 'format-button'}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          updateTextSettings({ underline: !textSettings.underline });
        }}
      >
        <u>U</u>
      </button>

      {/* 6. Text Alignment */}
      <select
        aria-label="Text alignment"
        className="text-format-select"
        value={textSettings.textAlign || 'left'}
        onMouseDown={(e) => e.stopPropagation()}
        onChange={(e) => {
          updateTextSettings({ textAlign: e.target.value as any });
        }}
      >
        <option value="left">Left</option>
        <option value="center">Center</option>
        <option value="right">Right</option>
        <option value="justify">Justify</option>
      </select>

      {/* 7. Text Color */}
      <label className="color-control" onMouseDown={(e) => e.stopPropagation()}>
        <span>Text</span>
        <input
          type="color"
          aria-label="Text color"
          value={textSettings.fill || '#302633'}
          onChange={(e) => {
            updateTextSettings({ fill: e.target.value });
          }}
        />
      </label>

      {/* 8. Text Background */}
      <label className="color-control" onMouseDown={(e) => e.stopPropagation()}>
        <span>Text BG</span>
        <input
          type="color"
          aria-label="Text background color"
          value={
            textSettings.backgroundColor === 'transparent' || !textSettings.backgroundColor
              ? '#FFF4B8'
              : textSettings.backgroundColor
          }
          onChange={(e) => {
            updateTextSettings({ backgroundColor: e.target.value });
          }}
        />
      </label>

      {/* 9. Clear Background */}
      <button
        type="button"
        aria-label="Clear Background"
        title="Clear Background"
        className="format-button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => {
          updateTextSettings({ backgroundColor: 'transparent' });
        }}
      >
        Clear BG
      </button>

      {/* 10. Line Spacing */}
      <label className="line-control" onMouseDown={(e) => e.stopPropagation()}>
        <span>Line spacing</span>
        <select
          aria-label="Line spacing"
          className="text-format-select"
          value={textSettings.lineHeight || 1.2}
          onChange={(e) => {
            updateTextSettings({ lineHeight: Number(e.target.value) });
          }}
        >
          {LINE_SPACINGS.map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
};