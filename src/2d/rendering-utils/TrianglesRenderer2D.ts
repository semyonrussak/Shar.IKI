import * as THREE from 'three';
import { RenderEngine2D } from '../engine/RenderEngine2D';
import { ProjectionManager } from '../projections/ProjectionManager';

export interface TriangleData2D {
    lat1: number; lon1: number; color1: string;
    lat2: number; lon2: number; color2: string;
    lat3: number; lon3: number; color3: string;
    gradientColor: boolean;
}

export class TrianglesRenderer2D {
    private engine: RenderEngine2D;
    private projectionManager: ProjectionManager;
    private mesh: THREE.Mesh | null = null;
    private trianglesData: TriangleData2D[] = [];

    constructor(engine: RenderEngine2D, projectionManager: ProjectionManager) {
        this.engine = engine;
        this.projectionManager = projectionManager;
    }

    /**
     * Accepts an array of triangles and displays them.
     */
    setData(triangles: TriangleData2D[]): void {
        this.trianglesData = triangles;
        this.rebuildGeometry();
    }

    /**
     * Recalculates positions when the projection changes.
     */
    update(): void {
        this.rebuildGeometry();
    }

    /**
     * Removes the mesh and frees resources.
     */
    dispose(): void {
        if (this.mesh) {
            this.engine.getScene().remove(this.mesh);
            this.cleanupMesh(this.mesh);
            this.mesh = null;
        }
    }

    private rebuildGeometry(): void {
        // Remove old mesh
        if (this.mesh) {
            this.engine.getScene().remove(this.mesh);
            this.cleanupMesh(this.mesh);
            this.mesh = null;
        }

        if (this.trianglesData.length === 0) return;

        const positions: number[] = [];
        const colors: number[] = [];
        const indices: number[] = [];

        const addTriangleVertices = (tri: TriangleData2D, lonShift: number = 0) => {
            const p1 = this.projectionManager.projectPoint(tri.lat1, tri.lon1 + lonShift);
            const p2 = this.projectionManager.projectPoint(tri.lat2, tri.lon2 + lonShift);
            const p3 = this.projectionManager.projectPoint(tri.lat3, tri.lon3 + lonShift);
            const c1 = this.hexToRgba(tri.color1);
            const c2 = tri.gradientColor ? this.hexToRgba(tri.color2) : c1;
            const c3 = tri.gradientColor ? this.hexToRgba(tri.color3) : c1;

            const baseIndex = positions.length / 3;
            positions.push(p1.x, p1.y, 0); colors.push(c1.r, c1.g, c1.b, c1.a);
            positions.push(p2.x, p2.y, 0); colors.push(c2.r, c2.g, c2.b, c2.a);
            positions.push(p3.x, p3.y, 0); colors.push(c3.r, c3.g, c3.b, c3.a);
            for (let i = 0; i < 3; i++) indices.push(baseIndex + i);
        };

        this.trianglesData.forEach(tri => {
            addTriangleVertices(tri);
            // Check if triangle crosses 180 meridian
            const lons = [tri.lon1, tri.lon2, tri.lon3];
            const maxLon = Math.max(...lons);
            const minLon = Math.min(...lons);
            const crosses = (maxLon > 150 && minLon < -150) || (maxLon - minLon > 180);
            if (crosses) {
                const shift = maxLon > 0 ? -360 : 360;
                addTriangleVertices(tri, shift);
            }
        });

        // Build geometry
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 4));
        geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(indices), 1));
        geometry.computeVertexNormals();

        // Material with vertex colors and transparency
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

    private hexToRgba(hex: string): { r: number; g: number; b: number; a: number } {
        hex = hex.replace('#', '');
        if (hex.length === 3) {
            hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
        }
        if (hex.length === 6) hex += 'FF';
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        const a = parseInt(hex.substring(6, 8), 16) / 255;
        return { r, g, b, a };
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