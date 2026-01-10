import { describe, expect, it } from 'vitest';
import { parseSTL } from './stl-parser';
import { generateProjections } from './projection-engine';

/**
 * Helper to create a simple ASCII STL buffer
 */
function createSimpleCubeSTL(): Buffer {
  // Simple cube STL in ASCII format
  const stlContent = `solid Cube
facet normal 0 0 1
  outer loop
    vertex 0 0 1
    vertex 1 0 1
    vertex 1 1 1
  endloop
endfacet
facet normal 0 0 1
  outer loop
    vertex 0 0 1
    vertex 1 1 1
    vertex 0 1 1
  endloop
endfacet
facet normal 0 0 -1
  outer loop
    vertex 0 0 0
    vertex 0 1 0
    vertex 1 1 0
  endloop
endfacet
facet normal 0 0 -1
  outer loop
    vertex 0 0 0
    vertex 1 1 0
    vertex 1 0 0
  endloop
endfacet
facet normal 0 1 0
  outer loop
    vertex 0 1 0
    vertex 0 1 1
    vertex 1 1 1
  endloop
endfacet
facet normal 0 1 0
  outer loop
    vertex 0 1 0
    vertex 1 1 1
    vertex 1 1 0
  endloop
endfacet
facet normal 0 -1 0
  outer loop
    vertex 0 0 0
    vertex 1 0 0
    vertex 1 0 1
  endloop
endfacet
facet normal 0 -1 0
  outer loop
    vertex 0 0 0
    vertex 1 0 1
    vertex 0 0 1
  endloop
endfacet
facet normal 1 0 0
  outer loop
    vertex 1 0 0
    vertex 1 1 0
    vertex 1 1 1
  endloop
endfacet
facet normal 1 0 0
  outer loop
    vertex 1 0 0
    vertex 1 1 1
    vertex 1 0 1
  endloop
endfacet
facet normal -1 0 0
  outer loop
    vertex 0 0 0
    vertex 0 0 1
    vertex 0 1 1
  endloop
endfacet
facet normal -1 0 0
  outer loop
    vertex 0 0 0
    vertex 0 1 1
    vertex 0 1 0
  endloop
endfacet
endsolid Cube`;

  return Buffer.from(stlContent, 'utf8');
}

/**
 * Helper to create a simple binary STL buffer
 */
function createSimpleBinarySTL(): Buffer {
  const buffer = Buffer.alloc(84 + 50); // Header (80) + triangle count (4) + 1 triangle (50 bytes)

  // Write header (80 bytes of zeros)
  buffer.fill(0, 0, 80);

  // Write triangle count (1 triangle, little-endian)
  buffer.writeUInt32LE(1, 80);

  // Write triangle data (50 bytes)
  let offset = 84;

  // Normal vector (3 floats)
  buffer.writeFloatLE(0, offset);
  buffer.writeFloatLE(0, offset + 4);
  buffer.writeFloatLE(1, offset + 8);
  offset += 12;

  // Vertex 1
  buffer.writeFloatLE(0, offset);
  buffer.writeFloatLE(0, offset + 4);
  buffer.writeFloatLE(0, offset + 8);
  offset += 12;

  // Vertex 2
  buffer.writeFloatLE(1, offset);
  buffer.writeFloatLE(0, offset + 4);
  buffer.writeFloatLE(0, offset + 8);
  offset += 12;

  // Vertex 3
  buffer.writeFloatLE(1, offset);
  buffer.writeFloatLE(1, offset + 4);
  buffer.writeFloatLE(0, offset + 8);
  offset += 12;

  // Attribute byte count
  buffer.writeUInt16LE(0, offset);

  return buffer;
}

