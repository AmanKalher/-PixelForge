/**
 * PixelForge Chart & Graph Renderer
 * Renders professional, publication-quality data charts as self-contained Fabric.js Groups.
 * Supports: bar, horizontal_bar, line, area, scatter, pie, doughnut, radar, polar_area, wavy, histogram, stacked_bar.
 */

import {
  Rect,
  Textbox,
  Line,
  Polygon,
  Path,
  Circle,
  Group,
  type FabricObject,
} from 'fabric';

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface ParseResult {
  title?: string;
  rows: ChartDataPoint[];
  warnings: string[];
}

export const CHART_PALETTE = [
  '#6366F1', // Indigo
  '#14B8A6', // Teal
  '#F59E0B', // Amber
  '#F43F5E', // Rose
  '#8B5CF6', // Purple
  '#0EA5E9', // Sky
  '#10B981', // Emerald
  '#F97316', // Orange
  '#EC4899', // Pink
  '#64748B', // Slate
];

export const CARD_WIDTH = 520;
export const CARD_HEIGHT = 340;

/**
 * Robust CSV parser that handles:
 * - "Label,Value", "Category,Amount", etc.
 * - Missing / empty values (defaults to 0)
 * - Quotes, semicolons, tabs, and commas
 * - Automatic header detection
 * - Zero, negative, and large floating-point numbers
 */
