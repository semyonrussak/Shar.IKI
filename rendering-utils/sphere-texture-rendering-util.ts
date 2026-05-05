import * as THREE from 'three';

import { shariki as RenderingUtil } from "./rendering-util"
import { shariki as Engine } from "../engine"
import { shariki as TextureUtil } from "../utils/texture-util"
import { shariki as OptimizationOptions } from "../options/optimization-options"
import { shariki as Geometry } from "../utils/geometry-util"
import { shariki as Source } from "../source/source"
import { shariki as LabelInfo } from "../data-interfaces/label-info"

export namespace shariki {
    export abstract class SphereTextureRenderingUtil implements RenderingUtil.RenderingUtil {
        protected static readonly BASE_SPHERE_N_LATS = 32

        protected static readonly ADDITIONAL_SPHERE_N_LATS = 32

        protected static readonly BASE_SPHERE_NLONS = 32

        protected static readonly ADDITIONAL_SPHERE_N_LONS = 64

        protected static readonly SECTOR_COUNT = 100

        protected static readonly CANVAS_SIZE = 4096

        protected radius: number
        protected engine: Engine.Engine;
        protected source: Source.Source
        protected textureUtil: TextureUtil.TextureUtil;
        protected mesh: THREE.Mesh | null = null;
        protected depthTest: boolean
        protected depthWrite: boolean
        protected transparent: boolean
        protected geometry: THREE.SphereGeometry | null = null
        protected labelInfos: LabelInfo.LabelInfo[] = []

        public constructor(
            engine: Engine.Engine,
            source: Source.Source,
            radius: number,
            // texturePath: string,
            depthTest: boolean,
            depthWrite: boolean,
            transparent: boolean
        ) {
            this.engine = engine;
            this.source = source
            this.textureUtil = new TextureUtil.TextureUtil(this.source.getData());
            this.radius = radius
            this.depthTest = depthTest
            this.depthWrite = depthWrite
            this.transparent = transparent
        }

        public setTexture(
            texture: THREE.Texture
        ) {
            this.textureUtil.setTexture(texture)
        }

        public loadTexture(): void {
            this.textureUtil.loadTexture()
        }

        public setGeometry(geometry: any): void {
            this.geometry = geometry
        }

        public abstract needsAsynchronousTextureLoad(): boolean

        public textureIsLoaded() {
            return this.textureUtil.getTexture() != null
        }

        setOnTextureIsLoaded(
            action: () => void
        ) {
            this.textureUtil.onTextureLoaded = action
        }

        public getMesh() {
            return this.mesh
        }

        public getLabelInfos() {
            return this.labelInfos
        }

        public getTextureUtil() {
            return this.textureUtil;
        }

        public setMeshToNull() {
            this.mesh = null
        }

        protected abstract initLabelInfos(): void

        public createMesh(
            optimizationOptions: OptimizationOptions.OptimizationOptions,
            renderOrder: number
        ): void {
            if (optimizationOptions.enableInstancing && !this.mesh) {
                this.createOptimizedEarthMeshForInstancing(optimizationOptions)
            } else if (!this.mesh) {
                this.createMeshSimple(optimizationOptions);
            }

            this.initLabelInfos()
            this.mesh.renderOrder = renderOrder
        }

        public createMeshSimple(
            optimizationOptions: OptimizationOptions.OptimizationOptions
        ): void {
            // if (!this.textureUtil.getTexture()) {
            //     throw new Error('Texture not loaded. Call loadTexture() first.');
            // }

            const scene = this.engine.getScene();

            if (this.mesh) {
                scene.remove(this.mesh);
                this.cleanupMesh(this.mesh);
            }

            // Вершинный шейдер (просто передаёт координаты и нормали)
            const vertexShader = `
        varying vec2 vUv;
        varying vec3 vNormal;
        
        void main() {
            vUv = uv;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
    `;

            // Фрагментный шейдер (рисует текстуру)
            const fragmentShader = `
        uniform sampler2D map;
        varying vec2 vUv;

        void main() {
            gl_FragColor = texture2D(map, vUv);
        }
    `;

            const material = new THREE.ShaderMaterial({
                transparent: this.transparent,
                alphaTest: 0.1,
                depthTest: this.depthTest,
                depthWrite: this.depthWrite,
                uniforms: {
                    map: {
                        // value: this.textureUtil.getTexture()
                        value: this.getTexture()
                    }
                },
                vertexShader: vertexShader,
                fragmentShader: fragmentShader,
                side: optimizationOptions.discardClosedPixels ? THREE.FrontSide : THREE.DoubleSide
            });

            let geometry: THREE.BufferGeometry

            if (this.geometry) {
                geometry = this.geometry
            } else {
                geometry = Geometry.GeometryUtil.createSphereBufferGeometry(
                    this.radius,
                    this.getSphereNLats(
                        optimizationOptions
                    ),
                    this.getSphereNLons(
                        optimizationOptions
                    )
                )
            }

            this.mesh = new THREE.Mesh(geometry, material);
            this.mesh.frustumCulled = optimizationOptions.useFrustumCulling

            scene.add(this.mesh);
        }

