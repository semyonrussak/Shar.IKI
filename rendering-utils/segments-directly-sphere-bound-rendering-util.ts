import { shariki as SegmentsDirectlyRenderingUtil } from "./segments-directly-rendering-util"

import { shariki as Engine } from "../engine"
import { shariki as Source } from "../source/source"
import { shariki as GeoCartesianConverter } from "../utils/geo-cartesian-converter"
import { shariki as PointData } from "../data-interfaces/point-data"
import { shariki as SegmentData } from "../data-interfaces/segment-data"
import { shariki as SegmentOnSphereData } from "../data-interfaces/segment-on-sphere-data"

export namespace shariki {
    export class SegmentsDirectlySphereBoundRenderingUtil
        extends SegmentsDirectlyRenderingUtil.SegmentsDirectlyRenderingUtil {
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

            // Преобразуем каждый объект SegmentOnSphereData в SegmentData
            const transformedData: SegmentData.SegmentData[] = data.map((segment: SegmentOnSphereData.SegmentOnSphereData) => {
                // Преобразуем первую конечную точку
                const [x1, y1, z1] = GeoCartesianConverter.GeoCartesianConverter.geoToCartesian(
                    segment.firstEndData.lat,
                    segment.firstEndData.lon,
                    0,
                    this.radius
                );

                const firstEndData: PointData.PointData = {
                    x: x1,
                    y: y1,
                    z: z1,
                    radius: segment.firstEndData.radius,
                    color: segment.firstEndData.color,
                    label: segment.firstEndData.label,
                    labelColor: segment.firstEndData.labelColor,
                    labelBackgroundColor: segment.firstEndData.labelBackgroundColor
                };

                // Преобразуем вторую конечную точку
                const [x2, y2, z2] = GeoCartesianConverter.GeoCartesianConverter.geoToCartesian(
                    segment.secondEndData.lat,
                    segment.secondEndData.lon,
                    0,
                    this.radius
                );

                const secondEndData: PointData.PointData = {
                    x: x2,
                    y: y2,
                    z: z2,
                    radius: segment.secondEndData.radius,
                    color: segment.secondEndData.color,
                    label: segment.secondEndData.label,
                    labelColor: segment.secondEndData.labelColor,
                    labelBackgroundColor: segment.secondEndData.labelBackgroundColor
                };

                // Создаем объект SegmentData
                const segmentData: SegmentData.SegmentData = {
                    firstEndData: firstEndData,
                    secondEndData: secondEndData,
                    width: segment.width,
                    gradientColor: segment.gradientColor
                };

                return segmentData;
            });

            return transformedData;
        }
    }
}