export function parseChartCsv(csvText: string): ParseResult {
  const warnings: string[] = [];
  if (!csvText || !csvText.trim()) {
    return {
      rows: [
        { label: 'A', value: 12 },
        { label: 'B', value: 19 },
        { label: 'C', value: 8 },
        { label: 'D', value: 15 },
      ],
      warnings: ['Empty CSV provided; using default dataset.'],
    };
  }

  const rawLines = csvText
    .trim()
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (rawLines.length === 0) {
    return {
      rows: [
        { label: 'A', value: 12 },
        { label: 'B', value: 19 },
        { label: 'C', value: 8 },
        { label: 'D', value: 15 },
      ],
      warnings: ['No data rows found; using default dataset.'],
    };
  }

  const parsedLines = rawLines.map((line) => {
    // Detect delimiter: tab, semicolon, or comma
    const delim = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
    return line.split(delim).map((cell) => cell.trim().replace(/^["']|["']$/g, ''));
  });

  let startIndex = 0;
  let customTitle: string | undefined;

  // Header detection: check if first row is non-numeric in column 2
  const firstRow = parsedLines[0];
  if (firstRow.length >= 2) {
    const valCandidate = Number(firstRow[1]);
    const isFirstColHeader = /^(label|category|item|name|x|quarter|month|year|metric|key)$/i.test(firstRow[0]);
    const isSecondColHeader = /^(value|val|amount|count|number|y|sales|revenue|score|percentage|%)$/i.test(firstRow[1]);
    if (isNaN(valCandidate) || isFirstColHeader || isSecondColHeader) {
      startIndex = 1;
      if (!isFirstColHeader && !isSecondColHeader) {
        customTitle = `${firstRow[0]} vs ${firstRow[1]}`;
      }
    }
  }

  const rows: ChartDataPoint[] = [];
  for (let i = startIndex; i < parsedLines.length; i++) {
    const cols = parsedLines[i];
    if (cols.length === 0 || (cols.length === 1 && !cols[0])) continue;

    const label = cols[0] || `Item ${rows.length + 1}`;
    const rawVal = cols[1];
    let numVal = rawVal !== undefined && rawVal !== '' ? Number(rawVal) : NaN;

    if (!Number.isFinite(numVal)) {
      warnings.push(`Row ${i + 1} ("${label}") had non-numeric value "${rawVal}". Defaulted to 0.`);
      numVal = 0;
    }

    rows.push({ label, value: numVal });
  }

  if (rows.length === 0) {
    return {
      rows: [
        { label: 'Item 1', value: 10 },
        { label: 'Item 2', value: 20 },
      ],
      warnings: ['No valid rows could be parsed. Loaded fallback dataset.'],
    };
  }

  return { title: customTitle, rows, warnings };
}

/**
 * Calculates nice rounded bounds and ticks for a numeric range.
 */
function calculateScale(values: number[], targetTicks = 5): { min: number; max: number; ticks: number[] } {
  const allPositive = values.every((v) => v >= 0);
  let min = Math.min(...values);
  let max = Math.max(...values);

  if (allPositive) {
    min = 0;
    if (max === 0) max = 10;
  } else {
    if (min === max) {
      min -= 5;
      max += 5;
    }
  }

  const span = max - min;
  const rawStep = span / (targetTicks - 1);
  const power = Math.pow(10, Math.floor(Math.log10(rawStep || 1)));
  const normalizedStep = (rawStep || 1) / power;

  let niceMultiplier = 1;
  if (normalizedStep > 5) niceMultiplier = 10;
  else if (normalizedStep > 2) niceMultiplier = 5;
  else if (normalizedStep > 1) niceMultiplier = 2;

  const step = niceMultiplier * power;
  const niceMin = allPositive ? 0 : Math.floor(min / step) * step;
  const niceMax = Math.ceil(max / step) * step;

  const ticks: number[] = [];
  for (let t = niceMin; t <= niceMax + step * 0.001; t += step) {
    ticks.push(Number(t.toFixed(4)));
  }

  return { min: niceMin, max: niceMax, ticks };
}

function formatNumber(num: number): string {
  if (Math.abs(num) >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (Math.abs(num) >= 1_000) {
    return `${(num / 1_000).toFixed(1)}k`;
  }
  return Number.isInteger(num) ? num.toString() : num.toFixed(1);
}

export function formatChartTypeTitle(type: string): string {
  switch (type.replace(/-/g, '_').toLowerCase()) {
    case 'horizontal_bar':
      return 'Horizontal Bar Chart';
    case 'line':
      return 'Line Chart';
    case 'area':
      return 'Area Chart';
    case 'scatter':
      return 'Scatter Plot';
    case 'pie':
      return 'Pie Chart';
    case 'doughnut':
      return 'Doughnut Chart';
    case 'radar':
      return 'Radar Chart';
    case 'polar_area':
      return 'Polar Area Chart';
    case 'wavy':
      return 'Wavy Spline Chart';
    case 'histogram':
      return 'Histogram';
    case 'stacked_bar':
      return 'Stacked Bar Chart';
    case 'bar':
    default:
      return 'Bar Chart';
  }
}

/**
 * Builds a completely self-contained, boundary-safe Fabric.js Group for any chart type.
 */
export function buildChartGroup(options: {
  graphType?: string;
  data?: string;
  x?: number;
  y?: number;
}): Group {
  const rawType = options.graphType || 'bar';
  const type = rawType.replace(/-/g, '_').toLowerCase();
  const { title: csvTitle, rows } = parseChartCsv(options.data || '');
  const chartTitle = csvTitle || formatChartTypeTitle(type);

  const children: FabricObject[] = [];
  const W = CARD_WIDTH;
  const H = CARD_HEIGHT;

  // 1. Background Card (guarantees top-left at 0,0 and bounds exactly [0,0,W,H])
  children.push(
    new Rect({
      left: 0,
      top: 0,
      width: W,
      height: H,
      fill: '#FFFFFF',
      stroke: '#E2E8F0',
      strokeWidth: 1.5,
      rx: 14,
      ry: 14,
      originX: 'left',
      originY: 'top',
      selectable: false,
      evented: false,
    })
  );

  // 2. Chart Title Header
  children.push(
    new Textbox(chartTitle, {
      left: 24,
      top: 18,
      width: W - 48,
      height: 24,
      fontSize: 15,
      fontWeight: 'bold',
      fill: '#1E293B',
      originX: 'left',
      originY: 'top',
      selectable: false,
      evented: false,
    })
  );

  // 3. Render Cartesian or Polar/Radial content
  const isRadial = ['pie', 'doughnut', 'radar', 'polar_area'].includes(type);

  if (isRadial) {
    renderRadialChart(type, rows, children);
  } else if (type === 'horizontal_bar') {
    renderHorizontalBarChart(rows, children);
  } else {
    renderCartesianChart(type, rows, children);
  }

  // 4. Wrap everything in a Fabric.js Group
  const group = new Group(children, {
    left: options.x ?? 150,
    top: options.y ?? 150,
    originX: 'left',
    originY: 'top',
    subTargetCheck: false,
    objectCaching: false,
  });

  const id = `graph-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  (group as any).id = id;
  (group as any).name = chartTitle;
  (group as any).pixelForgeObjectType = 'graph';
  (group as any).isPixelForgeGraph = true;
  (group as any).graphType = type;
  (group as any).graphData = options.data || '';

  return group;
}

/**
 * Standard Cartesian Chart Renderer (bar, line, area, scatter, wavy, histogram, stacked_bar)
 */
function renderCartesianChart(type: string, rows: ChartDataPoint[], children: FabricObject[]) {
  const plotLeft = 68;
  const plotRight = CARD_WIDTH - 28;
  const plotTop = 56;
  const plotBottom = CARD_HEIGHT - 65;
  const plotW = plotRight - plotLeft;
  const plotH = plotBottom - plotTop;

  const values = rows.map((r) => r.value);
  const { min: scaleMin, max: scaleMax, ticks } = calculateScale(values, 5);
  const span = scaleMax - scaleMin || 1;

  // Horizontal Gridlines & Y-Axis Labels
  ticks.forEach((tickVal) => {
    const yRatio = (tickVal - scaleMin) / span;
    const y = Math.round(plotBottom - yRatio * plotH);

    children.push(
      new Line([plotLeft, y, plotRight, y], {
        stroke: tickVal === 0 ? '#CBD5E1' : '#F1F5F9',
        strokeWidth: tickVal === 0 ? 1.5 : 1,
        originX: 'left',
        originY: 'top',
        selectable: false,
        evented: false,
      })
    );

    children.push(
      new Textbox(formatNumber(tickVal), {
        left: 8,
        top: y - 7,
        width: plotLeft - 16,
        fontSize: 10,
        fill: '#64748B',
        textAlign: 'right',
        originX: 'left',
        originY: 'top',
        selectable: false,
        evented: false,
      })
    );
  });

  // Vertical Y-axis line
  children.push(
    new Line([plotLeft, plotTop, plotLeft, plotBottom], {
      stroke: '#CBD5E1',
      strokeWidth: 1.5,
      originX: 'left',
      originY: 'top',
      selectable: false,
      evented: false,
    })
  );

  const baselineY = Math.round(plotBottom - ((0 - scaleMin) / span) * plotH);
  const n = rows.length;
  const slotW = plotW / n;

  if (type === 'bar' || type === 'histogram' || type === 'stacked_bar') {
    const gapRatio = type === 'histogram' ? 0.04 : 0.35;
    const barW = Math.min(type === 'histogram' ? slotW : 52, Math.max(8, slotW * (1 - gapRatio)));

    rows.forEach((row, i) => {
      const slotCenterX = plotLeft + (i + 0.5) * slotW;
      const barX = Math.round(slotCenterX - barW / 2);
      const val = row.value;
      const barH = Math.max(val === 0 ? 2 : 4, (Math.abs(val) / span) * plotH);
      const barY = val >= 0 ? Math.round(baselineY - barH) : baselineY;
      const color = CHART_PALETTE[i % CHART_PALETTE.length];

      // Primary Bar
      children.push(
        new Rect({
          left: barX,
          top: barY,
          width: barW,
          height: barH,
          fill: color,
          rx: type === 'histogram' ? 1 : 4,
          ry: type === 'histogram' ? 1 : 4,
          originX: 'left',
          originY: 'top',
          selectable: false,
          evented: false,
        })
      );

      // Stacked Bar segment if applicable
      if (type === 'stacked_bar') {
        const stackH = barH * 0.42;
        const stackColor = CHART_PALETTE[(i + 3) % CHART_PALETTE.length];
        children.push(
          new Rect({
            left: barX,
            top: val >= 0 ? barY : barY + barH - stackH,
            width: barW,
            height: stackH,
            fill: stackColor,
            rx: 2,
            ry: 2,
            originX: 'left',
            originY: 'top',
            selectable: false,
            evented: false,
          })
        );
      }

      // Value label above (or below for negative)
      const valText = formatNumber(val);
      const valY = val >= 0 ? Math.max(plotTop + 2, barY - 17) : Math.min(plotBottom - 14, barY + barH + 3);
      children.push(
        new Textbox(valText, {
          left: slotCenterX - 30,
          top: valY,
          width: 60,
          fontSize: 10,
          fontWeight: 'bold',
          fill: '#334155',
          textAlign: 'center',
          originX: 'left',
          originY: 'top',
          selectable: false,
          evented: false,
        })
      );

      // Category label below baseline
      children.push(
        new Textbox(row.label, {
          left: Math.round(slotCenterX - slotW / 2 + 2),
          top: plotBottom + 8,
          width: Math.max(30, slotW - 4),
          fontSize: 10,
          fontWeight: '500',
          fill: '#475569',
          textAlign: 'center',
          originX: 'left',
          originY: 'top',
          selectable: false,
          evented: false,
        })
      );
    });
  } else if (type === 'line' || type === 'area' || type === 'wavy' || type === 'scatter') {
    const pts = rows.map((row, i) => {
      const cx = plotLeft + (n === 1 ? plotW / 2 : (i * plotW) / (n - 1));
      const cy = Math.round(plotBottom - ((row.value - scaleMin) / span) * plotH);
      return { x: cx, y: cy };
    });

    if (type === 'area' && pts.length > 0) {
      const polyPts = [
        { x: pts[0].x, y: baselineY },
        ...pts,
        { x: pts[pts.length - 1].x, y: baselineY },
      ];
      children.push(
        new Polygon(polyPts, {
          fill: 'rgba(99, 102, 241, 0.16)',
          stroke: 'none',
          selectable: false,
          evented: false,
        })
      );
    }

    if ((type === 'line' || type === 'area') && pts.length > 1) {
      const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
      children.push(
        new Path(pathD, {
          fill: 'none',
          stroke: '#6366F1',
          strokeWidth: 2.5,
          strokeLineCap: 'round',
          strokeLineJoin: 'round',
          selectable: false,
          evented: false,
        })
      );
    } else if (type === 'wavy' && pts.length > 1) {
      // Smooth spline interpolation
      let d = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[Math.max(0, i - 1)];
        const p1 = pts[i];
        const p2 = pts[i + 1];
        const p3 = pts[Math.min(pts.length - 1, i + 2)];
        const cp1x = p1.x + (p2.x - p0.x) / 6;
        const cp1y = p1.y + (p2.y - p0.y) / 6;
        const cp2x = p2.x - (p3.x - p1.x) / 6;
        const cp2y = p2.y - (p3.y - p1.y) / 6;
        d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x} ${p2.y}`;
      }
      // Fill under curve
      const areaD = `${d} L ${pts[pts.length - 1].x} ${baselineY} L ${pts[0].x} ${baselineY} Z`;
      children.push(
        new Path(areaD, {
          fill: 'rgba(20, 184, 166, 0.15)',
          stroke: 'none',
          selectable: false,
          evented: false,
        })
      );
      children.push(
        new Path(d, {
          fill: 'none',
          stroke: '#14B8A6',
          strokeWidth: 2.5,
          strokeLineCap: 'round',
          selectable: false,
          evented: false,
        })
      );
    }

    // Points, Value Labels, and Category Labels
    pts.forEach((p, i) => {
      const color = CHART_PALETTE[i % CHART_PALETTE.length];
      children.push(
        new Circle({
          left: p.x - 4.5,
          top: p.y - 4.5,
          radius: 4.5,
          fill: '#FFFFFF',
          stroke: type === 'wavy' ? '#14B8A6' : color,
          strokeWidth: 2.5,
          originX: 'left',
          originY: 'top',
          selectable: false,
          evented: false,
        })
      );

      // Value label
      children.push(
        new Textbox(formatNumber(rows[i].value), {
          left: p.x - 25,
          top: Math.max(plotTop + 2, p.y - 17),
          width: 50,
          fontSize: 9,
          fontWeight: 'bold',
          fill: '#334155',
          textAlign: 'center',
          originX: 'left',
          originY: 'top',
          selectable: false,
          evented: false,
        })
      );

      // Category label
      children.push(
        new Textbox(rows[i].label, {
          left: p.x - (plotW / n) / 2,
          top: plotBottom + 8,
          width: plotW / n,
          fontSize: 10,
          fontWeight: '500',
          fill: '#475569',
          textAlign: 'center',
          originX: 'left',
          originY: 'top',
          selectable: false,
          evented: false,
        })
      );
    });
  }
}

/**
 * Horizontal Bar Chart Renderer
 */
function renderHorizontalBarChart(rows: ChartDataPoint[], children: FabricObject[]) {
  const hPlotLeft = 110;
  const hPlotRight = CARD_WIDTH - 42;
  const hPlotTop = 56;
  const hPlotBottom = CARD_HEIGHT - 38;
  const hPlotW = hPlotRight - hPlotLeft;
  const hPlotH = hPlotBottom - hPlotTop;

  const values = rows.map((r) => r.value);
  const { min: scaleMin, max: scaleMax, ticks } = calculateScale(values, 5);
  const span = scaleMax - scaleMin || 1;

  // Vertical Gridlines & X-Axis Labels
  ticks.forEach((tickVal) => {
    const xRatio = (tickVal - scaleMin) / span;
    const x = Math.round(hPlotLeft + xRatio * hPlotW);

    children.push(
      new Line([x, hPlotTop, x, hPlotBottom], {
        stroke: tickVal === 0 ? '#CBD5E1' : '#F1F5F9',
        strokeWidth: tickVal === 0 ? 1.5 : 1,
        originX: 'left',
        originY: 'top',
        selectable: false,
        evented: false,
      })
    );

    children.push(
      new Textbox(formatNumber(tickVal), {
        left: x - 20,
        top: hPlotBottom + 6,
        width: 40,
        fontSize: 10,
        fill: '#64748B',
        textAlign: 'center',
        originX: 'left',
        originY: 'top',
        selectable: false,
        evented: false,
      })
    );
  });

  const baselineX = Math.round(hPlotLeft + ((0 - scaleMin) / span) * hPlotW);
  const n = rows.length;
  const slotH = hPlotH / n;
  const barH = Math.min(32, Math.max(10, slotH * 0.65));

  rows.forEach((row, i) => {
    const slotCenterY = hPlotTop + (i + 0.5) * slotH;
    const barY = Math.round(slotCenterY - barH / 2);
    const val = row.value;
    const barW = Math.max(val === 0 ? 2 : 4, (Math.abs(val) / span) * hPlotW);
    const barX = val >= 0 ? baselineX : baselineX - barW;
    const color = CHART_PALETTE[i % CHART_PALETTE.length];

    // Bar Rect
    children.push(
      new Rect({
        left: barX,
        top: barY,
        width: barW,
        height: barH,
        fill: color,
        rx: 4,
        ry: 4,
        originX: 'left',
        originY: 'top',
        selectable: false,
        evented: false,
      })
    );

    // Left Category Label
    children.push(
      new Textbox(row.label, {
        left: 8,
        top: slotCenterY - 7,
        width: hPlotLeft - 16,
        fontSize: 10,
        fontWeight: '500',
        fill: '#475569',
        textAlign: 'right',
        originX: 'left',
        originY: 'top',
        selectable: false,
        evented: false,
      })
    );

    // Value Label to the right (or left for negative)
    const valText = formatNumber(val);
    const valX = val >= 0 ? barX + barW + 6 : barX - 34;
    children.push(
      new Textbox(valText, {
        left: valX,
        top: slotCenterY - 7,
        width: 40,
        fontSize: 10,
        fontWeight: 'bold',
        fill: '#334155',
        originX: 'left',
        originY: 'top',
        selectable: false,
        evented: false,
      })
    );
  });
}

/**
 * Radial & Polar Charts (pie, doughnut, radar, polar_area)
 */
function renderRadialChart(type: string, rows: ChartDataPoint[], children: FabricObject[]) {
  const cx = 185;
  const cy = 195;
  const radius = 100;
  const values = rows.map((r) => Math.max(0, r.value));
  const total = values.reduce((sum, v) => sum + v, 0) || 1;

  if (type === 'radar') {
    // Spider / Radar Chart
    const n = rows.length;
    const maxVal = Math.max(1, ...values);
    const rings = 4;

    // Concentric Polygon Rings
    for (let ring = 1; ring <= rings; ring++) {
      const ringRadius = (ring / rings) * radius;
      const ringPts = rows.map((_, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
        return {
          x: cx + ringRadius * Math.cos(angle),
          y: cy + ringRadius * Math.sin(angle),
        };
      });
      children.push(
        new Polygon(ringPts, {
          fill: ring % 2 === 0 ? 'rgba(241, 245, 249, 0.6)' : 'transparent',
          stroke: '#E2E8F0',
          strokeWidth: 1,
          selectable: false,
          evented: false,
        })
      );
    }

    // Spokes from center
    rows.forEach((row, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      const xEnd = cx + radius * Math.cos(angle);
      const yEnd = cy + radius * Math.sin(angle);
      children.push(
        new Line([cx, cy, xEnd, yEnd], {
          stroke: '#CBD5E1',
          strokeWidth: 1,
          originX: 'left',
          originY: 'top',
          selectable: false,
          evented: false,
        })
      );

      // Label at spoke tip
      const labelDist = radius + 16;
      const lx = cx + labelDist * Math.cos(angle);
      const ly = cy + labelDist * Math.sin(angle);
      children.push(
        new Textbox(row.label, {
          left: lx - 30,
          top: ly - 7,
          width: 60,
          fontSize: 9,
          fontWeight: '500',
          fill: '#475569',
          textAlign: 'center',
          originX: 'left',
          originY: 'top',
          selectable: false,
          evented: false,
        })
      );
    });

    // Radar Data Polygon
    const dataPts = rows.map((row, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      const r = (Math.max(0, row.value) / maxVal) * radius;
      return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
      };
    });

    children.push(
      new Polygon(dataPts, {
        fill: 'rgba(99, 102, 241, 0.25)',
        stroke: '#6366F1',
        strokeWidth: 2,
        selectable: false,
        evented: false,
      })
    );

    // Points on Radar vertices
    dataPts.forEach((p) => {
      children.push(
        new Circle({
          left: p.x - 3.5,
          top: p.y - 3.5,
          radius: 3.5,
          fill: '#FFFFFF',
          stroke: '#6366F1',
          strokeWidth: 2,
          originX: 'left',
          originY: 'top',
          selectable: false,
          evented: false,
        })
      );
    });
  } else if (type === 'polar_area') {
    // Polar Area Chart: equal angles, radius proportional to value
    const n = rows.length;
    const maxVal = Math.max(1, ...values);
    let startAngle = -Math.PI / 2;
    const angleStep = (2 * Math.PI) / n;

    rows.forEach((row, i) => {
      const endAngle = startAngle + angleStep;
      const r = Math.max(10, (Math.max(0, row.value) / maxVal) * radius);
      const points = [{ x: cx, y: cy }];
      const steps = 16;
      for (let s = 0; s <= steps; s++) {
        const a = startAngle + (s / steps) * angleStep;
        points.push({
          x: cx + r * Math.cos(a),
          y: cy + r * Math.sin(a),
        });
      }
      children.push(
        new Polygon(points, {
          fill: CHART_PALETTE[i % CHART_PALETTE.length],
          opacity: 0.82,
          stroke: '#FFFFFF',
          strokeWidth: 1.5,
          selectable: false,
          evented: false,
        })
      );
      startAngle = endAngle;
    });
  } else {
    // Pie & Doughnut Chart
    let startAngle = -Math.PI / 2;
    rows.forEach((row, i) => {
      const val = Math.max(0, row.value);
      const angleSpan = (val / total) * 2 * Math.PI;
      const endAngle = startAngle + angleSpan;
      const points = [{ x: cx, y: cy }];
      const steps = Math.max(8, Math.round((angleSpan / (2 * Math.PI)) * 48));

      for (let s = 0; s <= steps; s++) {
        const a = startAngle + (s / steps) * angleSpan;
        points.push({
          x: cx + radius * Math.cos(a),
          y: cy + radius * Math.sin(a),
        });
      }

      children.push(
        new Polygon(points, {
          fill: CHART_PALETTE[i % CHART_PALETTE.length],
          stroke: '#FFFFFF',
          strokeWidth: 2,
          selectable: false,
          evented: false,
        })
      );

      // Percentage label inside slice if significant
      if (val / total >= 0.08) {
        const midAngle = startAngle + angleSpan / 2;
        const textR = type === 'doughnut' ? radius * 0.72 : radius * 0.62;
        const tx = cx + textR * Math.cos(midAngle);
        const ty = cy + textR * Math.sin(midAngle);
        const pctText = `${Math.round((val / total) * 100)}%`;
        children.push(
          new Textbox(pctText, {
            left: tx - 16,
            top: ty - 6,
            width: 32,
            fontSize: 9,
            fontWeight: 'bold',
            fill: '#FFFFFF',
            textAlign: 'center',
            originX: 'left',
            originY: 'top',
            selectable: false,
            evented: false,
          })
        );
      }

      startAngle = endAngle;
    });

    // Hole for Doughnut
    if (type === 'doughnut') {
      const innerRadius = 50;
      children.push(
        new Circle({
          left: cx - innerRadius,
          top: cy - innerRadius,
          radius: innerRadius,
          fill: '#FFFFFF',
          stroke: '#F1F5F9',
          strokeWidth: 1.5,
          originX: 'left',
          originY: 'top',
          selectable: false,
          evented: false,
        })
      );

      children.push(
        new Textbox('TOTAL', {
          left: cx - 35,
          top: cy - 14,
          width: 70,
          fontSize: 9,
          fontWeight: 'bold',
          fill: '#94A3B8',
          textAlign: 'center',
          originX: 'left',
          originY: 'top',
          selectable: false,
          evented: false,
        })
      );

      children.push(
        new Textbox(formatNumber(total), {
          left: cx - 40,
          top: cy - 1,
          width: 80,
          fontSize: 13,
          fontWeight: 'bold',
          fill: '#1E293B',
          textAlign: 'center',
          originX: 'left',
          originY: 'top',
          selectable: false,
          evented: false,
        })
      );
    }
  }

  // Right-side Legend for Radial Charts
  const legendX = 330;
  const legendTop = 75;
  const maxLegendItems = Math.min(8, rows.length);

  for (let i = 0; i < maxLegendItems; i++) {
    const row = rows[i];
    const color = CHART_PALETTE[i % CHART_PALETTE.length];
    const itemY = legendTop + i * 26;

    // Color bullet
    children.push(
      new Rect({
        left: legendX,
        top: itemY + 2,
        width: 10,
        height: 10,
        fill: color,
        rx: 2,
        ry: 2,
        originX: 'left',
        originY: 'top',
        selectable: false,
        evented: false,
      })
    );

    // Label and Value
    const pct = total > 0 ? ` (${Math.round((row.value / total) * 100)}%)` : '';
    children.push(
      new Textbox(`${row.label}: ${formatNumber(row.value)}${type === 'radar' ? '' : pct}`, {
        left: legendX + 16,
        top: itemY,
        width: CARD_WIDTH - legendX - 24,
        fontSize: 10,
        fontWeight: '500',
        fill: '#334155',
        originX: 'left',
        originY: 'top',
        selectable: false,
        evented: false,
      })
    );
  }
}
