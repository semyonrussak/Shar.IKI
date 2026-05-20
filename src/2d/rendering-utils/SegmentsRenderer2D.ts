import * as THREE from 'three';
import { RenderEngine2D } from '../engine/RenderEngine2D';
import { ProjectionManager } from '../projections/ProjectionManager';

export interface SegmentData2D {
    lat1: number;
    lon1: number;
    color1: string;
    lat2: number;
    lon2: number;
    color2: string;
    width: number;       // thickness in screen pixels
    gradientColor: boolean;
}

export class SegmentsRenderer2D {
    private engine: RenderEngine2D;
    private projectionManager: ProjectionManager;
    private mesh: THREE.Mesh | null = null;

    constructor(engine: RenderEngine2D, projectionManager: ProjectionManager) {
        this.engine = engine;
        this.projectionManager = projectionManager;
    }

    /**
     * Renders an array of segments. Each segment is a thick line with optional gradient coloring.
     */
    setData(segments: SegmentData2D[]): void {
        // Remove previous mesh if exists
        if (this.mesh) {
            this.engine.getScene().remove(this.mesh);
            this.cleanupMesh(this.mesh);
            this.mesh = null;
        }

        if (segments.length === 0) return;

        // Each segment is drawn as a rectangle (2 triangles) → 6 vertices per segment
        const verticesPerSegment = 6;
        const totalVertices = segments.length * verticesPerSegment;

        const positions = new Float32Array(totalVertices * 3); // x,y,z
        const colors = new Float32Array(totalVertices * 4);    // r,g,b,a
        const indices = new Uint32Array(totalVertices);

        let vertexIndex = 0;
        let colorIndex = 0;
        let indexIndex = 0;

        const p1 = new THREE.Vector2();
        const p2 = new THREE.Vector2();
        const dir = new THREE.Vector2();
        const perpendicular = new THREE.Vector2();
        const offset = new THREE.Vector2();

        segments.forEach(segment => {
            // Convert geographic coordinates to screen pixels
            const screen1 = this.projectionManager.projectPoint(segment.lat1, segment.lon1);
            const screen2 = this.projectionManager.projectPoint(segment.lat2, segment.lon2);

            p1.set(screen1.x, screen1.y);
            p2.set(screen2.x, screen2.y);

            // Direction and perpendicular vector for thickness
            dir.subVectors(p2, p1).normalize();
            perpendicular.set(-dir.y, dir.x).multiplyScalar(segment.width / 2);

            // Four corners of the rectangle
            const c1 = new THREE.Vector2().addVectors(p1, perpendicular);
            const c2 = new THREE.Vector2().addVectors(p1, perpendicular.clone().negate());
            const c3 = new THREE.Vector2().addVectors(p2, perpendicular);
            const c4 = new THREE.Vector2().addVectors(p2, perpendicular.clone().negate());

            // Colors (hex -> rgba)
            const rgba1 = this.hexToRgba(segment.color1);
            const rgba2 = segment.gradientColor ? this.hexToRgba(segment.color2) : rgba1;

            // Triangle 1: c1, c2, c3
            this.addVertex(positions, colors, vertexIndex, colorIndex, c1.x, c1.y, rgba1);
            vertexIndex += 3; colorIndex += 4;
            this.addVertex(positions, colors, vertexIndex, colorIndex, c2.x, c2.y, rgba1);
            vertexIndex += 3; colorIndex += 4;
            this.addVertex(positions, colors, vertexIndex, colorIndex, c3.x, c3.y, rgba2);
            vertexIndex += 3; colorIndex += 4;

            // Triangle 2: c2, c4, c3
            this.addVertex(positions, colors, vertexIndex, colorIndex, c2.x, c2.y, rgba1);
            vertexIndex += 3; colorIndex += 4;
            this.addVertex(positions, colors, vertexIndex, colorIndex, c4.x, c4.y, rgba2);
            vertexIndex += 3; colorIndex += 4;
            this.addVertex(positions, colors, vertexIndex, colorIndex, c3.x, c3.y, rgba2);
            vertexIndex += 3; colorIndex += 4;

            // Indices (sequential, but we'll set them later)
            for (let i = 0; i < 6; i++) {
                indices[indexIndex++] = indexIndex;
            }
        });

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4));
        geometry.setIndex(new THREE.BufferAttribute(indices, 1));
        geometry.computeVertexNormals();

        const material = new THREE.MeshBasicMaterial({
            vertexColors: true,
            side: THREE.DoubleSide,
            transparent: true,
            depthTest: true,
            depthWrite: true
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.engine.getScene().add(this.mesh);
    }

    private addVertex(
        positions: Float32Array,
        colors: Float32Array,
        posIdx: number,
        colIdx: number,
        x: number, y: number,
        color: { r: number; g: number; b: number; a: number }
    ): void {
        positions[posIdx] = x;
        positions[posIdx + 1] = y;
        positions[posIdx + 2] = 0;

        colors[colIdx] = color.r;
        colors[colIdx + 1] = color.g;
        colors[colIdx + 2] = color.b;
        colors[colIdx + 3] = color.a;
    }

    private hexToRgba(hex: string): { r: number; g: number; b: number; a: number } {
        // Remove '#' if present
        hex = hex.replace('#', '');
        // Expand shorthand (e.g. 'FFF' -> 'FFFFFF')
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        // Append alpha if missing
        if (hex.length === 6) hex += 'FF';
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        const a = parseInt(hex.substring(6, 8), 16) / 255;
        return { r, g, b, a };
    }

    dispose(): void {
        if (this.mesh) {
            this.engine.getScene().remove(this.mesh);
            this.cleanupMesh(this.mesh);
            this.mesh = null;
        }
    }

    private cleanupMesh(mesh: THREE.Mesh): void {
        mesh.geometry.dispose();
        if (Array.isArray(mesh.material)) {
            mesh.material.forEach(m => m.dispose());
        } else {
            mesh.material.dispose();
        }
    }
}