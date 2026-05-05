import * as THREE from 'three';

import { shariki as RenderingUtil } from "./rendering-util"
import { shariki as Engine } from "../engine"
import { shariki as Source } from "../source/source"
import { shariki as LabelInfo } from "../data-interfaces/label-info"
import { shariki as SegmentData } from "../data-interfaces/segment-data"
import { shariki as OptimizationOptions } from "../options/optimization-options"

export namespace shariki {
    export class SegmentsDirectlyRenderingUtil
        implements RenderingUtil.RenderingUtil {
        protected engine: Engine.Engine;
        protected source: Source.Source
        protected mesh: THREE.Mesh | null = null;
        protected depthTest: boolean
        protected depthWrite: boolean
        protected transparent: boolean
        protected geometry: THREE.SphereGeometry | null = null

        public constructor(
            engine: Engine.Engine,
            source: Source.Source,
            depthTest: boolean,
            depthWrite: boolean,
            transparent: boolean
        ) {
            this.engine = engine;
            this.source = source
            this.depthTest = depthTest
            this.depthWrite = depthWrite
            this.transparent = transparent
        }

        public getMesh(): THREE.Mesh | null {
            return this.mesh
        }

        public getLabelInfos(): LabelInfo.LabelInfo[] | null {
            return []
        }

        public loadTexture(): void {
            throw new Error("Not implemented")
        }

        public textureIsLoaded(): boolean {
            throw new Error("Not implemented")
        }

        public needsAsynchronousTextureLoad(): boolean {
            return false
        }

        public setOnTextureIsLoaded(
            //@ts-ignore
            action: () => void
        ): void {
        }

        public dispose(): void {
            if (this.mesh) {
                this.engine.getScene().remove(this.mesh);
                this.cleanupMesh(this.mesh);
                this.mesh = null;
                this.geometry = null
            }
        }

        protected cleanupMesh(mesh: THREE.Mesh): void {
            mesh.geometry.dispose();
            if (Array.isArray(mesh.material)) {
                mesh.material.forEach(m => m.dispose());
            } else {
                mesh.material.dispose();
            }

            this.setMeshToNull()
        }

        private setMeshToNull() {
            this.mesh = null
        }

        public createMesh(
            //@ts-ignore
            optimizationOptions: OptimizationOptions.OptimizationOptions,
            renderOrder: number): void {

            const segmentsData = this.getData();
            if (!segmentsData || segmentsData.length === 0) {
                this.mesh = null;
                return;
            }

            // Рассчитываем общее количество вершин
            // Каждый отрезок = 2 треугольника = 6 вершин
            const verticesPerSegment = 6;
            const totalVertices = segmentsData.length * verticesPerSegment;

            // Создаем массивы для атрибутов
            const positions = new Float32Array(totalVertices * 3);
            const colors = new Float32Array(totalVertices * 3);
            const indices = new Uint32Array(totalVertices);

            let vertexIndex = 0;
            let colorIndex = 0;
            let indexIndex = 0;

            // Вспомогательные векторы для вычислений
            const p1 = new THREE.Vector3();
            const p2 = new THREE.Vector3();
            const zero = new THREE.Vector3(0, 0, 0);
            const dir = new THREE.Vector3();
            const normal = new THREE.Vector3();
            const perpendicular = new THREE.Vector3();
            const offset1 = new THREE.Vector3();
            const offset2 = new THREE.Vector3();

            segmentsData.forEach((segment: SegmentData.SegmentData,
                //@ts-ignore
                segmentIndex: number) => {
                const firstPoint = segment.firstEndData;
                const secondPoint = segment.secondEndData;
                const width = segment.width;
                const gradientColor = segment.gradientColor;

                // Преобразуем точки в векторы Three.js
                p1.set(firstPoint.x, firstPoint.y, firstPoint.z);
                p2.set(secondPoint.x, secondPoint.y, secondPoint.z);

                // Вычисляем направление отрезка
                dir.subVectors(p2, p1).normalize();

                // Вычисляем нормаль к плоскости (firstPoint, secondPoint, zero)
                const v1 = new THREE.Vector3().subVectors(p2, p1);
                const v2 = new THREE.Vector3().subVectors(zero, p1);
                normal.crossVectors(v1, v2).normalize();

                // Вычисляем перпендикулярный вектор в плоскости
                perpendicular.crossVectors(dir, normal).normalize();

                // Вычисляем смещения для ширины отрезка
                const halfWidth = width / 2;
                offset1.copy(perpendicular).multiplyScalar(halfWidth);
                offset2.copy(perpendicular).multiplyScalar(-halfWidth);

                // Определяем 4 угловые точки прямоугольника отрезка
                const corner1 = new THREE.Vector3().addVectors(p1, offset1);
                const corner2 = new THREE.Vector3().addVectors(p1, offset2);
                const corner3 = new THREE.Vector3().addVectors(p2, offset1);
                const corner4 = new THREE.Vector3().addVectors(p2, offset2);

                // Преобразуем цвета в формат Three.js (0-1)
                const color1 = new THREE.Color(firstPoint.color);
                const color2 = gradientColor ? new THREE.Color(secondPoint.color) : color1;

                // Создаем два треугольника для прямоугольника
                // Треугольник 1: corner1, corner2, corner3
                addVertex(corner1, color1);
                addVertex(corner2, color1);
                addVertex(corner3, color2);

                // Треугольник 2: corner2, corner4, corner3
                addVertex(corner2, color1);
                addVertex(corner4, color2);
                addVertex(corner3, color2);
            });

            // Функция для добавления вершины
            function addVertex(position: THREE.Vector3, color: THREE.Color): void {
                // Позиция
                positions[vertexIndex++] = position.x;
                positions[vertexIndex++] = position.y;
                positions[vertexIndex++] = position.z;

                // Цвет
                colors[colorIndex++] = color.r;
                colors[colorIndex++] = color.g;
                colors[colorIndex++] = color.b;

                // Индекс
                indices[indexIndex++] = indexIndex;
            }

            // Создаем BufferGeometry
            const geometry = new THREE.BufferGeometry();

            // Устанавливаем атрибуты
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
            geometry.setIndex(new THREE.BufferAttribute(indices, 1));

            // Вычисляем ограничивающую сферу
            geometry.computeBoundingSphere();

            // Создаем материал
            const material = new THREE.MeshBasicMaterial({
                vertexColors: true,
                side: THREE.DoubleSide,
                depthTest: this.depthTest,
                depthWrite: this.depthWrite,
                transparent: this.transparent
            });

            // Создаем меш
            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.renderOrder = renderOrder;
        }

        protected getData() {
            return this.source.getData()
        }
    }
}