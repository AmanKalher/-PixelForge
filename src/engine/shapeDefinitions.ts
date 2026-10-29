/**
 * PixelForge Shape Definitions & Generators
 * Includes basic shapes, polygons, stars & bursts, directional arrows,
 * banners & symbols, and multi-point line curve algorithms.
 * Adapted from the revised canvas engine.
 */

export interface ShapeCategory {
  label: string;
  options: [string, string][]; // [id, humanLabel]
}

export const SHAPE_CATEGORIES: ShapeCategory[] = [
  {
    label: 'Basic shapes',
    options: [
      ['rectangle', 'Rectangle'],
      ['rounded-rectangle', 'Rounded rectangle'],
      ['square', 'Square'],
      ['circle', 'Circle'],
      ['ellipse', 'Ellipse'],
      ['triangle', 'Triangle'],
      ['diamond', 'Diamond'],
    ],
  },
  {
    label: 'Polygons',
    options: [
      ['pentagon', 'Pentagon'],
      ['hexagon', 'Hexagon'],
      ['heptagon', 'Heptagon'],
      ['octagon', 'Octagon'],
      ['nonagon', 'Nonagon'],
      ['decagon', 'Decagon'],
      ['parallelogram', 'Parallelogram'],
      ['trapezoid', 'Trapezoid'],
    ],
  },
  {
    label: 'Stars & bursts',
    options: [
      ['star4', '4-point star'],
      ['star5', '5-point star'],
      ['star6', '6-point star'],
      ['star8', '8-point star'],
      ['burst', 'Burst'],
      ['sun', 'Sunburst'],
      ['gear', 'Gear'],
    ],
  },
  {
    label: 'Arrows',
    options: [
      ['arrow', 'Straight arrow'],
      ['arrowUp', 'Up arrow'],
      ['arrowDown', 'Down arrow'],
      ['arrowLeft', 'Left arrow'],
      ['arrowRight', 'Right arrow'],
      ['doubleArrow', 'Double arrow'],
      ['chevron', 'Chevron'],
    ],
  },
  {
    label: 'Banners & symbols',
    options: [
      ['heart', 'Heart'],
      ['lightning', 'Lightning'],
      ['cross', 'Cross'],
      ['plus', 'Plus'],
      ['moon', 'Crescent moon'],
      ['smiley', 'Smiley'],
      ['cloud', 'Cloud'],
      ['speech', 'Speech bubble'],
      ['thought', 'Thought bubble'],
      ['callout', 'Callout'],
    ],
  },
  {
    label: 'Lines & curves',
    options: [
      ['line', 'Straight line'],
      ['wavy', 'Wavy line'],
      ['smooth', 'Smooth curve'],
      ['hinged', 'Hinged line'],
    ],
  },
];

export function polygonPoints(
  sides: number,
  width = 100,
  height = 100,
  inset = 0.08
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < sides; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / sides;
    points.push({
      x: width / 2 + Math.cos(a) * width * (0.5 - inset),
      y: height / 2 + Math.sin(a) * height * (0.5 - inset),
    });
  }
  return points;
}

