/**
 * STL Parser - Handles both ASCII and Binary STL formats
 * Returns normalized mesh with vertices and faces
 */

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Face {
  vertices: [number, number, number]; // indices into vertices array
  normal: Vector3;
}

export interface Mesh {
  vertices: Vector3[];
  faces: Face[];
  bounds: {
    min: Vector3;
    max: Vector3;
  };
}

/**
 * Check if buffer is ASCII STL by looking for "solid" keyword
 */
function isAsciiSTL(buffer: Buffer): boolean {
  const header = buffer.toString('utf8', 0, Math.min(5, buffer.length)).toLowerCase();
  return header.includes('solid');
}

/**
 * Parse ASCII STL format
 */
function parseAsciiSTL(content: string): Mesh {
  const vertices: Vector3[] = [];
  const faces: Face[] = [];
  const vertexMap = new Map<string, number>();

  // Regex patterns
  const vertexPattern = /vertex\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)/g;
  const normalPattern = /facet\s+normal\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)\s+([-+]?[0-9]*\.?[0-9]+([eE][-+]?[0-9]+)?)/g;

  const vertexMatches = Array.from(content.matchAll(vertexPattern));
  const normalMatches = Array.from(content.matchAll(normalPattern));

  if (vertexMatches.length === 0) {
    throw new Error('No vertices found in ASCII STL');
  }

  let faceIndex = 0;
  let vertexInFace = 0;
  let currentFaceVertices: [number, number, number] | null = null;
  let currentNormal: Vector3 = { x: 0, y: 0, z: 0 };

  for (let i = 0; i < vertexMatches.length; i++) {
    const match = vertexMatches[i];
    const x = parseFloat(match[1]);
    const y = parseFloat(match[3]);
    const z = parseFloat(match[5]);

    const key = `${x},${y},${z}`;
    let vertexIdx: number;

    if (vertexMap.has(key)) {
      vertexIdx = vertexMap.get(key)!;
    } else {
      vertexIdx = vertices.length;
      vertices.push({ x, y, z });
      vertexMap.set(key, vertexIdx);
    }

    if (vertexInFace === 0) {
      currentFaceVertices = [vertexIdx, 0, 0];
      if (faceIndex < normalMatches.length) {
        const normalMatch = normalMatches[faceIndex];
        currentNormal = {
          x: parseFloat(normalMatch[1]),
          y: parseFloat(normalMatch[3]),
          z: parseFloat(normalMatch[5]),
        };
      }
    } else if (vertexInFace === 1) {
      currentFaceVertices![1] = vertexIdx;
    } else if (vertexInFace === 2) {
      currentFaceVertices![2] = vertexIdx;
      faces.push({
        vertices: currentFaceVertices!,
        normal: currentNormal,
      });
      faceIndex++;
      vertexInFace = -1;
    }
    vertexInFace++;
  }

  return {
    vertices,
    faces,
    bounds: calculateBounds(vertices),
  };
}

/**
 * Parse Binary STL format
 */
function parseBinarySTL(buffer: Buffer): Mesh {
  if (buffer.length < 84) {
    throw new Error('Binary STL file too small');
  }

  const vertices: Vector3[] = [];
  const faces: Face[] = [];
  const vertexMap = new Map<string, number>();

  // Skip 80-byte header
  let offset = 80;

  // Read number of triangles (4 bytes, little-endian)
  const numTriangles = buffer.readUInt32LE(offset);
  offset += 4;

  const expectedLength = 80 + 4 + numTriangles * 50;
  if (buffer.length < expectedLength) {
    throw new Error(`Binary STL truncated: expected ${expectedLength} bytes, got ${buffer.length}`);
  }

  for (let i = 0; i < numTriangles; i++) {
    // Read normal (3 floats, 12 bytes)
    const nx = buffer.readFloatLE(offset);
    const ny = buffer.readFloatLE(offset + 4);
    const nz = buffer.readFloatLE(offset + 8);
    offset += 12;

    const normal: Vector3 = { x: nx, y: ny, z: nz };

    // Read 3 vertices (3 * 3 floats = 36 bytes)
    const faceVertices: [number, number, number] = [0, 0, 0];

    for (let j = 0; j < 3; j++) {
      const x = buffer.readFloatLE(offset);
      const y = buffer.readFloatLE(offset + 4);
      const z = buffer.readFloatLE(offset + 8);
      offset += 12;

      const key = `${x},${y},${z}`;
      let vertexIdx: number;

      if (vertexMap.has(key)) {
        vertexIdx = vertexMap.get(key)!;
      } else {
        vertexIdx = vertices.length;
        vertices.push({ x, y, z });
        vertexMap.set(key, vertexIdx);
      }

      faceVertices[j] = vertexIdx;
    }

    // Skip attribute byte count (2 bytes)
    offset += 2;

    faces.push({
      vertices: faceVertices,
      normal,
    });
  }

  return {
    vertices,
    faces,
    bounds: calculateBounds(vertices),
  };
}

