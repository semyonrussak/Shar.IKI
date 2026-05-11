import { WebMercatorProjection } from '../src/2d/projections/WebMercatorProjection';

describe('WebMercatorProjection', () => {
    const proj = new WebMercatorProjection();

    it('экватор должен быть в центре по вертикали', () => {
        const result = proj.geoToScreen(0, 0);
        expect(result.x).toBeCloseTo(0.5, 5);
        expect(result.y).toBeCloseTo(0.5, 5);
    });

    it('северная широта ~85° должна быть у верхнего края', () => {
        const result = proj.geoToScreen(85.06, 0);
        expect(result.y).toBeCloseTo(0, 1);   // почти верх
    });

    it('южная широта ~85° должна быть у нижнего края', () => {
        const result = proj.geoToScreen(-85.06, 0);
        expect(result.y).toBeCloseTo(1, 1);   // почти низ
    });

    it('Москва должна быть севернее Лондона (y меньше)', () => {
        const moscow = proj.geoToScreen(55.7558, 37.6173);
        const london = proj.geoToScreen(51.5074, -0.1278);
        expect(moscow.y).toBeLessThan(london.y);
    });

    it('долгота +180 и -180 должны давать одинаковый x', () => {
        const a = proj.geoToScreen(0, 180);
        const b = proj.geoToScreen(0, -180);
        expect(a.x).toBeCloseTo(b.x, 5);
    });

    it('широта > MAX_LAT должна обрезаться', () => {
        const atPole = proj.geoToScreen(90, 0);
        const atMax = proj.geoToScreen(85.06, 0);
        expect(atPole.y).toBeCloseTo(atMax.y, 1);
    });
});