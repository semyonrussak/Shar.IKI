import { shariki as PointData } from "./point-data"

export namespace shariki {
    export interface SegmentData {
        firstEndData: PointData.PointData
        secondEndData: PointData.PointData
        width: number
        gradientColor: boolean
    }
}