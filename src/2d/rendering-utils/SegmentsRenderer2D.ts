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

        // --- ДАЛЬШЕ ТОТ ЖЕ САМЫЙ КОД, ЧТО БЫЛ У ТЕБЯ В setData, НО ИСПОЛЬЗУЕТ this.segmentsData ---
        const segments = this.segmentsData;   // для краткости

        const verticesPerSegment = 6;
        const totalVertices = segments.length * verticesPerSegment;

        const positions = new Float32Array(totalVertices * 3);
        const colors = new Float32Array(totalVertices * 4);
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
            // ... ровно тот же код, что и раньше ...
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