export function pathForShape(kind: string): string | null {
  const paths: Record<string, string> = {
    diamond: 'M 50 0 L 100 50 L 50 100 L 0 50 Z',
    parallelogram: 'M 25 0 L 100 0 L 75 100 L 0 100 Z',
    trapezoid: 'M 25 0 L 75 0 L 100 100 L 0 100 Z',
    star4: 'M 50 0 L 61 37 L 100 50 L 61 63 L 50 100 L 39 63 L 0 50 L 39 37 Z',
    star5: 'M 50 0 L 61 35 L 98 36 L 69 59 L 79 96 L 50 74 L 21 96 L 31 59 L 2 36 L 39 35 Z',
    star6: 'M 50 0 L 64 25 L 93 25 L 78 50 L 93 75 L 64 75 L 50 100 L 36 75 L 7 75 L 22 50 L 7 25 L 36 25 Z',
    star8: 'M 38 0 L 62 0 L 62 30 L 85 15 L 100 35 L 75 50 L 100 65 L 85 85 L 62 70 L 62 100 L 38 100 L 38 70 L 15 85 L 0 65 L 25 50 L 0 35 L 15 15 L 38 30 Z',
    burst: 'M 50 0 L 59 27 L 80 8 L 76 36 L 100 31 L 82 50 L 100 69 L 76 64 L 80 92 L 59 73 L 50 100 L 41 73 L 20 92 L 24 64 L 0 69 L 18 50 L 0 31 L 24 36 L 20 8 L 41 27 Z',
    sun: 'M 50 0 L 58 24 L 76 7 L 76 32 L 100 25 L 87 46 L 100 58 L 75 62 L 87 86 L 62 77 L 50 100 L 40 76 L 20 93 L 24 67 L 0 70 L 15 50 L 0 31 L 26 34 L 20 8 L 42 25 Z',
    arrowUp: 'M 50 0 L 100 55 L 68 55 L 68 100 L 32 100 L 32 55 L 0 55 Z',
    arrowDown: 'M 32 0 L 68 0 L 68 45 L 100 45 L 50 100 L 0 45 L 32 45 Z',
    arrowRight: 'M 0 32 L 45 32 L 45 0 L 100 50 L 45 100 L 45 68 L 0 68 Z',
    arrowLeft: 'M 100 32 L 55 32 L 55 0 L 0 50 L 55 100 L 55 68 L 100 68 Z',
    doubleArrow: 'M 0 50 L 25 20 L 25 38 L 75 38 L 75 20 L 100 50 L 75 80 L 75 62 L 25 62 L 25 80 Z',
    chevron: 'M 0 0 L 55 0 L 100 50 L 55 100 L 0 100 L 45 50 Z',
    heart: 'M 50 92 C 40 80 0 55 0 28 C 0 0 35 -5 50 20 C 65 -5 100 0 100 28 C 100 55 60 80 50 92 Z',
    lightning: 'M 58 0 L 18 55 L 45 55 L 35 100 L 83 38 L 55 38 Z',
    cross: 'M 35 0 L 65 0 L 65 35 L 100 35 L 100 65 L 65 65 L 65 100 L 35 100 L 35 65 L 0 65 L 0 35 L 35 35 Z',
    plus: 'M 40 0 L 60 0 L 60 40 L 100 40 L 100 60 L 60 60 L 60 100 L 40 100 L 40 60 L 0 60 L 0 40 L 40 40 Z',
    moon: 'M 75 5 C 20 0 0 35 10 65 C 25 105 75 100 95 65 C 60 78 40 45 75 5 Z',
    cloud: 'M 20 70 C -5 65 0 35 22 35 C 25 5 60 5 68 28 C 95 20 110 55 85 68 Z',
    speech: 'M 8 12 Q 8 0 25 0 L 75 0 Q 95 0 95 18 L 95 55 Q 95 70 75 70 L 40 70 L 20 95 L 25 70 Q 8 68 8 52 Z',
    thought: 'M 20 20 C 20 0 55 0 58 18 C 82 0 105 20 90 38 C 110 60 80 78 65 65 C 45 85 20 68 28 53 C 5 50 5 30 20 20 Z',
    callout: 'M 5 5 L 95 5 L 95 70 L 45 70 L 25 95 L 28 70 L 5 70 Z',
    smiley: 'M 50 2 A 48 48 0 1 1 49.9 2 Z M 30 35 L 30 36 M 68 35 L 68 36 M 28 58 Q 50 82 72 58',
    gear: 'M 50 0 L 60 12 L 76 7 L 80 23 L 96 30 L 88 44 L 100 55 L 84 65 L 86 82 L 68 82 L 58 100 L 45 87 L 30 95 L 25 78 L 8 72 L 16 57 L 0 45 L 15 34 L 12 18 L 31 20 L 40 3 Z',
  };

  if (paths[kind]) return paths[kind];

  const polygonMap: Record<string, number> = {
    pentagon: 5,
    hexagon: 6,
    heptagon: 7,
    octagon: 8,
    nonagon: 9,
    decagon: 10,
  };

  if (polygonMap[kind]) {
    return (
      polygonPoints(polygonMap[kind], 100, 100, 0)
        .map((p, i) => `${i ? 'L' : 'M'} ${p.x} ${p.y}`)
        .join(' ') + ' Z'
    );
  }

  return null;
}

export function wavyPathFromPoints(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  if (points.length > 2) return curvePathFromPoints(points);
  const [a, b] = points;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.hypot(dx, dy) || 1;
  const nx = -dy / length;
  const ny = dx / length;
  const steps = 24;
  const amplitude = Math.min(24, length / 8);
  const out: { x: number; y: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const wave = Math.sin(t * Math.PI * 4) * amplitude;
    out.push({ x: a.x + dx * t + nx * wave, y: a.y + dy * t + ny * wave });
  }
  return out.map((p, i) => `${i ? 'L' : 'M'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
}

export function curvePathFromPoints(points: { x: number; y: number }[]): string {
  if (points.length < 2) return '';
  const p = (point: { x: number; y: number }) => `${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  let d = `M ${p(points[0])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C ${p(c1)} ${p(c2)} ${p(p2)}`;
  }
  return d;
}
