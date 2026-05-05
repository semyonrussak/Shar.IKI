export namespace shariki {
    export class PerspectiveCameraOptions {
        private fovy: number

        private aspect: number

        private near: number

        private far: number

        public constructor(
            fovy: number,
            aspect: number,
            near: number,
            far: number
        ) {
            this.fovy = fovy
            this.aspect = aspect
            this.near = near
            this.far = far
        }

        public getFovy() {
            return this.fovy
        }

        public getAspect() {
            return this.aspect
        }

        public getNear() {
            return this.near
        }

        public getFar() {
            return this.far
        }
    }
}