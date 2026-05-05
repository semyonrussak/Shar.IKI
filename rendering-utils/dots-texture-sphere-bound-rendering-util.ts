import * as THREE from 'three';

import { shariki as SharIKIRenderingUtil } from "./rendering-util"
import { shariki as SharIKISphereTextureRenderingUtil } from "./sphere-texture-rendering-util"
import { shariki as PointData } from "../data-interfaces/point-on-sphere-data"
import { shariki as LabelInfo } from "../data-interfaces/label-info"
import { shariki as GeoCartesianConverter } from "../utils/geo-cartesian-converter"

export namespace shariki {
    export class DotsTextureSphereBoundRenderingUtil
        extends SharIKISphereTextureRenderingUtil.SphereTextureRenderingUtil
        implements SharIKIRenderingUtil.RenderingUtil {
        public needsAsynchronousTextureLoad(): boolean {
            return false
        }

        protected getTexture() {
            return this.drawTexture(this.source.getData())
        }

        private drawTexture(
            data: PointData.PointOnSphereData[]
        ) {
            let [canvas, ctx] = this.createCanvas(
                DotsTextureSphereBoundRenderingUtil.CANVAS_SIZE,
                DotsTextureSphereBoundRenderingUtil.CANVAS_SIZE,
                DotsTextureSphereBoundRenderingUtil.CANVAS_SIZE + 'px',
                DotsTextureSphereBoundRenderingUtil.CANVAS_SIZE + 'px'
            )

            // Очищаем canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Преобразуем географические координаты в координаты canvas
            data.forEach(point => {
                this.drawPoint(ctx, point, canvas.width, canvas.height);

                // Проверяем, пересекает ли точка 180-й меридиан
                if (this.crosses180thMeridian(point)) {
                    // Создаем дубликат точки со смещенной долготой
                    const duplicatedPoint = this.duplicatePointFor180thMeridian(point);
                    this.drawPoint(ctx, duplicatedPoint, canvas.width, canvas.height);
                }
            });

            let result = new THREE.CanvasTexture(canvas)
            this.removeCanvas(canvas)

            return result
        }

        /**
         * Рисует точку на canvas
         */
        private drawPoint(
            ctx: CanvasRenderingContext2D,
            point: PointData.PointOnSphereData,
            canvasWidth: number,
            canvasHeight: number
        ): void {
            // Преобразуем географические координаты в координаты canvas
            const x = ((point.lon + 180) % 360) / 360 * canvasWidth;
            const y = (90 - point.lat) / 180 * canvasHeight;

            // Преобразуем радиус в пиксели (предполагаем, что радиус в градусах)
            const radiusInPixels = (point.radius / 180) * canvasHeight;

            ctx.beginPath();
            ctx.arc(x, y, radiusInPixels, 0, 2 * Math.PI);
            ctx.fillStyle = point.color;
            ctx.fill();
        }

        /**
         * Проверяет, пересекает ли точка 180-й меридиан
         */
        private crosses180thMeridian(point: PointData.PointOnSphereData): boolean {
            // Точка пересекает 180-й меридиан, если ее радиус пересекает границу ±180°
            const easternEdge = point.lon + point.radius;
            const westernEdge = point.lon - point.radius;

            return easternEdge > 180 || westernEdge < -180;
        }

        /**
         * Создает дубликат точки со смещенной долготой для корректного отображения
         * при пересечении 180-го меридиана
         */
        private duplicatePointFor180thMeridian(point: PointData.PointOnSphereData): PointData.PointOnSphereData {
            let duplicatedLon: number;

            // Определяем направление смещения в зависимости от положения центра точки
            if (point.lon >= 0) {
                // Точка находится в восточном полушарии - смещаем в западное
                duplicatedLon = point.lon - 360;
            } else {
                // Точка находится в западном полушарии - смещаем в восточное
                duplicatedLon = point.lon + 360;
            }

            return {
                ...point,
                lon: duplicatedLon
            };
        }

        protected initLabelInfos() {
            this.labelInfos = []

            for (let pointData of this.source.getData()) {
                this.labelInfos.push(this.getLabelInfo(pointData))
            }
        }

        protected getLabelInfo(
            pointData: PointData.PointOnSphereData
        ): LabelInfo.LabelInfo {
            let label = pointData.label
            let color = pointData.labelColor
            let backgroundColor = pointData.labelBackgroundColor
            let position = GeoCartesianConverter.GeoCartesianConverter.geoToCartesian(
                pointData.lat,
                pointData.lon,
                this.radius,
                0
            )
            let positionVector3: THREE.Vector3
            positionVector3 = new THREE.Vector3(
                position[0],
                position[1],
                position[2]
            )

            return {
                label,
                color,
                backgroundColor,
                position: positionVector3
            }
        }
    }
}