import * as THREE from 'three';

import { shariki as RenderingUtil } from "./rendering-utils/rendering-util"
import { shariki as PerspectiveCameraOptions } from "./options/perspective-camera-options"
import { shariki as Controller } from "./controller"
import { shariki as OptimizationOptions } from "./options/optimization-options"
import { shariki as Source } from "./source/source"
import { shariki as GeometryType } from "./source/geometry-type"
import { shariki as RenderingType } from "./source/rendering-type"
import { shariki as SphereRenderingUtil } from "./rendering-utils/sphere-image-texture-rendering-util"
import { shariki as DotsTextrueSphereBoundRenderingUtil } from './rendering-utils/dots-texture-sphere-bound-rendering-util';
import { shariki as LabelInfo } from "./data-interfaces/label-info"
import { shariki as DotsDirectlySphereBoundRenderingUtil } from "./rendering-utils/dots-directly-sphere-bound-rendering-util"
import { shariki as DotsDirectlyRenderingUtil } from "./rendering-utils/dots-directly-rendering-util"
import { shariki as TriagnglesDirectlyRenderingUtil } from "./rendering-utils/triangles-directly-rendering-util"

export namespace shariki {
    export class Engine {
        public static readonly ROTATION_RATIO_HORIZONTAL = -2 * Math.PI / 360 * 0.5

        public static readonly ROTATION_RATIO_VERTICAL = 2 * Math.PI / 360 * 0.5

        public static readonly MIN_EYE_LENGTH = 2.5

        public static readonly MAX_EYE_LENGTH = 9

        private static readonly EARTH_RADIUS = 1

        private static readonly CLOUDINESS_ALTITUDE = 0.001

        private static readonly NIGHT_ZONE_ALTITUDE_DELTA = 0.0025

        private static readonly AURORAL_OVAL_ALTITUDE = 0.0164

        public static readonly AURORAL_OVAL_MARGIN_ALTITUDE = 0.02

        private static readonly INITIAL_EYE_X = -0.16203992196498643
        private static readonly INITIAL_EYE_Y = 4.41942793881509
        private static readonly INITIAL_EYE_Z = 2.332895144945466

        private static readonly INITIAL_UP_X = 0
        private static readonly INITIAL_UP_Y = 1
        private static readonly INITIAL_UP_Z = 0

        public static readonly MAGNETIC_LAT_UPPER_BOUND = 89.0
        public static readonly SOLAR_WIND_DATA_UNITS_ALTITUDE = 0.05

        private eye = new THREE.Vector3(
            Engine.INITIAL_EYE_X,
            Engine.INITIAL_EYE_Y,
            Engine.INITIAL_EYE_Z
        )

        private up = new THREE.Vector3(
            Engine.INITIAL_UP_X,
            Engine.INITIAL_UP_Y,
            Engine.INITIAL_UP_Z
        )

        private canvas: HTMLCanvasElement;
        private renderer: THREE.WebGLRenderer;
        private scene: THREE.Scene;
        private camera: THREE.PerspectiveCamera;
        private perspectiveCameraOptions: PerspectiveCameraOptions.PerspectiveCameraOptions
        private renderingUtils: RenderingUtil.RenderingUtil[] = []
        private sources: Source.Source[] = []
        private renderingOrders: number[] = []
        private contoller: Controller.Controller
        public optimizationOptions: OptimizationOptions.OptimizationOptions
        private earthTextureIsLoaded = false
        private cloudinessTextureIsLoaded = false
        private auroralOvalMarginThreshold = 1
        private busyFlag = false
        private beginTimestamp: number
        private endTimestamp: number
        private elapsed: number
        private nLoads: number = -1
        public elapsedArray: number[] = []
        public preReady: () => void
        public onReady: () => void
        private labelDivs: HTMLDivElement[] = []

