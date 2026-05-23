import { MapProjection } from './MapProjection';

export class GeographicPolarProjection extends MapProjection {
    readonly name: string;
    private readonly hemisphere: 'north' | 'south';
    // Minimum latitude from the pole to display (90 - minLat for north, -90 + minLat for south)
    private readonly minAbsLat = 30.0; // degrees

    constructor(hemisphere: 'north' | 'south' = 'north') {
        super();
        this.hemisphere = hemisphere;
        this.name = `Geographic Polar (${hemisphere === 'north' ? 'North' : 'South'})`;
    }

    /**
     * Converts geographic (lat, lon) in degrees to normalized screen coordinates (0..1).
     * The pole is mapped to the center (0.5, 0.5).
     */
    geoToScreen(lat: number, lon: number): { x: number; y: number } {
        // For south hemisphere, invert latitudes temporarily to treat south pole as the projection center
        const effectiveLat = this.hemisphere === 'north' ? lat : -lat;
        const effectiveLon = this.hemisphere === 'north' ? lon : -lon;

        // Clamp to visible area (poleward of minAbsLat)
        const clampedLat = Math.max(this.minAbsLat, effectiveLat);

        // Stereographic projection from the pole
        const { x, y } = this.stereoFromPole(clampedLat, effectiveLon);

        // Normalize to [0,1] where (0.5,0.5) is the pole
        const rMax = 2 * Math.tan((Math.PI / 4) - (this.minAbsLat * Math.PI / 180) / 2);
        const scale = 0.5 / rMax;
        return {
            x: x * scale + 0.5,
            y: y * scale + 0.5
        };
    }

    /**
     * Inverse transformation: screen (0..1) back to geographic coordinates.
     */
    unproject(screenX: number, screenY: number): { lat: number; lon: number } {
        const rMax = 2 * Math.tan((Math.PI / 4) - (this.minAbsLat * Math.PI / 180) / 2);
        const scale = 0.5 / rMax;
        const sx = (screenX - 0.5) / scale;
        const sy = (screenY - 0.5) / scale;
        const r = Math.sqrt(sx * sx + sy * sy);
        const effectiveLon = Math.atan2(sy, sx) * 180 / Math.PI;
        // Stereographic inversion: lat = π/2 - 2*atan(r/2)
        const effectiveLat = (Math.PI / 2 - 2 * Math.atan2(r, 2)) * 180 / Math.PI;

        if (this.hemisphere === 'north') {
            return { lat: effectiveLat, lon: effectiveLon };
        } else {
            return { lat: -effectiveLat, lon: -effectiveLon };
        }
    }

    getVisibleBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
        return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    }

    /**
     * Stereographic projection of a point given its latitude and longitude relative to the pole.
     * The pole is at lat=90° (effective). Returns (x,y) with (0,0) at the pole.
     */
    private stereoFromPole(latDeg: number, lonDeg: number): { x: number; y: number } {
        const lat = latDeg * Math.PI / 180;
        const lon = lonDeg * Math.PI / 180;
        const r = 2 * Math.tan((Math.PI / 4) - (lat / 2));
        return {
            x: r * Math.cos(lon),
            y: r * Math.sin(lon)
        };
    }
}