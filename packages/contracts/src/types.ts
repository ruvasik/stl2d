/**
 * Shared types between client and server
 */

/** A line segment represented as two 2D points */
export type LineSegment = [[number, number], [number, number]];

/** Bounding box as [xmin, ymin, xmax, ymax] */
export type BoundingBox = [number, number, number, number];

/** A single orthogonal projection view */
export interface ProjectionView {
  name: string;
  lines: LineSegment[];
  bbox: BoundingBox;
}

/** Available view names for orthogonal projections */
export type ViewName = 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom';

/** Result of STL processing */
export interface ProcessingResult {
  success: boolean;
  modelId: string;
  views: ProjectionView[];
}
