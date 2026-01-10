/**
 * Projection Engine - Generates orthographic projections with hidden line removal
 */

import { Mesh, Vector3, Face } from './stl-parser';

export interface ProjectionView {
  name: string;
  lines: Array<[[number, number], [number, number]]>;
  bbox: [number, number, number, number]; // [xmin, ymin, xmax, ymax]
}

export interface ProjectionResponse {
  modelId: string;
  views: ProjectionView[];
}

interface Edge {
  v0: Vector3;
  v1: Vector3;
  faces: Face[];
  isVisible: boolean;
}

interface Point2D {
  x: number;
  y: number;
}

interface Line2D {
  p0: Point2D;
  p1: Point2D;
}

/**
 * Project 3D point to 2D based on view direction
 */
function project3DTo2D(point: Vector3, viewDirection: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom'): Point2D {
  switch (viewDirection) {
    case 'front': // Looking along -Z axis
      return { x: point.x, y: point.y };
    case 'back': // Looking along +Z axis
      return { x: -point.x, y: point.y };
    case 'left': // Looking along +X axis
      return { x: -point.z, y: point.y };
    case 'right': // Looking along -X axis
      return { x: point.z, y: point.y };
    case 'top': // Looking along -Y axis
      return { x: point.x, y: -point.z };
    case 'bottom': // Looking along +Y axis
      return { x: point.x, y: point.z };
  }
}

/**
 * Get view direction vector for each projection
 */
function getViewDirection(view: string): Vector3 {
  const directions: Record<string, Vector3> = {
    front: { x: 0, y: 0, z: -1 },
    back: { x: 0, y: 0, z: 1 },
    left: { x: 1, y: 0, z: 0 },
    right: { x: -1, y: 0, z: 0 },
    top: { x: 0, y: -1, z: 0 },
    bottom: { x: 0, y: 1, z: 0 },
  };
  return directions[view] || { x: 0, y: 0, z: -1 };
}

/**
 * Determine if a face is front-facing relative to view direction
 */
function isFrontFacing(face: Face, viewDirection: Vector3): boolean {
  const normal = face.normal;
  const dotProduct = normal.x * viewDirection.x + normal.y * viewDirection.y + normal.z * viewDirection.z;
  return dotProduct > 0;
}

/**
 * Extract edges from mesh
 */
function extractEdges(mesh: Mesh): Map<string, Edge> {
  const edgeMap = new Map<string, Edge>();

  for (const face of mesh.faces) {
    const v0 = mesh.vertices[face.vertices[0]];
    const v1 = mesh.vertices[face.vertices[1]];
    const v2 = mesh.vertices[face.vertices[2]];

    const edges: [Vector3, Vector3][] = [
      [v0, v1],
      [v1, v2],
      [v2, v0],
    ];

    for (const [va, vb] of edges) {
      // Create a canonical key for the edge (order-independent)
      const key1 = `${va.x},${va.y},${va.z}|${vb.x},${vb.y},${vb.z}`;
      const key2 = `${vb.x},${vb.y},${vb.z}|${va.x},${va.y},${va.z}`;

      const key = key1 < key2 ? key1 : key2;

      if (edgeMap.has(key)) {
        edgeMap.get(key)!.faces.push(face);
      } else {
        edgeMap.set(key, {
          v0: va,
          v1: vb,
          faces: [face],
          isVisible: false,
        });
      }
    }
  }

  return edgeMap;
}

/**
 * Determine visible edges for a given view
 */
function getVisibleEdges(mesh: Mesh, viewDirection: string): Line2D[] {
  const viewDir = getViewDirection(viewDirection);
  const edgeMap = extractEdges(mesh);
  const visibleLines: Line2D[] = [];

  for (const edge of Array.from(edgeMap.values())) {
    // An edge is visible if:
    // 1. It's on the silhouette (one face front-facing, one back-facing)
    // 2. Or both adjacent faces are front-facing (shared edge visible from front)

    const frontFacingCount = edge.faces.filter((f: Face) => isFrontFacing(f, viewDir)).length;
    const backFacingCount = edge.faces.length - frontFacingCount;

    let isVisible = false;

    if (edge.faces.length === 1) {
      // Boundary edge - always visible
      isVisible = isFrontFacing(edge.faces[0], viewDir);
    } else if (edge.faces.length === 2) {
      // Silhouette edge - visible if one front, one back
      isVisible = frontFacingCount === 1 && backFacingCount === 1;
    }

    if (isVisible) {
      const p0 = project3DTo2D(edge.v0, viewDirection as any);
      const p1 = project3DTo2D(edge.v1, viewDirection as any);
      visibleLines.push({ p0, p1 });
    }
  }

  return visibleLines;
}

/**
 * Merge collinear segments
 */
