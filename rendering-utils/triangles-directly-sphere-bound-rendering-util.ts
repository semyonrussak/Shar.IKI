import { shariki as TrianglesDirectlyRenderingUtil } from "./triangles-directly-rendering-util"

import { shariki as Engine } from "../engine"
import { shariki as Source } from "../source/source"
import { shariki as GeoCartesianConverter } from "../utils/geo-cartesian-converter"
import { shariki as PointData } from "../data-interfaces/point-data"
import { shariki as TriangleData } from "../data-interfaces/triangle-data"
import { shariki as TriangleOnSphereData } from "../data-interfaces/triangle-on-sphere-data"

export namespace shariki {
    export class TrianglesDirectlySphereBoundRenderingUtil
        extends TrianglesDirectlyRenderingUtil.TriagnglesDirectlyRenderingUtil {
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

            // Преобразуем каждый объект TriangleOnSphereData в TriangleData
            const transformedData: TriangleData.TriangleData[] = data.map((triangle: TriangleOnSphereData.TriangleOnSphereData) => {
                // Преобразуем первую вершину
                const [x1, y1, z1] = GeoCartesianConverter.GeoCartesianConverter.geoToCartesian(
                    triangle.firstVertexData.lat,
                    triangle.firstVertexData.lon,
                    0,
                    this.radius
                );

                const firstVertexData: PointData.PointData = {
                    x: x1,
                    y: y1,
                    z: z1,
                    radius: triangle.firstVertexData.radius,
                    color: triangle.firstVertexData.color,
                    label: triangle.firstVertexData.label,
                    labelColor: triangle.firstVertexData.labelColor,
                    labelBackgroundColor: triangle.firstVertexData.labelBackgroundColor
                };

                // Преобразуем вторую вершину
                const [x2, y2, z2] = GeoCartesianConverter.GeoCartesianConverter.geoToCartesian(
                    triangle.secondVertexData.lat,
                    triangle.secondVertexData.lon,
                    0,
                    this.radius
                );

                const secondVertexData: PointData.PointData = {
                    x: x2,
                    y: y2,
                    z: z2,
                    radius: triangle.secondVertexData.radius,
                    color: triangle.secondVertexData.color,
                    label: triangle.secondVertexData.label,
                    labelColor: triangle.secondVertexData.labelColor,
                    labelBackgroundColor: triangle.secondVertexData.labelBackgroundColor
                };

                // Преобразуем третью вершину
                const [x3, y3, z3] = GeoCartesianConverter.GeoCartesianConverter.geoToCartesian(
                    triangle.thirdVertexData.lat,
                    triangle.thirdVertexData.lon,
                    0,
                    this.radius
                );

                const thirdVertexData: PointData.PointData = {
                    x: x3,
                    y: y3,
                    z: z3,
                    radius: triangle.thirdVertexData.radius,
                    color: triangle.thirdVertexData.color,
                    label: triangle.thirdVertexData.label,
                    labelColor: triangle.thirdVertexData.labelColor,
                    labelBackgroundColor: triangle.thirdVertexData.labelBackgroundColor
                };

                // Создаем объект TriangleData
                const triangleData: TriangleData.TriangleData = {
                    firstVertexData: firstVertexData,
                    secondVertexData: secondVertexData,
                    thirdVertexData: thirdVertexData,
                    gradientColor: triangle.gradientColor,
                    type: 'A'
                };

                return triangleData;
            });

            return transformedData;
        }
    }
}