describe('STL Parser', () => {
  it('should parse ASCII STL format', () => {
    const buffer = createSimpleCubeSTL();
    const mesh = parseSTL(buffer);

    expect(mesh.vertices).toBeDefined();
    expect(mesh.faces).toBeDefined();
    expect(mesh.vertices.length).toBeGreaterThan(0);
    expect(mesh.faces.length).toBeGreaterThan(0);
  });

  it('should parse binary STL format', () => {
    const buffer = createSimpleBinarySTL();
    const mesh = parseSTL(buffer);

    expect(mesh.vertices).toBeDefined();
    expect(mesh.faces).toBeDefined();
    expect(mesh.vertices.length).toBeGreaterThan(0);
    expect(mesh.faces.length).toBeGreaterThan(0);
  });

  it('should normalize mesh to unit cube', () => {
    const buffer = createSimpleCubeSTL();
    const mesh = parseSTL(buffer);

    // After normalization, mesh should be centered around origin
    // and fit in a unit cube
    expect(mesh.bounds.min.x).toBeLessThanOrEqual(0);
    expect(mesh.bounds.max.x).toBeGreaterThanOrEqual(0);
    expect(mesh.bounds.min.y).toBeLessThanOrEqual(0);
    expect(mesh.bounds.max.y).toBeGreaterThanOrEqual(0);
    expect(mesh.bounds.min.z).toBeLessThanOrEqual(0);
    expect(mesh.bounds.max.z).toBeGreaterThanOrEqual(0);

    // Size should be approximately 1
    const sizeX = mesh.bounds.max.x - mesh.bounds.min.x;
    const sizeY = mesh.bounds.max.y - mesh.bounds.min.y;
    const sizeZ = mesh.bounds.max.z - mesh.bounds.min.z;
    const maxSize = Math.max(sizeX, sizeY, sizeZ);
    expect(maxSize).toBeCloseTo(1, 1);
  });

  it('should remove degenerate triangles', () => {
    // Create STL with a degenerate triangle (all vertices at same point)
    const stlContent = `solid Test
facet normal 0 0 1
  outer loop
    vertex 0 0 0
    vertex 0 0 0
    vertex 0 0 0
  endloop
endfacet
facet normal 0 0 1
  outer loop
    vertex 0 0 1
    vertex 1 0 1
    vertex 1 1 1
  endloop
endfacet
endsolid Test`;

    const buffer = Buffer.from(stlContent, 'utf8');
    const mesh = parseSTL(buffer);

    // Should only have 1 valid face (degenerate removed)
    expect(mesh.faces.length).toBe(1);
  });

  it('should throw error on invalid STL', () => {
    const buffer = Buffer.from('invalid stl content', 'utf8');
    expect(() => parseSTL(buffer)).toThrow();
  });
});

describe('Projection Engine', () => {
  it('should generate 6 projections', () => {
    const buffer = createSimpleCubeSTL();
    const mesh = parseSTL(buffer);
    const projections = generateProjections(mesh);

    expect(projections).toHaveLength(6);
    expect(projections.map((p) => p.name)).toEqual(['front', 'back', 'left', 'right', 'top', 'bottom']);
  });

  it('should have valid bounding boxes', () => {
    const buffer = createSimpleCubeSTL();
    const mesh = parseSTL(buffer);
    const projections = generateProjections(mesh);

    for (const projection of projections) {
      const [xmin, ymin, xmax, ymax] = projection.bbox;
      expect(xmin).toBeLessThan(xmax);
      expect(ymin).toBeLessThan(ymax);
    }
  });

  it('should generate line data for each projection', () => {
    const buffer = createSimpleCubeSTL();
    const mesh = parseSTL(buffer);
    const projections = generateProjections(mesh);

    for (const projection of projections) {
      expect(projection.lines).toBeDefined();
      expect(Array.isArray(projection.lines)).toBe(true);

      // Each line should have 2 points with 2 coordinates each
      for (const line of projection.lines) {
        expect(line).toHaveLength(2);
        expect(line[0]).toHaveLength(2);
        expect(line[1]).toHaveLength(2);
        expect(typeof line[0][0]).toBe('number');
        expect(typeof line[0][1]).toBe('number');
        expect(typeof line[1][0]).toBe('number');
        expect(typeof line[1][1]).toBe('number');
      }
    }
  });

  it('should have consistent line data structure', () => {
    const buffer = createSimpleCubeSTL();
    const mesh = parseSTL(buffer);
    const projections = generateProjections(mesh);

    // Front view should have some lines
    const frontView = projections.find((p) => p.name === 'front');
    expect(frontView).toBeDefined();
    expect(frontView!.lines.length).toBeGreaterThan(0);
  });
});
