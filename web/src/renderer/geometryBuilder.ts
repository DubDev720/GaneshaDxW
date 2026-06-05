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
          geometry: this.buildTriangulatedGeometry(positions, polygon),
        };
      }),
    );
  }

  buildPolygonGeometry(
    document: MeshDocument,
    polygon: MapPolygon,
  ): BuiltPolygonGeometry {
    const vertexById = new Map(
      document.vertices.map((vertex) => [vertex.id, vertex.ganeshaDxPosition]),
    );
    const positions = polygon.vertexIds.map((vertexId) => {
      const position = vertexById.get(vertexId);
      if (!position) {
        throw new Error(`Polygon ${polygon.id} references missing vertex ${vertexId}`);
      }
      return position;
    });

    return {
      polygon,
      geometry: this.buildTriangulatedGeometry(positions, polygon),
    };
  }

  private buildTriangulatedGeometry(
    positions: readonly (readonly [number, number, number])[],
    polygon: MapPolygon,
  ): THREE.BufferGeometry {
    if (positions.length !== 3 && positions.length !== 4) {
      throw new Error(`Only triangle and quad polygons are supported, got ${positions.length}`);
    }

    const triangleIndices =
      positions.length === 3 ? [2, 1, 0] : [2, 3, 1, 2, 1, 0];
    const triangulatedPositions = new Float32Array(triangleIndices.length * 3);
    const triangulatedUvs = polygon.uv?.length === positions.length
      ? new Float32Array(triangleIndices.length * 2)
      : null;

    triangleIndices.forEach((sourceIndex, triangleIndex) => {
      const position = positions[sourceIndex];
      triangulatedPositions.set(position, triangleIndex * 3);

      if (triangulatedUvs && polygon.uv) {
        const uv = polygon.uv[sourceIndex] ?? [0, 0];
        triangulatedUvs.set(
          this.toTextureAtlasUv(uv, polygon.texturePage ?? 0),
          triangleIndex * 2,
        );
      }
    });

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(triangulatedPositions, 3),
    );
    if (triangulatedUvs) {
      geometry.setAttribute("uv", new THREE.BufferAttribute(triangulatedUvs, 2));
    }
    geometry.computeVertexNormals();
    return geometry;
  }

  private toTextureAtlasUv(
    uv: readonly [number, number],
    texturePage: number,
  ): readonly [number, number] {
    return [
      uv[0] / 256,
      (uv[1] + 256 * texturePage) / 1024,
    ];
  }
}