        public constructor(wrapperDivId: string) {
            this.initCanvas(wrapperDivId);
            this.initPerspectiveCameraOptions()
            this.initThreeJS();
            this.resizeCanvasToDisplaySize();
            this.optimizationOptions = new OptimizationOptions.OptimizationOptions(
                false, false, false, false, false, false, false
            )
            this.contoller = new Controller.Controller(this)
            this.contoller.addEventListeners()
            this.addEarthSource()
        }

        public getSource(name: string) {
            for (let source of this.sources) {
                if (source.getName() == name) return source
            }
            return null
        }

        public addSource(source: Source.Source, renderingParams: any, renderingOrder: number) {
            if (source.getGeometryType() == GeometryType.GeometryType.SPHERE) {
                if (source.getRenderingType() == RenderingType.RenderingType.TEXTURE) {
                    this.renderingUtils.push(new SphereRenderingUtil.SphereImageTextureRenderingUtil(
                        this, source, renderingParams.radius, renderingParams.depthTest,
                        renderingParams.depthWrite, renderingParams.transparent
                    ))
                    source.setRenderingUtil(this.renderingUtils[this.renderingUtils.length - 1])
                    this.sources.push(source)
                    this.renderingOrders.push(renderingOrder)
                } else {
                    throw new Error(`Unknown source rendering type: ${source.getRenderingType()}`)
                }
            } else if (source.getGeometryType() == GeometryType.GeometryType.DOTS) {
                if (source.getRenderingType() == RenderingType.RenderingType.TEXTURE) {
                    this.renderingUtils.push(new DotsTextrueSphereBoundRenderingUtil.DotsTextureSphereBoundRenderingUtil(
                        this, source, renderingParams.radius, renderingParams.depthTest,
                        renderingParams.depthWrite, renderingParams.transparent
                    ))
                    source.setRenderingUtil(this.renderingUtils[this.renderingUtils.length - 1])
                    this.sources.push(source)
                    this.renderingOrders.push(renderingOrder)
                } else if (source.getRenderingType() == RenderingType.RenderingType.DIRECTLY) {
                    if (source.isSphereBound()) {
                        this.renderingUtils.push(new DotsDirectlySphereBoundRenderingUtil.DotsDirectlySphereBoundRenderingUtil(
                            this, source, renderingParams.radius, renderingParams.depthTest,
                            renderingParams.depthWrite, renderingParams.transparent
                        ))
                        source.setRenderingUtil(this.renderingUtils[this.renderingUtils.length - 1])
                        this.sources.push(source)
                        this.renderingOrders.push(renderingOrder)
                    } else {
                        this.renderingUtils.push(new DotsDirectlyRenderingUtil.DotsDirectlyRenderingUtil(
                            this, source, renderingParams.depthTest, renderingParams.depthWrite, renderingParams.transparent
                        ))
                        source.setRenderingUtil(this.renderingUtils[this.renderingUtils.length - 1])
                        this.sources.push(source)
                        this.renderingOrders.push(renderingOrder)
                    }
                } else {
                    throw new Error(`Unknown source rendering type: ${source.getRenderingType()}`)
                }
            } else if (source.getGeometryType() == GeometryType.GeometryType.TRIANGLES) {
                if (source.getRenderingType() == RenderingType.RenderingType.DIRECTLY) {
                    if (!source.isSphereBound()) {
                        this.renderingUtils.push(new TriagnglesDirectlyRenderingUtil.TriagnglesDirectlyRenderingUtil(
                            this, source, renderingParams.depthTest, renderingParams.depthWrite, renderingParams.transparent
                        ))
                        source.setRenderingUtil(this.renderingUtils[this.renderingUtils.length - 1])
                        this.sources.push(source)
                        this.renderingOrders.push(renderingOrder)
                    }
                }
            } else {
                throw new Error(`Unknown source geometry type: ${source.getGeometryType()}`)
            }
        }

        public clearSources() {
            for (let source of this.sources) { source.dispose() }
            this.sources = []
            this.renderingUtils = []
            this.renderingOrders = []
            this.addEarthSource()
        }

