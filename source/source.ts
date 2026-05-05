import { shariki as SharIKIGeometryType } from "./geometry-type"
import { shariki as SharIKIRenderingType } from "./rendering-type"
import { shariki as RenderingUtil } from "../rendering-utils/rendering-util"

export namespace shariki {
    export class Source {
        private geometryType: SharIKIGeometryType.GeometryType

        private renderingType: SharIKIRenderingType.RenderingType

        private sphereBound: boolean

        private data: any = null

        private name: string

        private renderingUtil: RenderingUtil.RenderingUtil

        public constructor(
            geometryType: SharIKIGeometryType.GeometryType,
            renderingType: SharIKIRenderingType.RenderingType,
            sphereBound: boolean,
            name: string
        ) {
            this.geometryType = geometryType
            this.renderingType = renderingType
            this.sphereBound = sphereBound
            this.name = name
        }

        public setRenderingUtil(
            renderingUtil: RenderingUtil.RenderingUtil
        ) {
            this.renderingUtil = renderingUtil
        }

        public getGeometryType() {
            return this.geometryType
        }

        public getRenderingType() {
            return this.renderingType
        }

        public setData(
            data: any
        ) {
            this.data = data

            if (this.renderingUtil) {
                this.renderingUtil.dispose()
            }
        }

        public getData() {
            return this.data
        }

        public getName() {
            return this.name
        }

        public isSphereBound() {
            return this.sphereBound
        }

        public dispose() {
            this.renderingUtil.dispose()
        }
    }
}