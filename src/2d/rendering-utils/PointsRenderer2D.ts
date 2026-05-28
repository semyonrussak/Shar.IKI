import * as THREE from 'three';
import { RenderEngine2D } from '../engine/RenderEngine2D';
import { ProjectionManager } from '../projections/ProjectionManager';

export class PointsRenderer2D {
    private engine: RenderEngine2D;
    private projectionManager: ProjectionManager;
    private mesh: THREE.Points | null = null;
    private source: any;
    private pointsData: Array<{ lat: number; lon: number; color: string }> = [];

    constructor(engine: RenderEngine2D, projectionManager: ProjectionManager) {
        this.engine = engine;
        this.projectionManager = projectionManager;
    }

    // Принимает массив точек в формате { lat, lon, color:string } и отображает их.
    setData(points: Array<{ lat: number; lon: number; color: string }>): void {
        this.pointsData = points;
        this.rebuildGeometry();
    }

    private rebuildGeometry(): void {
        if (this.mesh) {
            this.engine.getScene().remove(this.mesh);
            this.mesh.geometry.dispose();
            (this.mesh.material as THREE.Material).dispose();
            this.mesh = null;
        }

        // Helper: check if a point needs duplication
        const crosses180 = (lon: number, radius: number) => {
            // radius is not used for points but kept for uniformity
            // If lon is exactly 180, it is on the boundary – we'll shift it
            return lon > 180 || lon < -180 || lon === 180;
        };

        const positions: number[] = [];
        const colors: number[] = [];

        this.pointsData.forEach(point => {
            const screenPos = this.projectionManager.projectPoint(point.lat, point.lon);
            positions.push(screenPos.x, screenPos.y, 0);
            const color = new THREE.Color(point.color);
            colors.push(color.r, color.g, color.b);

            // Duplicate if crossing 180 meridian
            if (crosses180(point.lon, 0)) {
                // Shift longitude by ±360° to make it appear on the other side
                const shiftedLon = point.lon > 0 ? point.lon - 360 : point.lon + 360;
                const shiftedScreen = this.projectionManager.projectPoint(point.lat, shiftedLon);
                positions.push(shiftedScreen.x, shiftedScreen.y, 0);
                colors.push(color.r, color.g, color.b);
            }
        });

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));

        const material = new THREE.PointsMaterial({ size: 10, vertexColors: true });
        this.mesh = new THREE.Points(geometry, material);
        this.engine.getScene().add(this.mesh);
    }

    // Обновляет позиции точек при смене проекции или ресайзе.
    update(): void {
        this.rebuildGeometry();
    }

    dispose(): void {
        if (this.mesh) {
            this.engine.getScene().remove(this.mesh);
            this.mesh.geometry.dispose();
            (this.mesh.material as THREE.Material).dispose();
            this.mesh = null;
        }
    }
}