        public createOptimizedEarthMeshForInstancing(
            optimizationOptions: OptimizationOptions.OptimizationOptions
        ): void {
            // Define the geometry and material for the instances
            // const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);

            if (this.mesh) {
                this.engine.getScene().remove(this.mesh);
                this.cleanupMesh(this.mesh);
            }

            let sectorGeometry: THREE.SphereGeometry

            if (this.geometry) {
                sectorGeometry = this.geometry
            } else {
                sectorGeometry = new THREE.SphereGeometry(
                    this.radius,
                    this.getSphereNLons(optimizationOptions) / SphereTextureRenderingUtil.SECTOR_COUNT,  // widthSegments (по долготе)
                    this.getSphereNLats(optimizationOptions),  // heightSegments (по широте)
                    0,  // phiStart (начальный азимутальный угол)
                    2 * Math.PI / SphereTextureRenderingUtil.SECTOR_COUNT,  // phiLength (ширина сектора)
                    0,  // thetaStart (начальный полярный угол)
                    Math.PI  // thetaLength (охват по широте)
                );
                sectorGeometry.rotateY(Math.PI);
            }

            // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

            let material = new THREE.ShaderMaterial({
                transparent: this.transparent,
                alphaTest: 0.1,
                uniforms: {
                    earthTexture: {
                        value: this.textureUtil.getTexture()
                    },
                    sectorCount: { value: SphereTextureRenderingUtil.SECTOR_COUNT }
                },
                vertexShader: `
        uniform float sectorCount;
varying vec2 vUv;
varying vec3 vNormal;
varying float vIsSpecialAngle;

void main() {
    // 1. Получаем базовые сферические координаты
    vec3 pos = position;
    float radius = length(pos);

    // 2. Вычисляем угол сектора из instanceMatrix
    mat4 im = instanceMatrix;
    float instanceAngle = atan(im[0][2], im[0][0]); // Угол поворота инстанса в радианах

    // vIsSpecialAngle = abs(instanceAngle + 3.14159265359) < 0.01 ? 1.0 : 0.0; //3.14159265359
    // vIsSpecialAngle = instanceAngle > 2.0 * 3.14159265359 / 4.0 * 3.0 ? 1.0 : 0.0;

    // 3. Создаем матрицу поворота для текстуры
    mat2 uvRotation = mat2(
        cos(instanceAngle), -sin(instanceAngle),
        sin(instanceAngle),  cos(instanceAngle)
    );

    // 4. Преобразуем UV с учетом поворота
    vec2 sphereUV = vec2(
        (atan(pos.z, pos.x) + 3.14159265359) / (2.0 * 3.14159265359), // U [0..1]
        1.0 - (acos(pos.y / radius) / 3.14159265359)                           // V [0..1]
    );

    // 5. Применяем поворот + сдвиг на 0.5 через матрицу
    // vUv = uvRotation * (sphereUV - vec2(0.5)) + vec2(0.5);
    // vUv = vec2(sphereUV.x + instanceAngle / 2.0 / 3.14159265359, sphereUV.y);
    vUv = vec2(sphereUV.x + instanceAngle / 2.0 / 3.14159265359, sphereUV.y);

    // if (vUv.x > 1.0) {
    //     vUv.x = fract(vUv.x);
    // }

    // if (vUv.x > 1.0) {
    //     vUv.x -= 1.0;
    // }

    // if (vUv.x < 0.0) {
    //     vUv.x += 1.0;
    // }

    // 6. Стандартные преобразования вершины
    vec4 worldPosition = instanceMatrix * modelMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(transpose(inverse(instanceMatrix * modelMatrix))) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
    `,
                fragmentShader: `
        uniform sampler2D earthTexture;
        varying vec2 vUv;
        varying float vIsSpecialAngle;
        
        void main() {
            float x;

            // if (vIsSpecialAngle == 1.0) {
            //     x = vUv.x + 1.0;
            // } else {
            //     x = vUv.x;
            // }

            x = vUv.x;

            float corrected_x;
            corrected_x = 1.0 - x;

            // if (corrected_x < 0.0 || corrected_x > 1.0) {
            //     discard;
            // }

            // if (corrected_x > 1.0) {
            //     corrected_x -= 1.0;
            // }

            // if (corrected_x < 0.0) {
            //     corrected_x += 1.0;
            // }

            // Плавная интерполяция на границах
            // vec2 finalUV = vec2(1.0 - x, vUv.y);
            vec2 finalUV = vec2(x, vUv.y);
            
            gl_FragColor = texture2D(earthTexture, finalUV);
        }
    `,
                side: optimizationOptions.discardClosedPixels ? THREE.FrontSide : THREE.DoubleSide
            });

            const instancedMesh = new THREE.InstancedMesh(sectorGeometry, material, SphereTextureRenderingUtil.SECTOR_COUNT);
            this.engine.getScene().add(instancedMesh);

            const dummy = new THREE.Object3D();

            for (let i = 0; i < SphereTextureRenderingUtil.SECTOR_COUNT; i++) { // i < SharIKISphereRenderingUtil.SECTOR_COUNT;
                const angle = (i / SphereTextureRenderingUtil.SECTOR_COUNT) * Math.PI * 2;
                dummy.rotation.set(0, angle, 0);
                dummy.updateMatrix();
                instancedMesh.setMatrixAt(i, dummy.matrix);

                // // Создаем матрицу только с поворотом
                // const matrix = new THREE.Matrix4();
                // matrix.makeRotationY(angle);

                // instancedMesh.setMatrixAt(i, matrix);
            }

            instancedMesh.instanceMatrix.needsUpdate = true

            // Mark instance matrices as needing update after all transformations are set
            instancedMesh.instanceMatrix.needsUpdate = true;
            this.mesh = instancedMesh
        }

