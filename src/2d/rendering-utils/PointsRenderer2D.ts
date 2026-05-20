import * as THREE from 'three';
import { RenderEngine2D } from '../engine/RenderEngine2D';
import { ProjectionManager } from '../projections/ProjectionManager';

export class PointsRenderer2D {
    private engine: RenderEngine2D;
    private projectionManager: ProjectionManager;
    private mesh: THREE.Points | null = null;
    private source: any;

    constructor(engine: RenderEngine2D, projectionManager: ProjectionManager) {
        this.engine = engine;
        this.projectionManager = projectionManager;
    }

    // Принимает массив точек в формате { lat, lon, color:string } и отображает их.
    setData(points: Array<{ lat: number; lon: number; color: string }>): void {
        // Удаляем старый меш, если был
        if (this.mesh) {
            this.engine.getScene().remove(this.mesh);
            this.mesh.geometry.dispose();
            (this.mesh.material as THREE.Material).dispose();
            this.mesh = null;
        }

        const positions: number[] = [];
        const colors: number[] = [];

        points.forEach(point => {
            const screenPos = this.projectionManager.projectPoint(point.lat, point.lon);
            positions.push(screenPos.x, screenPos.y, 0);
            const color = new THREE.Color(point.color);
            colors.push(color.r, color.g, color.b);
        });

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));

        const material = new THREE.PointsMaterial({
            size: 10,
            vertexColors: true
        });

        this.mesh = new THREE.Points(geometry, material);
        this.engine.getScene().add(this.mesh);
    }

    // Обновляет позиции точек при смене проекции или ресайзе.
    update(): void {
    // Пока заглушка – позже будет пересоздавать геометрию как setData
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