        public render(): void {
            this.nLoads = 0
            for (let renderingUtil of this.renderingUtils) {
                if (renderingUtil.needsAsynchronousTextureLoad() && !renderingUtil.textureIsLoaded()) {
                    this.nLoads += 1
                    renderingUtil.setOnTextureIsLoaded(() => {
                        this.nLoads -= 1
                        this.tryRender()
                    })
                    renderingUtil.loadTexture()
                }
            }
            if (this.nLoads == 0) this.tryRender()
        }

        public tryRender(): void {
            if (this.nLoads == 0) this.renderNoWorkers(this.optimizationOptions)
        }

        public renderNoWorkers(optimizationOptions: OptimizationOptions.OptimizationOptions): void {
            this.clear()
            for (let i = 0; i < this.renderingUtils.length; ++i) {
                let renderingUtil = this.renderingUtils[i]
                let renderingOrder = this.renderingOrders[i]
                if (!renderingUtil.getMesh()) {
                    renderingUtil.createMesh(optimizationOptions, renderingOrder)
                }
            }
            this.renderer.render(this.scene, this.camera)
        }

        public showLabels(labelInfos: LabelInfo.LabelInfo[]) {
            for (let labelInfo of labelInfos) this.showLabel(labelInfo)
        }

        public showLabel(labelInfo: LabelInfo.LabelInfo): void {
            const dotProduct = labelInfo.position.dot(this.eye);
            if (dotProduct < 0) return;

            const vector = labelInfo.position.clone();
            vector.project(this.camera);
            const x = (vector.x * 0.5 + 0.5) * this.canvas.clientWidth;
            const y = (-vector.y * 0.5 + 0.5) * this.canvas.clientHeight;

            const labelDiv = document.createElement('div');
            labelDiv.textContent = labelInfo.label;
            labelDiv.style.position = 'absolute';
            labelDiv.style.left = `${x}px`;
            labelDiv.style.top = `${y}px`;
            labelDiv.style.color = labelInfo.color;
            labelDiv.style.backgroundColor = labelInfo.backgroundColor;
            labelDiv.style.padding = '2px 6px';
            labelDiv.style.borderRadius = '3px';
            labelDiv.style.fontSize = '12px';
            labelDiv.style.fontFamily = 'Arial, sans-serif';
            labelDiv.style.whiteSpace = 'nowrap';
            labelDiv.style.pointerEvents = 'none';
            labelDiv.style.zIndex = '1000';
            document.body.appendChild(labelDiv);
            this.labelDivs.push(labelDiv);
        }

        public rotateEye(alpha: number, beta: number) {
            this.rotateHorizontal(alpha);
            this.rotateVertical(beta);
            this.normalizeUpVector();
            this.adjustCamera()
            this.render()
        }

        public zoom(ratio: number) {
            const newEye = this.eye.clone().multiplyScalar(ratio);
            const newLength = newEye.length();
            if (newLength < 2.5) newEye.setLength(2.5);
            else if (newLength > 9) newEye.setLength(9);
            this.eye.copy(newEye);
            this.adjustCamera()
            this.render()
        }

        private addEarthSource() {
            let earthSource = new Source.Source(
                GeometryType.GeometryType.SPHERE,
                RenderingType.RenderingType.TEXTURE,
                true,
                "earthSource"
            )
            earthSource.setData('./img/earth.jpg')
            this.addSource(earthSource, {
                radius: Engine.EARTH_RADIUS,
                depthTest: true,
                depthWrite: true,
                transparent: false
            }, 0)
        }

        private rotateHorizontal(angle: number) {
            const rotationMatrix = new THREE.Matrix4().makeRotationY(angle);
            this.eye = this.applyMatrix(this.eye, rotationMatrix)
            this.up.applyMatrix4(rotationMatrix);
        }