        protected getSphereNLats(
            optimizationOptions: OptimizationOptions.OptimizationOptions
        ) {
            if (optimizationOptions.enableLOD) {
                const segmentLength = Engine.Engine.MAX_EYE_LENGTH - Engine.Engine.MIN_EYE_LENGTH
                let ratio
                    = 1
                    - (this.engine.getEye().length()
                        - Engine.Engine.MIN_EYE_LENGTH)
                    / segmentLength

                let result = Math.ceil(
                    SphereTextureRenderingUtil.BASE_SPHERE_N_LATS
                    + ratio * SphereTextureRenderingUtil.ADDITIONAL_SPHERE_N_LATS)

                return result
            } else {
                return SphereTextureRenderingUtil.BASE_SPHERE_N_LATS
                    + SphereTextureRenderingUtil.ADDITIONAL_SPHERE_N_LATS
            }
        }

        protected getSphereNLons(
            optimizationOptions: OptimizationOptions.OptimizationOptions
        ) {
            if (optimizationOptions.enableLOD) {
                const segmentLength = Engine.Engine.MAX_EYE_LENGTH - Engine.Engine.MIN_EYE_LENGTH
                let ratio
                    = 1
                    - (this.engine.getEye().length()
                        - Engine.Engine.MIN_EYE_LENGTH)
                    / segmentLength

                return Math.ceil(
                    SphereTextureRenderingUtil.BASE_SPHERE_NLONS
                    + ratio * SphereTextureRenderingUtil.ADDITIONAL_SPHERE_N_LONS)
            } else {
                return SphereTextureRenderingUtil.BASE_SPHERE_NLONS
                    + SphereTextureRenderingUtil.ADDITIONAL_SPHERE_N_LONS
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

        public dispose(): void {
            if (this.mesh) {
                this.engine.getScene().remove(this.mesh);
                this.cleanupMesh(this.mesh);
                this.mesh = null;
                this.geometry = null
                this.textureUtil.dispose()
                this.labelInfos = []
            }
        }

        protected abstract getTexture(): THREE.Texture<unknown>

        protected createCanvas(
            width: number,
            height: number,
            styleWidth: string = `${width}px`,
            styleHeight: string = `${height}px`
        ): [HTMLCanvasElement, CanvasRenderingContext2D] {
            // Создаем canvas элемент
            const canvas = document.createElement('canvas');

            // Устанавливаем атрибуты размеров
            canvas.width = width;
            canvas.height = height;

            // Устанавливаем CSS стили для размеров и видимости
            canvas.style.width = styleWidth;
            canvas.style.height = styleHeight;
            // canvas.style.display = 'none'; // Делаем невидимым
            // canvas.style.position = 'absolute'; // Чтобы не влиял на layout
            // canvas.style.visibility = 'hidden';

            // Получаем контекст
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                throw new Error('Не удалось получить контекст canvas');
            }

            // Добавляем canvas в body (или можно указать другой контейнер)
            document.body.appendChild(canvas);

            return [canvas, ctx];
        }

        protected removeCanvas(canvas: HTMLCanvasElement): boolean {
            if (canvas && canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
                return true;
            }
            return false;
        }

        protected lonToX(lon: number) {
            let result = (lon + 180) / 360 * SphereTextureRenderingUtil.CANVAS_SIZE

            return result
        }

        protected latToY(lat: number) {
            let result = SphereTextureRenderingUtil.CANVAS_SIZE
                - (lat + 90) / 180 * SphereTextureRenderingUtil.CANVAS_SIZE

            return result
        }
    }
}