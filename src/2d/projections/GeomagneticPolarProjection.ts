import { MapProjection } from './MapProjection';

export class GeomagneticPolarProjection extends MapProjection {
    readonly name = 'Geomagnetic Polar';

    // Northern magnetic pole coordinates (approximate, can be adjusted)
    private readonly magPoleLatDeg = 80.0;
    private readonly magPoleLonDeg = -72.0;

    // Precomputed rotation matrix to transform geographic -> geomagnetic
    private readonly rotMatrix: number[][];

    // Minimum latitude to display (in magnetic coordinates), e.g., 30° means everything poleward of 30° is shown
    private readonly minMagLat = 30.0; // degrees

    constructor() {
        super();
        // Build rotation matrix that maps geographic North Pole (0,0,1) to magnetic pole direction
        this.rotMatrix = this.buildRotationMatrix(this.magPoleLatDeg, this.magPoleLonDeg);
    }

    /**
     * Converts geographic (lat, lon) in degrees to normalized screen coordinates (0..1).
     * The magnetic pole is mapped to the center (0.5, 0.5).
     */
    geoToScreen(lat: number, lon: number): { x: number; y: number } {
        const { magLat, magLon } = this.geoToMag(lat, lon);
        // If the point is too far from the pole, clamp it to the visible boundary
        const clampedMagLat = Math.max(this.minMagLat, magLat);
        const { x, y } = this.stereoProject(clampedMagLat, magLon);
        // Normalize to [0,1] range. The visible circle radius corresponds to r_max.
        const rMax = 2 * Math.tan((Math.PI / 4) - (this.minMagLat * Math.PI / 180) / 2);
        const scale = 0.5 / rMax; // so that r_max maps to 0.5
        return {
            x: x * scale + 0.5,
            y: y * scale + 0.5
        };
    }

    /**
     * Inverse transformation: screen (0..1) back to geographic coordinates.
     */
    unproject(x: number, y: number): { lat: number; lon: number } {
        // Reverse the normalization
        const rMax = 2 * Math.tan((Math.PI / 4) - (this.minMagLat * Math.PI / 180) / 2);
        const scale = 0.5 / rMax;
        const sx = (x - 0.5) / scale;
        const sy = (y - 0.5) / scale;
        const r = Math.sqrt(sx * sx + sy * sy);
        const magLon = Math.atan2(sy, sx); // in radians
        const magLat = (Math.PI / 2) - 2 * Math.atan2(r, 2); // from stereo formula
        return this.magToGeo(magLat * 180 / Math.PI, magLon * 180 / Math.PI);
    }

    getVisibleBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
        return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    }

    // ------------------------------------------------------------
    // Private helper methods
    // ------------------------------------------------------------

    /**
     * Builds a rotation matrix that sends the geographic North Pole to the magnetic pole direction.
     */
    private buildRotationMatrix(poleLatDeg: number, poleLonDeg: number): number[][] {
        const lat = poleLatDeg * Math.PI / 180;
        const lon = poleLonDeg * Math.PI / 180;

        // Geographic North Pole vector (0,0,1)
        // Target magnetic pole vector: (cos(lat)*cos(lon), cos(lat)*sin(lon), sin(lat))
        // Rotation axis = cross product, angle = arccos(dot product)
        const north = [0, 0, 1];
        const target = [
            Math.cos(lat) * Math.cos(lon),
            Math.cos(lat) * Math.sin(lon),
            Math.sin(lat)
        ];

        // Compute rotation matrix using Rodrigues' rotation formula
        const dot = north[0] * target[0] + north[1] * target[1] + north[2] * target[2];
        const angle = Math.acos(dot);
        if (Math.abs(angle) < 1e-10) return [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; // identity
        const axis = [
            north[1] * target[2] - north[2] * target[1],
            north[2] * target[0] - north[0] * target[2],
            north[0] * target[1] - north[1] * target[0]
        ];
        const len = Math.sqrt(axis[0] * axis[0] + axis[1] * axis[1] + axis[2] * axis[2]);
        const ux = axis[0] / len, uy = axis[1] / len, uz = axis[2] / len;
        const c = Math.cos(angle), s = Math.sin(angle), t = 1 - c;
        return [
            [c + ux * ux * t, ux * uy * t - uz * s, ux * uz * t + uy * s],
            [uy * ux * t + uz * s, c + uy * uy * t, uy * uz * t - ux * s],
            [uz * ux * t - uy * s, uz * uy * t + ux * s, c + uz * uz * t]
        ];
    }

    /**
     * Applies rotation matrix to a vector.
     */
    private rotateVector(v: number[]): number[] {
        const m = this.rotMatrix;
        return [
            m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2],
            m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2],
            m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2]
        ];
    }

    /**
     * Converts geographic lat/lon (degrees) to geomagnetic lat/lon.
     */
    private geoToMag(latDeg: number, lonDeg: number): { magLat: number; magLon: number } {
        const lat = latDeg * Math.PI / 180;
        const lon = lonDeg * Math.PI / 180;
        // Geographic Cartesian coordinates
        const x = Math.cos(lat) * Math.cos(lon);
        const y = Math.cos(lat) * Math.sin(lon);
        const z = Math.sin(lat);
        // Rotate to geomagnetic frame
        const [mx, my, mz] = this.rotateVector([x, y, z]);
        // Convert back to spherical
        const magLat = Math.asin(mz) * 180 / Math.PI;
        const magLon = Math.atan2(my, mx) * 180 / Math.PI;
        return { magLat, magLon };
    }

    /**
     * Inverse of geoToMag: geomagnetic -> geographic.
     */
    private magToGeo(magLatDeg: number, magLonDeg: number): { lat: number; lon: number } {
        const lat = magLatDeg * Math.PI / 180;
        const lon = magLonDeg * Math.PI / 180;
        const mx = Math.cos(lat) * Math.cos(lon);
        const my = Math.cos(lat) * Math.sin(lon);
        const mz = Math.sin(lat);
        // Inverse rotation (transpose of rotMatrix)
        const m = this.rotMatrix;
        const x = m[0][0] * mx + m[1][0] * my + m[2][0] * mz;
        const y = m[0][1] * mx + m[1][1] * my + m[2][1] * mz;
        const z = m[0][2] * mx + m[1][2] * my + m[2][2] * mz;
        const geoLat = Math.asin(z) * 180 / Math.PI;
        const geoLon = Math.atan2(y, x) * 180 / Math.PI;
        return { lat: geoLat, lon: geoLon };
    }

    /**
     * Stereographic projection of a point (magLat, magLon) onto a plane.
     * Returns (x,y) where the center (0,0) corresponds to the magnetic pole.
     * The projection assumes a sphere of radius 1.
     */
    private stereoProject(magLatDeg: number, magLonDeg: number): { x: number; y: number } {
        const lat = magLatDeg * Math.PI / 180;
        const lon = magLonDeg * Math.PI / 180;
        // Stereographic radius from pole
        const r = 2 * Math.tan((Math.PI / 4) - (lat / 2));
        return {
            x: r * Math.cos(lon),
            y: r * Math.sin(lon)
        };
    }
}