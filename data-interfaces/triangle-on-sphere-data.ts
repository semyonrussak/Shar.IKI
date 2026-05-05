import { shariki as PointData } from "./point-on-sphere-data"

export namespace shariki {
    export interface TriangleOnSphereData {
        firstVertexData: PointData.PointOnSphereData
        secondVertexData: PointData.PointOnSphereData
        thirdVertexData: PointData.PointOnSphereData
        gradientColor: boolean
    }
}