import { shariki as SharIKIRenderingUtil } from "./rendering-util"
import { shariki as SharIKISphereTextureRenderingUtil } from "./sphere-texture-rendering-util"

export namespace shariki {
    export class SphereImageTextureRenderingUtil
        extends SharIKISphereTextureRenderingUtil.SphereTextureRenderingUtil
        implements SharIKIRenderingUtil.RenderingUtil {
        public needsAsynchronousTextureLoad(): boolean {
            return true
        }

        public initLabelInfos(): void {
        }

        protected getTexture() {
            return this.textureUtil.getTexture()
        }
    }
}