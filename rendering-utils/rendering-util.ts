import * as THREE from 'three';

import { shariki as SharIKIOptimizationOptions } from "../options/optimization-options"
import { shariki as LabelInfo } from "../data-interfaces/label-info"

export namespace shariki {
    export interface RenderingUtil {
        getMesh(): THREE.Mesh | null
        getLabelInfos(): LabelInfo.LabelInfo[] | null
        createMesh(
            optimizationOptions: SharIKIOptimizationOptions.OptimizationOptions,
            renderOrder: number
        ): void
        loadTexture(): void
        dispose(): void
        needsAsynchronousTextureLoad(): boolean
        textureIsLoaded(): boolean
        setOnTextureIsLoaded(
            action: () => void
        ): void
    }
}