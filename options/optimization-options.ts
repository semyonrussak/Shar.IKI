export namespace shariki {
    export class OptimizationOptions {
        public discardClosedPixels: boolean

        public enableInstancing: boolean

        public enableLOD: boolean

        public drawAuroralOvalAsTexture: boolean

        public useWorkers: boolean

        public useMipmapping: boolean

        public useFrustumCulling: boolean

        public constructor(
            discardClosedPixels: boolean,
            applyInstancing: boolean,
            enableLOD: boolean,
            drawAuroralOvalAsTexture: boolean,
            useWorkers: boolean,
            useMipmapping: boolean,
            useFrustumCulling: boolean
        ) {
            this.discardClosedPixels = discardClosedPixels
            this.enableInstancing = applyInstancing
            this.enableLOD = enableLOD
            this.drawAuroralOvalAsTexture = drawAuroralOvalAsTexture
            this.useWorkers = useWorkers
            this.useMipmapping = useMipmapping
            this.useFrustumCulling = useFrustumCulling
        }
    }
}