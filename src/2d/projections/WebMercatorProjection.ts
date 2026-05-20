import { MapProjection } from './MapProjection';

export class WebMercatorProjection extends MapProjection {
    readonly name = 'Web Mercator';

    private static readonly MAX_LAT = 85.06; // A constant that defines the maximum absolute latitude we can display

    geoToScreen(lat: number, lon: number): { x: number; y: number } {
        // LONGITUDE
        let normalizedLon = lon; // Create a changable variable to correct longitude if it is not in [-180, 180]
        while (normalizedLon > 180) normalizedLon -= 360;
        while (normalizedLon < -180) normalizedLon += 360;
        if (normalizedLon === 180) normalizedLon = -180;

        const x = (normalizedLon + 180) / 360;   // Transform longitude into horizontal coordinate

        // LATITUDE
        // clamp latitude in [-85.06, 85.06]
        const clampedLat = Math.max(-WebMercatorProjection.MAX_LAT, Math.min(WebMercatorProjection.MAX_LAT, lat));
        const latRad = (clampedLat * Math.PI) / 180; // Convert to radians
        // Mercator Formula for y normalization
        const y = (1 - Math.log(Math.tan(Math.PI / 4 + latRad / 2)) / Math.PI) / 2;
        return { x, y };
    }

    getVisibleBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
        return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    }
}