function mergeCollinearSegments(lines: Line2D[], epsilon: number = 1e-6): Line2D[] {
  if (lines.length === 0) return [];

  // Group lines by direction
  const grouped = new Map<string, Line2D[]>();

  for (const line of lines) {
    const dx = line.p1.x - line.p0.x;
    const dy = line.p1.y - line.p0.y;
    const length = Math.sqrt(dx * dx + dy * dy);

    if (length < epsilon) continue; // Skip degenerate lines

    // Normalize direction
    const dirX = dx / length;
    const dirY = dy / length;

    // Create key for direction (rounded to avoid floating point issues)
    const key = `${Math.round(dirX * 1e6)},${Math.round(dirY * 1e6)}`;

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(line);
  }

  const merged: Line2D[] = [];

  for (const lineGroup of Array.from(grouped.values())) {
    if (lineGroup.length === 0) continue;

    // Sort lines along their direction
    const sorted = lineGroup.sort((a: Line2D, b: Line2D) => {
      const projA = a.p0.x + a.p0.y;
      const projB = b.p0.x + b.p0.y;
      return projA - projB;
    });

    let currentStart = sorted[0].p0;
    let currentEnd = sorted[0].p1;

    for (let i = 1; i < sorted.length; i++) {
      const line = sorted[i];

      // Check if line is collinear and adjacent
      const dist = pointToLineDistance(line.p0, currentEnd, line.p1);

      if (dist < epsilon) {
        // Extend current line
        const d1 = distance(currentEnd, line.p0);
        const d2 = distance(currentEnd, line.p1);
        currentEnd = d2 > d1 ? line.p1 : line.p0;
      } else {
        // Start new line
        merged.push({ p0: currentStart, p1: currentEnd });
        currentStart = line.p0;
        currentEnd = line.p1;
      }
    }

    merged.push({ p0: currentStart, p1: currentEnd });
  }

  return merged;
}

/**
 * Calculate distance between two points
 */
function distance(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calculate distance from point to line segment
 */
function pointToLineDistance(p: Point2D, lineStart: Point2D, lineEnd: Point2D): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSq = dx * dx + dy * dy;

  if (lengthSq === 0) return distance(p, lineStart);

  let t = ((p.x - lineStart.x) * dx + (p.y - lineStart.y) * dy) / lengthSq;
  t = Math.max(0, Math.min(1, t));

  const closestX = lineStart.x + t * dx;
  const closestY = lineStart.y + t * dy;

  const distX = p.x - closestX;
  const distY = p.y - closestY;

  return Math.sqrt(distX * distX + distY * distY);
}

/**
 * Round coordinates to reduce noise
 */
function roundCoordinates(lines: Line2D[], decimals: number = 6): Line2D[] {
  const factor = Math.pow(10, decimals);

  return lines.map((line) => ({
    p0: {
      x: Math.round(line.p0.x * factor) / factor,
      y: Math.round(line.p0.y * factor) / factor,
    },
    p1: {
      x: Math.round(line.p1.x * factor) / factor,
      y: Math.round(line.p1.y * factor) / factor,
    },
  }));
}

/**
 * Calculate bounding box of 2D lines
 */
function calculateBbox(lines: Line2D[]): [number, number, number, number] {
  if (lines.length === 0) {
    return [0, 0, 1, 1];
  }

  let minX = lines[0].p0.x,
    minY = lines[0].p0.y;
  let maxX = minX,
    maxY = minY;

  for (const line of lines) {
    minX = Math.min(minX, line.p0.x, line.p1.x);
    maxX = Math.max(maxX, line.p0.x, line.p1.x);
    minY = Math.min(minY, line.p0.y, line.p1.y);
    maxY = Math.max(maxY, line.p0.y, line.p1.y);
  }

  // Add padding
  const padX = (maxX - minX) * 0.05 || 0.5;
  const padY = (maxY - minY) * 0.05 || 0.5;

  return [minX - padX, minY - padY, maxX + padX, maxY + padY];
}

/**
 * Generate all 6 orthographic projections
 */
export function generateProjections(mesh: Mesh): ProjectionView[] {
  const views: Array<'front' | 'back' | 'left' | 'right' | 'top' | 'bottom'> = [
    'front',
    'back',
    'left',
    'right',
    'top',
    'bottom',
  ];

  const projections: ProjectionView[] = [];

  for (const view of views) {
    let lines = getVisibleEdges(mesh, view);

    // Post-processing
    lines = roundCoordinates(lines);
    lines = mergeCollinearSegments(lines);

    const bbox = calculateBbox(lines);

    // Convert to array format for JSON
    const linesArray: Array<[[number, number], [number, number]]> = lines.map((line) => [
      [line.p0.x, line.p0.y],
      [line.p1.x, line.p1.y],
    ] as [[number, number], [number, number]]);

    projections.push({
      name: view,
      lines: linesArray,
      bbox,
    });
  }

  return projections;
}
