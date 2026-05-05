import * as THREE from 'three';

import { shariki as RenderingUtil } from "./rendering-util"
import { shariki as Engine } from "../engine"
import { shariki as Source } from "../source/source"
import { shariki as LabelInfo } from "../data-interfaces/label-info"
import { shariki as TriangleData } from "../data-interfaces/triangle-data"
import { shariki as OptimizationOptions } from "../options/optimization-options"

export namespace shariki {
    export class TriagnglesDirectlyRenderingUtil
        implements RenderingUtil.RenderingUtil {
        protected engine: Engine.Engine;
        protected source: Source.Source
        protected mesh: THREE.Mesh | null = null;
        protected depthTest: boolean
        protected depthWrite: boolean
        protected transparent: boolean
        protected geometry: THREE.SphereGeometry | null = null
        private counter: number = 0

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
            renderOrder: number
        ): void {
            if (this.mesh != null) {
                return
            }

            const trianglesData = this.getData();
            console.log(trianglesData)
            if (!trianglesData || trianglesData.length === 0) {
                this.mesh = null;
                return;
            }

            // Для indexed geometry - каждая вершина уникальна
            const verticesPerTriangle = 3;
            const totalVertices = trianglesData.length * verticesPerTriangle;

            const positions = new Float32Array(totalVertices * 3); // 3 компонента (x, y, z)
            const colors = new Float32Array(totalVertices * 4);    // ← 4 КОМПОНЕНТА! (r, g, b, a)
            const indices = new Uint32Array(totalVertices); // Каждая вершина имеет свой индекс

            let vertexIndex = 0;
            let colorIndex = 0;
            let indexIndex = 0;

            const hexToRGBA = (color: string): { r: number, g: number, b: number, a: number } => {
                // Убираем символ # если есть
                let hex = color.replace('#', '');

                // Проверяем длину hex-строки
                if (hex.length === 3) {
                    // #RGB -> #RRGGBB
                    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
                }

                if (hex.length === 6) {
                    // #RRGGBB -> #RRGGBBFF (добавляем альфа-канал = 1)
                    hex = hex + 'FF';
                }

                if (hex.length === 8) {
                    // #RRGGBBAA - правильный формат
                    const r = parseInt(hex.substring(0, 2), 16);
                    const g = parseInt(hex.substring(2, 4), 16);
                    const b = parseInt(hex.substring(4, 6), 16);
                    const a = parseInt(hex.substring(6, 8), 16) / 255;

                    return { r, g, b, a };
                    // return `rgba(${r}, ${g}, ${b}, ${a})`
                }

                // Если формат неправильный, возвращаем черный непрозрачный цвет
                console.warn(`Invalid hex color format: ${color}`);
                return { r: 0, g: 0, b: 0, a: 1 }
                // return 'rgba(0, 0, 0, 1)'
            };

            const addVertex = (position: THREE.Vector3, color: {
                r: number,
                g: number,
                b: number,
                a: number
            }): void => {
                // color.r = 0
                // color.g = 0
                // color.b = 0
                ++this.counter
                positions[vertexIndex++] = position.x;
                positions[vertexIndex++] = position.y;
                positions[vertexIndex++] = position.z;

                colors[colorIndex++] = color.r / 255;
                colors[colorIndex++] = color.g / 255;
                colors[colorIndex++] = color.b / 255;
                colors[colorIndex++] = color.a;

                // Индексы идут последовательно: 0, 1, 2, 3, 4, 5...
                indices[indexIndex++] = indexIndex;
            }

            trianglesData.forEach((triangleData: TriangleData.TriangleData,
                //@ts-ignore
                triangleIndex: number) => {
                const type = triangleData.type
                const firstVertex = triangleData.firstVertexData;
                const secondVertex = triangleData.secondVertexData;
                const thirdVertex = triangleData.thirdVertexData;
                let gradientColor = triangleData.gradientColor;

                // // Векторы позиций
                // let p1 = new THREE.Vector3(firstVertex.x, firstVertex.y, firstVertex.z);
                // let p2 = new THREE.Vector3(secondVertex.x, secondVertex.y, secondVertex.z);
                // let p3 = new THREE.Vector3(thirdVertex.x, thirdVertex.y, thirdVertex.z);

                let [p1, p2, p3, color1, color2, color3] = this.orderPointsForCameraView(
                    new THREE.Vector3(firstVertex.x, firstVertex.y, firstVertex.z),
                    new THREE.Vector3(secondVertex.x, secondVertex.y, secondVertex.z),
                    new THREE.Vector3(thirdVertex.x, thirdVertex.y, thirdVertex.z),
                    firstVertex.color,
                    secondVertex.color,
                    thirdVertex.color,
                    type
                )

                if (!gradientColor) {
                    color2 = color1
                    color3 = color1
                }

                // let secondColor = secondVertex.color
                // let thirdColor = thirdVertex.color

                // if (type == 'B') {
                //     return
                //     let buf = p2
                //     p2 = p3
                //     p3 = buf

                //     let buf2 = secondColor
                //     thirdColor = secondColor
                //     secondColor = buf2
                // }

                // Цвета
                // console.log(hexToRGBA(firstVertex.color))
                // console.log(new THREE.Color(hexToRGBA(firstVertex.color)))
                // let color1 = hexToRGBA(firstVertex.color)
                // const color1 = { r: 0, g: 0, b: 0, a: 0.8 }
                // const color2 = gradientColor ? hexToRGBA(secondColor) : hexToRGBA(firstVertex.color);
                // const color3 = gradientColor ? hexToRGBA(thirdColor) : hexToRGBA(firstVertex.color);

                // Добавляем вершины треугольника
                // color1 = { r: 1, g: 1, b: 1, a: 0.8 }
                addVertex(<THREE.Vector3>p1, hexToRGBA(<string>color1));
                addVertex(<THREE.Vector3>p2, hexToRGBA(<string>color2));
                addVertex(<THREE.Vector3>p3, hexToRGBA(<string>color3));
            });

            const geometry = new THREE.BufferGeometry();
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geometry.setAttribute('color', new THREE.BufferAttribute(colors, 4));
            geometry.setIndex(new THREE.BufferAttribute(indices, 1));

            geometry.computeVertexNormals();
            geometry.computeBoundingSphere();

            const material = new THREE.MeshBasicMaterial({
                vertexColors: true,
                side: THREE.DoubleSide,
                depthTest: this.depthTest,
                depthWrite: this.depthWrite,
                transparent: this.transparent
            });

            // geometry.attributes.color.array[12] = 0
            // geometry.attributes.color.array[13] = 0
            // geometry.attributes.color.array[14] = 0

            // // ОБЯЗАТЕЛЬНО вызвать needsUpdate!
            // geometry.attributes.color.needsUpdate = true;

            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.renderOrder = renderOrder;

            this.engine.getScene().add(this.mesh)
            console.log(`rendered triangles: ${this.counter / 3}`)
            console.log('geometry:')
            console.log(geometry)

            // Для вершины с индексами позиций 3-5
            console.log('Color for vertex at indices 3-5:',
                geometry.attributes.color.array[4],
                geometry.attributes.color.array[5],
                geometry.attributes.color.array[6],
                geometry.attributes.color.array[7]
            );

            // Для вершины с индексами позиций 9-11  
            console.log('Color for vertex at indices 9-11:',
                geometry.attributes.color.array[12],
                geometry.attributes.color.array[13],
                geometry.attributes.color.array[14],
                geometry.attributes.color.array[15]
            );
        }

        protected getData() {
            return this.source.getData()
        }

        // Альтернативная версия с использованием камеры напрямую:
        private orderPointsForCameraView(
            p1: THREE.Vector3,
            p2: THREE.Vector3,
            p3: THREE.Vector3,
            color1: string,
            color2: string,
            color3: string,
            type: string
        ) {
            const v1 = new THREE.Vector3().subVectors(p2, p1);
            const v2 = new THREE.Vector3().subVectors(p3, p1);
            const radialVector = new THREE.Vector3(
                (p1.x + p2.x + p3.x) / 3,
                (p1.y + p2.y + p3.y) / 3,
                (p1.z + p2.z + p3.z) / 3,
            )
            const normal = new THREE.Vector3().crossVectors(v1, v2);

            const dot = normal.dot(radialVector);

            // Если нормаль смотрит в сторону камеры - это frontside
            // Для frontside dot должен быть > 0 (нормаль направлена к камере)
            // if (dot < 0 && type == 'B') {
            //     return [p1, p2, p3, color1, color2, color3]; // Уже frontside
            // } else {
            //     return [p1, p3, p2, color1, color3, color2]; // Нужно инвертировать
            // }

            return [p1, p2, p3, color1, color2, color3]
        }
    }
}