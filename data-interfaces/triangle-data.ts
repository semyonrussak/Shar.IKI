import { shariki as PointData } from "./point-data"

export namespace shariki {
    export interface TriangleData {
        firstVertexData: PointData.PointData
        secondVertexData: PointData.PointData
        thirdVertexData: PointData.PointData
        gradientColor: boolean,
        type: string
    }
}