/**
 * Calculate bounding box of mesh
 */
function calculateBounds(vertices: Vector3[]) {
  if (vertices.length === 0) {
    return {
      min: { x: 0, y: 0, z: 0 },
      max: { x: 0, y: 0, z: 0 },
    };
  }

  let minX = vertices[0].x,
    minY = vertices[0].y,
    minZ = vertices[0].z;
  let maxX = minX,
    maxY = minY,
    maxZ = minZ;

  for (let i = 1; i < vertices.length; i++) {
    const v = vertices[i];
    if (v.x < minX) minX = v.x;
    if (v.x > maxX) maxX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.y > maxY) maxY = v.y;
    if (v.z < minZ) minZ = v.z;
    if (v.z > maxZ) maxZ = v.z;
  }

  return {
    min: { x: minX, y: minY, z: minZ },
    max: { x: maxX, y: maxY, z: maxZ },
  };
}

/**
 * Remove degenerate triangles (area < epsilon)
 */
function removeDegenerate(mesh: Mesh, epsilon: number = 1e-10): Mesh {
  const validFaces = mesh.faces.filter((face) => {
    const v0 = mesh.vertices[face.vertices[0]];
    const v1 = mesh.vertices[face.vertices[1]];
    const v2 = mesh.vertices[face.vertices[2]];

    // Calculate triangle area using cross product
    const e1 = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z };
    const e2 = { x: v2.x - v0.x, y: v2.y - v0.y, z: v2.z - v0.z };

    const cross = {
      x: e1.y * e2.z - e1.z * e2.y,
      y: e1.z * e2.x - e1.x * e2.z,
      z: e1.x * e2.y - e1.y * e2.x,
    };

    const area = Math.sqrt(cross.x * cross.x + cross.y * cross.y + cross.z * cross.z);
    return area > epsilon;
  });

  return {
    vertices: mesh.vertices,
    faces: validFaces,
    bounds: mesh.bounds,
  };
}

/**
 * Normalize mesh: center at origin and scale to unit cube
 */
function normalizeMesh(mesh: Mesh): Mesh {
  const bounds = mesh.bounds;
  const size = Math.max(
    bounds.max.x - bounds.min.x,
    bounds.max.y - bounds.min.y,
    bounds.max.z - bounds.min.z,
  );

  if (size === 0) {
    throw new Error('Mesh has zero size');
  }

  const center = {
    x: (bounds.min.x + bounds.max.x) / 2,
    y: (bounds.min.y + bounds.max.y) / 2,
    z: (bounds.min.z + bounds.max.z) / 2,
  };

  const scale = 1 / size;

  const normalizedVertices = mesh.vertices.map((v) => ({
    x: (v.x - center.x) * scale,
    y: (v.y - center.y) * scale,
    z: (v.z - center.z) * scale,
  }));

  return {
    vertices: normalizedVertices,
    faces: mesh.faces,
    bounds: calculateBounds(normalizedVertices),
  };
}

/**
 * Main parsing function
 */
export function parseSTL(buffer: Buffer): Mesh {
  try {
    let mesh: Mesh;

    if (isAsciiSTL(buffer)) {
      const content = buffer.toString('utf8');
      mesh = parseAsciiSTL(content);
    } else {
      mesh = parseBinarySTL(buffer);
    }

    // Clean up degenerate triangles
    mesh = removeDegenerate(mesh);

    if (mesh.faces.length === 0) {
      throw new Error('No valid faces in STL');
    }

    // Normalize mesh
    mesh = normalizeMesh(mesh);

    return mesh;
  } catch (error) {
    throw new Error(`STL parsing failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}
