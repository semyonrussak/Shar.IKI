import { shariki as PointData } from "./point-on-sphere-data"

export namespace shariki {
    export interface SegmentOnSphereData {
        firstEndData: PointData.PointOnSphereData
        secondEndData: PointData.PointOnSphereData
        width: number
        gradientColor: boolean
    }
}