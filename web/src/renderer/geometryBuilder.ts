import * as THREE from "three";
import type { MapPolygon, MeshDocument } from "../domain/mapDocument";

export interface BuiltPolygonGeometry {
  geometry: THREE.BufferGeometry;
  polygon: MapPolygon;
}

export class GeometryBuilder {
  buildPolygonGeometries(document: MeshDocument): BuiltPolygonGeometry[] {
    const vertexById = new Map(
      document.vertices.map((vertex) => [vertex.id, vertex.ganeshaDxPosition]),
    );

    return document.sections.flatMap((section) =>
      section.polygons.map((polygon) => {
        const positions = polygon.vertexIds.map((vertexId) => {
          const position = vertexById.get(vertexId);
          if (!position) {
            throw new Error(`Polygon ${polygon.id} references missing vertex ${vertexId}`);
          }
          return position;
        });

        return {
          polygon,
          geometry: this.buildTriangulatedGeometry(positions),
        };
      }),
    );
  }

  private buildTriangulatedGeometry(
    positions: readonly (readonly [number, number, number])[],
  ): THREE.BufferGeometry {
    if (positions.length !== 3 && positions.length !== 4) {
      throw new Error(`Only triangle and quad polygons are supported, got ${positions.length}`);
    }

    const triangleIndices =
      positions.length === 3 ? [0, 1, 2] : [0, 1, 2, 0, 2, 3];
    const triangulatedPositions = new Float32Array(triangleIndices.length * 3);

    triangleIndices.forEach((sourceIndex, triangleIndex) => {
      const position = positions[sourceIndex];
      triangulatedPositions.set(position, triangleIndex * 3);
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(triangulatedPositions, 3),
    );
    geometry.computeVertexNormals();
    return geometry;
  }
}
