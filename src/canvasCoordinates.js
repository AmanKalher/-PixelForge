/**
 * Coordinate helpers for the PixelForge infinite canvas.
 *
 * World coordinates belong to canvas objects and must not change when the
 * viewport pans or zooms. Screen coordinates are pixels in the canvas element.
 * Fabric's viewportTransform is the single source of truth for conversion.
 */

export const MIN_ZOOM = 0.15;
export const MAX_ZOOM = 4;

function getViewportTransform(canvas) {
  if (!canvas) throw new Error("A Fabric canvas is required.");
  const vpt = canvas.viewportTransform;
  if (!Array.isArray(vpt) || vpt.length < 6) {
    return [1, 0, 0, 1, 0, 0];
  }
  return vpt;
}

/** Convert a screen-space point to world coordinates. */
export function screenToWorld(canvas, screenPoint) {
  const [a, b, c, d, e, f] = getViewportTransform(canvas);
  const x = Number(screenPoint?.x ?? screenPoint?.offsetX);
  const y = Number(screenPoint?.y ?? screenPoint?.offsetY);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new TypeError("screenToWorld expects a point with finite x and y values.");
  }

  const determinant = a * d - b * c;
  if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-12) {
    throw new Error("Cannot convert coordinates: viewport transform is not invertible.");
  }

  const translatedX = x - e;
  const translatedY = y - f;
  return {
    x: (d * translatedX - c * translatedY) / determinant,
    y: (-b * translatedX + a * translatedY) / determinant,
  };
}

/** Convert world coordinates to canvas-element screen coordinates. */
export function worldToScreen(canvas, worldPoint) {
  const [a, b, c, d, e, f] = getViewportTransform(canvas);
  const x = Number(worldPoint?.x);
  const y = Number(worldPoint?.y);
  if (!Number.isFinite(x) || !Number.isFinite(y)) {
    throw new TypeError("worldToScreen expects a point with finite x and y values.");
  }
  return {
    x: a * x + c * y + e,
    y: b * x + d * y + f,
  };
}

/**
 * Convert a Fabric pointer event into world coordinates. Fabric 6's
 * getScenePoint already accounts for viewportTransform and retina scaling.
 * The manual fallback supports simple pointer-like objects for testing.
 */
export function getWorldPointer(canvas, eventOrPoint) {
  if (!canvas) throw new Error("A Fabric canvas is required.");
  const event = eventOrPoint?.e ?? eventOrPoint;
  if (eventOrPoint?.scenePoint && Number.isFinite(eventOrPoint.scenePoint.x)) {
    return { x: eventOrPoint.scenePoint.x, y: eventOrPoint.scenePoint.y };
  }
  if (typeof canvas.getScenePoint === "function" && event) {
    return canvas.getScenePoint(event);
  }
  return screenToWorld(canvas, eventOrPoint);
}

/** Current uniform zoom level (Fabric canvases in this app use uniform zoom). */
export function getZoomLevel(canvas) {
  const [a, b] = getViewportTransform(canvas);
  return Math.hypot(a, b);
}

export function clampZoom(zoom) {
  return Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, Number(zoom) || 1));
}

/** World-space rectangle currently visible in the canvas viewport. */
export function getViewportBounds(canvas) {
  const topLeft = screenToWorld(canvas, { x: 0, y: 0 });
  const topRight = screenToWorld(canvas, { x: canvas.getWidth(), y: 0 });
  const bottomLeft = screenToWorld(canvas, { x: 0, y: canvas.getHeight() });
  const bottomRight = screenToWorld(canvas, { x: canvas.getWidth(), y: canvas.getHeight() });
  const xs = [topLeft.x, topRight.x, bottomLeft.x, bottomRight.x];
  const ys = [topLeft.y, topRight.y, bottomLeft.y, bottomRight.y];
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  const right = Math.max(...xs);
  const bottom = Math.max(...ys);
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}
