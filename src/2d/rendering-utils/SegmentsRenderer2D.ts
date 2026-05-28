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
    private segmentsData: SegmentData2D[] = [];

    constructor(engine: RenderEngine2D, projectionManager: ProjectionManager) {
        this.engine = engine;
        this.projectionManager = projectionManager;
    }

    setData(segments: SegmentData2D[]): void {
        this.segmentsData = segments;
        this.rebuildGeometry();
    }

    private rebuildGeometry(): void {
        // Удалить старый меш
        if (this.mesh) {
            this.engine.getScene().remove(this.mesh);
            this.cleanupMesh(this.mesh);
            this.mesh = null;
        }

        if (this.segmentsData.length === 0) return;

        // Temporary arrays
        const positions: number[] = [];
        const colors: number[] = [];
        const indices: number[] = [];

        const addSegmentVertices = (seg: SegmentData2D, lonShift: number = 0) => {
            const screen1 = this.projectionManager.projectPoint(seg.lat1, seg.lon1 + lonShift);
            const screen2 = this.projectionManager.projectPoint(seg.lat2, seg.lon2 + lonShift);
            const p1 = new THREE.Vector2(screen1.x, screen1.y);
            const p2 = new THREE.Vector2(screen2.x, screen2.y);
            const dir = new THREE.Vector2().subVectors(p2, p1).normalize();
            const perpendicular = new THREE.Vector2(-dir.y, dir.x).multiplyScalar(seg.width / 2);
            const c1 = new THREE.Vector2().addVectors(p1, perpendicular);
            const c2 = new THREE.Vector2().addVectors(p1, perpendicular.clone().negate());
            const c3 = new THREE.Vector2().addVectors(p2, perpendicular);
            const c4 = new THREE.Vector2().addVectors(p2, perpendicular.clone().negate());
            const rgba1 = this.hexToRgba(seg.color1);
            const rgba2 = seg.gradientColor ? this.hexToRgba(seg.color2) : rgba1;

            const baseIndex = positions.length / 3; // current vertex count
            // triangle 1: c1, c2, c3
            positions.push(c1.x, c1.y, 0); colors.push(rgba1.r, rgba1.g, rgba1.b, rgba1.a);
            positions.push(c2.x, c2.y, 0); colors.push(rgba1.r, rgba1.g, rgba1.b, rgba1.a);
            positions.push(c3.x, c3.y, 0); colors.push(rgba2.r, rgba2.g, rgba2.b, rgba2.a);
            // triangle 2: c2, c4, c3
            positions.push(c2.x, c2.y, 0); colors.push(rgba1.r, rgba1.g, rgba1.b, rgba1.a);
            positions.push(c4.x, c4.y, 0); colors.push(rgba2.r, rgba2.g, rgba2.b, rgba2.a);
            positions.push(c3.x, c3.y, 0); colors.push(rgba2.r, rgba2.g, rgba2.b, rgba2.a);

            for (let i = 0; i < 6; i++) indices.push(baseIndex + i);
        };

        // Обработка каждого сегмента (это было пропущено!)
        this.segmentsData.forEach(segment => {
            addSegmentVertices(segment);
            // Check if segment crosses 180 meridian
            const lonDiff = Math.abs(segment.lon1 - segment.lon2);
            const crosses = (segment.lon1 > 150 && segment.lon2 < -150) || (segment.lon2 > 150 && segment.lon1 < -150) || lonDiff > 180;
            if (crosses) {
                const shift = segment.lon1 > 0 ? -360 : 360;
                addSegmentVertices(segment, shift);
            }
        });

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 4));
        geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
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

    update(): void {
        this.rebuildGeometry();
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

