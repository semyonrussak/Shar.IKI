import { shariki as DotsDirectlyRenderingUtil } from "./dots-directly-rendering-util"

import { shariki as Engine } from "../engine"
import { shariki as Source } from "../source/source"
import { shariki as GeoCartesianConverter } from "../utils/geo-cartesian-converter"
import { shariki as PointData } from "../data-interfaces/point-data"
import { shariki as PointOnSphereData } from "../data-interfaces/point-on-sphere-data"

export namespace shariki {
    export class DotsDirectlySphereBoundRenderingUtil
        extends DotsDirectlyRenderingUtil.DotsDirectlyRenderingUtil {
        private radius: number

        public constructor(
            engine: Engine.Engine,
            source: Source.Source,
            radius: number,
            depthTest: boolean,
            depthWrite: boolean,
            transparent: boolean
        ) {
            super(
                engine,
                source,
                depthTest,
                depthWrite,
                transparent
            )

            this.radius = radius
        }

        protected override getData() {
            let data = this.source.getData();

            if (!data || !Array.isArray(data)) {
                return [];
            }

            // Преобразуем каждый объект PointOnSphereData в PointData
            const transformedData: PointData.PointData[] = data.map((point: PointOnSphereData.PointOnSphereData) => {
                // Преобразуем координаты из широты/долготы в декартовы
                const [x, y, z] = GeoCartesianConverter.GeoCartesianConverter.geoToCartesian(
                    point.lat,
                    point.lon,
                    0, // altitude = 0, так как радиус уже указан в point.radius
                    this.radius
                );

                // Создаем объект PointData
                const pointData: PointData.PointData = {
                    x: x,
                    y: y,
                    z: z,
                    radius: point.radius,
                    color: point.color,
                    label: point.label,
                    labelColor: point.labelColor,
                    labelBackgroundColor: point.labelBackgroundColor
                };

                return pointData;
            });

            return transformedData;
        }
    }
}