        private applyMatrix(vector: THREE.Vector3, matrix: THREE.Matrix4): THREE.Vector3 {
            const { x, y, z } = vector;
            const e = matrix.elements;
            const newX = e[0] * x + e[4] * y + e[8] * z + e[12];
            const newY = e[1] * x + e[5] * y + e[9] * z + e[13];
            const newZ = e[2] * x + e[6] * y + e[10] * z + e[14];
            const w = e[3] * x + e[7] * y + e[11] * z + e[15];
            if (w !== 1 && w !== 0) return new THREE.Vector3(newX / w, newY / w, newZ / w);
            return new THREE.Vector3(newX, newY, newZ);
        }

        private rotateVertical(angle: number) {
            const eyeNormalized = this.eye.clone().normalize();
            const upNormalized = this.up.clone().normalize();
            const axis = new THREE.Vector3().crossVectors(eyeNormalized, upNormalized).normalize();
            const quaternion = new THREE.Quaternion().setFromAxisAngle(axis, angle);
            this.eye.applyQuaternion(quaternion);
            this.up.applyQuaternion(quaternion).normalize();
        }

        private normalizeUpVector() {
            const eyeDirection = this.eye.clone().normalize();
            const upProjection = this.up.clone().projectOnPlane(eyeDirection).normalize().multiplyScalar(5);
            this.up.copy(upProjection);
            const worldUp = new THREE.Vector3(0, 1, 0);
            if (this.up.angleTo(worldUp) > Math.PI / 2) this.up.negate();
        }

        private initCanvas(wrapperDivId: string) {
            this.canvas = document.createElement('canvas');
            this.canvas.style.display = 'block';
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            const wrapper = document.getElementById(wrapperDivId);
            if (!wrapper) throw new Error(`Wrapper div with id '${wrapperDivId}' not found`);
            wrapper.innerHTML = '';
            wrapper.appendChild(this.canvas);
        }

        private initPerspectiveCameraOptions() {
            this.perspectiveCameraOptions = new PerspectiveCameraOptions.PerspectiveCameraOptions(
                30, this.canvas.width / this.canvas.height, 1, 100
            )
        }

        private initThreeJS() {
            this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'high-performance' });
            this.renderer.setPixelRatio(window.devicePixelRatio);
            this.scene = new THREE.Scene();
            this.camera = new THREE.PerspectiveCamera(
                this.perspectiveCameraOptions.getFovy(),
                this.perspectiveCameraOptions.getAspect(),
                this.perspectiveCameraOptions.getNear(),
                this.perspectiveCameraOptions.getFar()
            );
            this.adjustCamera()
        }

        public adjustCamera() {
            this.setCameraPostion()
            this.setCameraUp()
            this.applyCameraLookAt()
        }

        private setCameraPostion() {
            this.camera.position.set(this.eye.x, this.eye.y, this.eye.z)
        }

        private setCameraUp() {
            this.camera.up.set(this.up.x, this.up.y, this.up.z)
        }

        private applyCameraLookAt() {
            this.camera.lookAt(0, 0, 0)
        }

        private resizeCanvasToDisplaySize() {
            const wrapper = this.canvas.parentElement;
            if (!wrapper) return;
            const width = wrapper.clientWidth;
            const height = wrapper.clientHeight;
            this.renderer.setSize(width, height, false);
            this.camera.aspect = width / height;
            this.camera.updateProjectionMatrix();
        }

        public getScene(): THREE.Scene { return this.scene; }
        public getCamera(): THREE.PerspectiveCamera { return this.camera; }
        public getRenderer(): THREE.WebGLRenderer { return this.renderer; }
        public getCanvas() { return this.canvas }
        public getEye() { return this.eye }
        public getUp() { return this.up }

        public clear() {
            this.renderer.setClearColor(0x000000, 1);
            this.renderer.clear();
            this.clearLabels()
        }

        private clearLabels(): void {
            this.labelDivs.forEach(div => { if (div.parentNode) div.parentNode.removeChild(div); });
            this.labelDivs = [];
        }
    }
}

// Эта строка запускает движок – обязательно оставьте её
new shariki.Engine('app');