import { shariki as SharIKIEngine } from "./engine"

export namespace shariki {
    export class Controller {
        private engine: SharIKIEngine.Engine

        private onMove: boolean

        private onMoveTwo: boolean

        private previousX: number | null = null

        private previousY: number | null = null

        private tooltipDiv: HTMLDivElement | null = null

        public zoomFlag = false

        // private toDraw = false

        // private optimizationOptionsForMovingPosition: OptimizationOptions

        // private optimizationOptionsForStaticPosition: OptimizationOptions

        // private renderForStaticPositionTimeoutId: number

        private timeoutId: number = null

        private applyAuroralOvalSmoothingMemoryFlag = false

        /**
     @brief Конструктор
     */
        constructor(
            engine: SharIKIEngine.Engine
        ) {
            this.engine = engine
            this.onMove = false
            this.onMoveTwo = false
            this.previousX = null
            this.previousY = null

            // this.optimizationOptionsForMovingPosition
            //     = new OptimizationOptions(true, true)
            // this.optimizationOptionsForStaticPosition
            //     = new OptimizationOptions(true, false)
        }

        /**
         @brief Добавляем обработчики событий мыши
         */
        public addEventListeners() {
            // Отключаем стандартное контекстное меню при правом клике
            this.engine.getCanvas().addEventListener("contextmenu", (event) => {
                event.preventDefault();
            });

            this.engine.getCanvas().addEventListener('mousedown', (e) => {
                if (e.button == 0 || e.button == 2) {
                    this.onMove = true
                    this.onMoveTwo = false
                    this.previousX = e.clientX
                    this.previousY = e.clientY
                } else if (e.button == 2) {
                    // this.onMoveTwo = true
                    // this.onMove = false
                    // this.handleInfoEvent(e)
                    throw new Error('Not implemented')
                }
            })

            this.engine.getCanvas().addEventListener('mouseup', () => {
                this.onMove = false
                this.onMoveTwo = false

                if (this.tooltipDiv) {
                    this.tooltipDiv.remove()
                    this.tooltipDiv = null
                }
            })

            this.engine.getCanvas().addEventListener('mouseleave', () => {
                this.onMove = false
                this.onMoveTwo = false

                if (this.tooltipDiv) {
                    this.tooltipDiv.remove()
                    this.tooltipDiv = null
                }
            })

            this.engine.getCanvas().addEventListener('mousemove', (e) => {
                if (this.onMove) {
                    let deltaX = e.clientX - this.previousX
                    let deltaY = e.clientY - this.previousY

                    // console.log('ok')

                    this.engine.rotateEye(
                        deltaX * SharIKIEngine.Engine.ROTATION_RATIO_HORIZONTAL,
                        deltaY * SharIKIEngine.Engine.ROTATION_RATIO_VERTICAL)
                    // clearTimeout(this.renderForStaticPositionTimeoutId)
                    // this.engine.setOptimizationOptions(
                    //     this.optimizationOptionsForMovingPosition
                    // )
                    // this.engine.render()
                    // console.log('rotateEye')
                    // console.log(`deltaX: ${deltaX}. deltaY: ${deltaY}`)
                    this.engine.adjustCamera()
                    this.engine.render()
                    this.tryApplyDelayedMeshesDisposalAndRerender()
                    // this.toDraw = true
                    // requestAnimationFrame(() => {
                    //     if (this.toDraw) {
                    //         console.log('draw')
                    //         this.engine.render()
                    //         this.toDraw = false
                    //     }
                    // })
                    // this.renderForStaticPositionTimeoutId
                    //     = setTimeout(() => {
                    //         this.engine.setOptimizationOptions(
                    //             this.optimizationOptionsForStaticPosition
                    //         )
                    //         this.engine.render()
                    //     }, 500)

                    this.previousX = e.clientX
                    this.previousY = e.clientY
                } else if (this.onMoveTwo) {
                    if (this.tooltipDiv) {
                        this.tooltipDiv.remove()
                        this.tooltipDiv = null
                    }

                    // this.handleInfoEvent(e)
                    throw new Error('Not implemented')
                }
            })

            this.engine.getCanvas().addEventListener('wheel', (e) => {
                e.preventDefault()
                const delta = e.deltaY;

                if (delta > 0) {
                    this.engine.zoom(1.1)
                    this.tryApplyDelayedMeshesDisposalAndRerender()
                } else if (delta < 0) {
                    this.engine.zoom(1 / 1.1)
                    this.tryApplyDelayedMeshesDisposalAndRerender()
                }
            })

            // setInterval(() => {
            //     if (!this.onMove) {
            //         rotateEyeHorizontal(-rotationRatioHorizontal)
            //         render(false)
            //     }
            // }, 100)

            // setInterval(() => {
            //     let deltaX = 10
            //     let deltaY = 0

            //     let alpha = deltaX * SharIKIEngine.ROTATION_RATIO_HORIZONTAL
            //     let beta = deltaY * SharIKIEngine.ROTATION_RATIO_VERTICAL

            //     this.engine.rotateEye(alpha, beta)

            //     if (this.zoomFlag) {
            //         this.engine.zoom(0.75)
            //     } else {
            //         this.engine.zoom(1 / 0.75)
            //     }

            //     this.zoomFlag = !this.zoomFlag
            // }, 300)
        }

        private tryApplyDelayedMeshesDisposalAndRerender() {
            // clearTimeout(this.timeoutId)
            // this.timeoutId = setTimeout(() => {
            //     if (this.applyAuroralOvalSmoothingMemoryFlag) {
            //         this.applyAuroralOvalSmoothingMemoryFlag = false
            //         this.engine.setApplyAuroralOvalSmoothingFlag(true)
            //     }
            //     this.engine.disposeMeshes()
            //     this.engine.render()
            // }, 500)
        }
    }
}