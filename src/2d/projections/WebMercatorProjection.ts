import { MapProjection } from './MapProjection';

export class WebMercatorProjection extends MapProjection {
    readonly name = 'Web Mercator';

    // Обрезаем широту, потому что полюса в этой проекции уходят в бесконечность
    private static readonly MAX_LAT = 85.06;

    geoToScreen(lat: number, lon: number): { x: number; y: number } {
        // --- Нормализация долготы (как в Equirectangular) ---
        let normalizedLon = lon;
        while (normalizedLon > 180) normalizedLon -= 360;
        while (normalizedLon < -180) normalizedLon += 360;
        if (normalizedLon === 180) normalizedLon = -180;

        const x = (normalizedLon + 180) / 360;   // [0..1]

        // --- Ограничение широты ---
        const clampedLat = Math.max(-WebMercatorProjection.MAX_LAT, Math.min(WebMercatorProjection.MAX_LAT, lat));

        // Переводим в радианы
        const latRad = (clampedLat * Math.PI) / 180;

        // Формула Меркатора
        const y = (1 - Math.log(Math.tan(Math.PI / 4 + latRad / 2)) / Math.PI) / 2;

        return { x, y };
    }

    getVisibleBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
        return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    }
}