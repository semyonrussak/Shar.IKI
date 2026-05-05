import * as THREE from 'three';

import { shariki as RenderingUtil } from "./rendering-util"
import { shariki as Engine } from "../engine"
import { shariki as Source } from "../source/source"
import { shariki as LabelInfo } from "../data-interfaces/label-info"
import { shariki as PointData } from "../data-interfaces/point-data"
import { shariki as OptimizationOptions } from "../options/optimization-options"
import { shariki as GeometryUtil } from "../utils/geometry-util"

export namespace shariki {
    export class DotsDirectlyRenderingUtil
        implements RenderingUtil.RenderingUtil {
        protected engine: Engine.Engine;
        protected source: Source.Source
        protected mesh: THREE.Mesh | null = null;
        protected depthTest: boolean
        protected depthWrite: boolean
        protected transparent: boolean
        protected geometry: THREE.SphereGeometry | null = null
        protected labelInfos: LabelInfo.LabelInfo[] = []

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

        getMesh(): THREE.Mesh | null {
            return this.mesh
        }

        public getLabelInfos() {
            return this.labelInfos
        }

        protected initLabelInfos() {
            this.labelInfos = []

            for (let pointData of this.getData()) {
                this.labelInfos.push(this.getLabelInfo(pointData))
            }
        }

        protected getData() {
            return this.source.getData()
        }

        protected getLabelInfo(
            pointData: PointData.PointData
        ): LabelInfo.LabelInfo {
            let label = pointData.label
            let color = pointData.labelColor
            let backgroundColor = pointData.labelBackgroundColor

            return {
                label,
                color,
                backgroundColor,
                position: new THREE.Vector3(
                    pointData.x,
                    pointData.y,
                    pointData.z
                )
            }
        }

        createMesh(
            optimizationOptions: OptimizationOptions.OptimizationOptions,
            renderOrder: number
        ): void {
            if (optimizationOptions.enableInstancing && !this.mesh) {
                this.createMeshWithInstancing()
            } else {
                this.createMeshSimple()
            }

            this.initLabelInfos()
            this.mesh.renderOrder = renderOrder
        }

        // private createMeshSimple(): void {
        //     // Создаем базовую геометрию одной сферы
        //     const baseGeometry = GeometryUtil.GeometryUtil.createSphereBufferGeometry(1, 8, 6);

        //     // Получаем данные всех точек
        //     const pointsData = this.getData();

        //     // Подготавливаем массивы для объединенной геометрии
        //     const positions: number[] = [];
        //     const normals: number[] = [];
        //     const colors: number[] = [];
        //     const uvs: number[] = [];
        //     const indices: number[] = [];

        //     // Получаем информацию о базовой геометрии
        //     const basePositions = baseGeometry.attributes.position.array as Float32Array;
        //     const baseNormals = baseGeometry.attributes.normal.array as Float32Array;
        //     const baseUvs = baseGeometry.attributes.uv.array as Float32Array;
        //     const baseIndices = baseGeometry.index?.array as Uint32Array;

        //     const verticesPerSphere = basePositions.length / 3;
        //     const indicesPerSphere = baseIndices.length;

        //     // Обрабатываем каждую точку
        //     pointsData.forEach((pointData: PointData.PointData, sphereIndex: number) => {
        //         const vertexOffset = sphereIndex * verticesPerSphere;
        //         const color = new THREE.Color(pointData.color);
        //         const scale = pointData.radius;

        //         // Добавляем вершины для текущей сферы
        //         for (let i = 0; i < basePositions.length; i += 3) {
        //             const x = basePositions[i];
        //             const y = basePositions[i + 1];
        //             const z = basePositions[i + 2];

        //             // Позиция с учетом масштаба и смещения
        //             positions.push(
        //                 x * scale + pointData.x,
        //                 y * scale + pointData.y,
        //                 z * scale + pointData.z
        //             );

        //             // Нормали должны быть пересчитаны для масштабированной сферы
        //             // Для сферы нормаль = нормализованный вектор от центра к вершине
        //             const normalX = x * scale;
        //             const normalY = y * scale;
        //             const normalZ = z * scale;
        //             const length = Math.sqrt(normalX * normalX + normalY * normalY + normalZ * normalZ);

        //             if (length > 0) {
        //                 normals.push(
        //                     normalX / length,
        //                     normalY / length,
        //                     normalZ / length
        //                 );
        //             } else {
        //                 normals.push(
        //                     baseNormals[i],
        //                     baseNormals[i + 1],
        //                     baseNormals[i + 2]
        //                 );
        //             }

        //             // Цвета вершин
        //             colors.push(color.r, color.g, color.b);

        //             // UV координаты (копируем как есть)
        //             if (baseUvs.length > 0) {
        //                 const uvIndex = (i / 3) * 2;
        //                 uvs.push(baseUvs[uvIndex], baseUvs[uvIndex + 1]);
        //             }
        //         }

        //         // Добавляем индексы для текущей сферы со сдвигом
        //         for (let i = 0; i < baseIndices.length; i++) {
        //             indices.push(baseIndices[i] + vertexOffset);
        //         }
        //     });

        //     // Создаем объединенную геометрию
        //     const mergedGeometry = new THREE.BufferGeometry();

        //     mergedGeometry.setAttribute(
        //         'position',
        //         new THREE.BufferAttribute(new Float32Array(positions), 3)
        //     );

        //     mergedGeometry.setAttribute(
        //         'normal',
        //         new THREE.BufferAttribute(new Float32Array(normals), 3)
        //     );

        //     mergedGeometry.setAttribute(
        //         'color',
        //         new THREE.BufferAttribute(new Float32Array(colors), 3)
        //     );

        //     if (uvs.length > 0) {
        //         mergedGeometry.setAttribute(
        //             'uv',
        //             new THREE.BufferAttribute(new Float32Array(uvs), 2)
        //         );
        //     }

        //     mergedGeometry.setIndex(indices);

        //     // Пересчитываем нормали на всякий случай
        //     mergedGeometry.computeVertexNormals();

        //     // Создаем материал с vertex colors
        //     // const material = new THREE.MeshPhongMaterial({
        //     //     vertexColors: true,
        //     //     shininess: 30
        //     // });
        //     const material = new THREE.MeshPhongMaterial({
        //         color: 0xff0000, // Яркий красный цвет для теста
        //         vertexColors: false, // Отключаем vertex colors
        //         shininess: 30
        //     });

        //     // Создаем единый меш
        //     const mesh = new THREE.Mesh(mergedGeometry, material);

        //     // Сохраняем ссылки на исходные данные
        //     mesh.userData = {
        //         pointsData: pointsData,
        //         verticesPerSphere: verticesPerSphere,
        //         indicesPerSphere: indicesPerSphere
        //     };

        //     this.mesh = mesh;

        //     const scene = this.engine.getScene();
        //     scene.add(mesh);
        // }

        // private createMeshSimple(): void {
        //     // Создаем базовую геометрию одной сферы
        //     const baseGeometry = GeometryUtil.GeometryUtil.createSphereBufferGeometry(1, 8, 6);

        //     // Получаем данные всех точек
        //     const pointsData = this.getData();

        //     // Подготавливаем массивы для объединенной геометрии
        //     const positions: number[] = [];
        //     const colors: number[] = [];
        //     const indices: number[] = [];

        //     // Получаем информацию о базовой геометрии
        //     const basePositions = baseGeometry.attributes.position.array as Float32Array;
        //     const baseUvs = baseGeometry.attributes.uv.array as Float32Array;
        //     const baseIndices = baseGeometry.index?.array as Uint32Array;

        //     const verticesPerSphere = basePositions.length / 3;
        //     const indicesPerSphere = baseIndices.length;

        //     // Обрабатываем каждую точку
        //     pointsData.forEach((pointData: PointData.PointData, sphereIndex: number) => {
        //         const vertexOffset = sphereIndex * verticesPerSphere;
        //         const color = new THREE.Color(pointData.color);
        //         const scale = pointData.radius;

        //         // Добавляем вершины для текущей сферы
        //         for (let i = 0; i < basePositions.length; i += 3) {
        //             // Позиция с учетом масштаба и смещения
        //             positions.push(
        //                 basePositions[i] * scale + pointData.x,
        //                 basePositions[i + 1] * scale + pointData.y,
        //                 basePositions[i + 2] * scale + pointData.z
        //             );

        //             // Цвета вершин
        //             colors.push(color.r, color.g, color.b);
        //         }

        //         // Добавляем индексы для текущей сферы со сдвигом
        //         for (let i = 0; i < baseIndices.length; i++) {
        //             indices.push(baseIndices[i] + vertexOffset);
        //         }
        //     });

        //     // Создаем объединенную геометрию
        //     const mergedGeometry = new THREE.BufferGeometry();

        //     mergedGeometry.setAttribute(
        //         'position',
        //         new THREE.BufferAttribute(new Float32Array(positions), 3)
        //     );

        //     mergedGeometry.setAttribute(
        //         'color',
        //         new THREE.BufferAttribute(new Float32Array(colors), 3)
        //     );

        //     mergedGeometry.setIndex(indices);

        //     // ВАЖНО: Пересчитываем нормали после создания всей геометрии
        //     mergedGeometry.computeVertexNormals();

        //     // Создаем материал БЕЗ vertex colors для теста
        //     const material = new THREE.MeshPhongMaterial({
        //         color: 0xff0000, // Яркий красный
        //         shininess: 30
        //     });

        //     // Создаем единый меш
        //     const mesh = new THREE.Mesh(mergedGeometry, material);

        //     // Добавляем в сцену
        //     const scene = this.engine.getScene();
        //     scene.add(mesh);

        //     this.mesh = mesh;
        // }

        private createMeshSimple(): void {
            // Создаем базовую геометрию одной сферы
            const baseGeometry = GeometryUtil.GeometryUtil.createSphereBufferGeometry(1, 16, 16);

            // Получаем данные всех точек
            const pointsData = this.getData();

            // Подготавливаем массивы для объединенной геометрии
            const positions: number[] = [];
            const colors: number[] = [];
            const indices: number[] = [];

            // Получаем информацию о базовой геометрии
            const basePositions = baseGeometry.attributes.position.array as Float32Array;
            const baseIndices = baseGeometry.index?.array as Uint32Array;

            const verticesPerSphere = basePositions.length / 3;
            const indicesPerSphere = baseIndices.length;

            // Обрабатываем каждую точку
            pointsData.forEach((pointData: PointData.PointData, sphereIndex: number) => {
                const vertexOffset = sphereIndex * verticesPerSphere;
                const color = new THREE.Color(pointData.color);
                const scale = pointData.radius;

                // Добавляем вершины для текущей сферы
                for (let i = 0; i < basePositions.length; i += 3) {
                    positions.push(
                        basePositions[i] * scale + pointData.x,
                        basePositions[i + 1] * scale + pointData.y,
                        basePositions[i + 2] * scale + pointData.z
                    );

                    // Цвета вершин
                    colors.push(color.r, color.g, color.b);
                }

                // Добавляем индексы для текущей сферы со сдвигом
                for (let i = 0; i < baseIndices.length; i++) {
                    indices.push(baseIndices[i] + vertexOffset);
                }
            });

            // Создаем объединенную геометрию
            const mergedGeometry = new THREE.BufferGeometry();

            mergedGeometry.setAttribute(
                'position',
                new THREE.BufferAttribute(new Float32Array(positions), 3)
            );

            mergedGeometry.setAttribute(
                'color',
                new THREE.BufferAttribute(new Float32Array(colors), 3)
            );

            mergedGeometry.setIndex(indices);

            // Используем MeshBasicMaterial вместо PhongMaterial
            const material = new THREE.MeshBasicMaterial({
                vertexColors: true // Включаем vertex colors
            });

            // Создаем единый меш
            const mesh = new THREE.Mesh(mergedGeometry, material);

            // Сохраняем ссылки на исходные данные
            mesh.userData = {
                pointsData: pointsData,
                verticesPerSphere: verticesPerSphere,
                indicesPerSphere: indicesPerSphere
            };

            this.mesh = mesh;

            const scene = this.engine.getScene();
            scene.add(mesh);
        }

        private createMeshWithInstancing(): THREE.Group {
            const group = new THREE.Group();

            if (this.getData().length === 0) {
                return group;
            }

            const baseGeometry = GeometryUtil.GeometryUtil.createSphereBufferGeometry(1, 8, 6);

            // Создаем материал с поддержкой per-instance colors
            const material = new THREE.MeshPhongMaterial({
                shininess: 30
            });

            const instancedMesh = new THREE.InstancedMesh(
                baseGeometry,
                material,
                this.getData().length
            );

            // Создаем атрибут только для цветов
            const instanceColors = new Float32Array(this.source.getData().length * 3);
            const matrix = new THREE.Matrix4();

            this.source.getData().forEach((pointData: PointData.PointData, index: number) => {
                // Устанавливаем позицию и масштаб (радиус) через матрицу
                matrix.makeTranslation(pointData.x, pointData.y, pointData.z);
                matrix.scale(new THREE.Vector3(
                    pointData.radius,
                    pointData.radius,
                    pointData.radius
                ));

                instancedMesh.setMatrixAt(index, matrix);

                // Устанавливаем цвет для инстанса
                const color = new THREE.Color(pointData.color);
                instanceColors[index * 3] = color.r;
                instanceColors[index * 3 + 1] = color.g;
                instanceColors[index * 3 + 2] = color.b;

                // Сохраняем userData
                if (!instancedMesh.userData.instances) {
                    instancedMesh.userData.instances = [];
                }
                instancedMesh.userData.instances[index] = {
                    pointIndex: index,
                    originalData: pointData
                };
            });

            // Устанавливаем атрибут цветов
            //@ts-ignore
            instancedMesh.setAttribute(
                'instanceColor',
                new THREE.InstancedBufferAttribute(instanceColors, 3)
            );

            // Обновляем шейдер материала для использования instance colors
            material.onBeforeCompile = (shader) => {
                shader.vertexShader = shader.vertexShader.replace(
                    '#include <common>',
                    `
            #include <common>
            attribute vec3 instanceColor;
            varying vec3 vInstanceColor;
            `
                );

                shader.vertexShader = shader.vertexShader.replace(
                    '#include <begin_vertex>',
                    `
            #include <begin_vertex>
            vInstanceColor = instanceColor;
            `
                );

                shader.fragmentShader = shader.fragmentShader.replace(
                    '#include <common>',
                    `
            #include <common>
            varying vec3 vInstanceColor;
            `
                );

                shader.fragmentShader = shader.fragmentShader.replace(
                    'vec4 diffuseColor = vec4( diffuse, opacity );',
                    'vec4 diffuseColor = vec4( diffuse * vInstanceColor, opacity );'
                );
            };

            instancedMesh.instanceMatrix.needsUpdate = true;
            group.add(instancedMesh);
            return group;
        }

        loadTexture(): void {

        }

        public dispose(): void {
            if (this.mesh) {
                this.engine.getScene().remove(this.mesh);
                this.cleanupMesh(this.mesh);
                this.mesh = null;
                this.geometry = null
                this.labelInfos = []
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

        needsAsynchronousTextureLoad(): boolean {
            return false
        }

        textureIsLoaded(): boolean {
            throw new Error("Not implemented")
        }

        setOnTextureIsLoaded(
            //@ts-ignore
            action: () => void
        ): void {

        }
    }
}