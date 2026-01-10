/**
 * Shared types between client and server
 */

export interface ProjectionView {
  name: string;
  lines: Array<[[number, number], [number, number]]>;
  bbox: [number, number, number, number]; // [xmin, ymin, xmax, ymax]
}
