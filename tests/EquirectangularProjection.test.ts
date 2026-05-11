import { EquirectangularProjection } from '../src/2d/projections/EquirectangularProjection';

describe('EquirectangularProjection', () => {
    const proj = new EquirectangularProjection();

    it('центр карты (0,0) должен быть в (0.5, 0.5)', () => {
        const result = proj.geoToScreen(0, 0);
        expect(result.x).toBeCloseTo(0.5, 5);
        expect(result.y).toBeCloseTo(0.5, 5);
    });

    it('северный полюс должен быть наверху', () => {
        const result = proj.geoToScreen(90, 0);
        expect(result.y).toBeCloseTo(0, 5);   // 0 = верх
    });

    it('южный полюс должен быть внизу', () => {
        const result = proj.geoToScreen(-90, 0);
        expect(result.y).toBeCloseTo(1, 5);   // 1 = низ
    });

    it('долгота +180 и -180 дают одинаковый x', () => {
        const pos1 = proj.geoToScreen(0, 180);
        const pos2 = proj.geoToScreen(0, -180);
        expect(pos1.x).toBeCloseTo(pos2.x, 5);
    });

    // НОВЫЕ ТЕСТЫ ДЛЯ ПРОВЕРКИ ИНВЕРСИИ Y
    it('северный полюс должен быть выше экватора', () => {
        const north = proj.geoToScreen(90, 0);
        const equator = proj.geoToScreen(0, 0);
        expect(north.y).toBeLessThan(equator.y);
    });

    it('Москва должна быть севернее Лондона (y меньше)', () => {
        const moscow = proj.geoToScreen(55.7558, 37.6173);
        const london = proj.geoToScreen(51.5074, -0.1278);
        expect(moscow.y).toBeLessThan(london.y);
    });

    it('Сидней должен быть сильно южнее (y больше)', () => {
        const sydney = proj.geoToScreen(-33.8688, 151.2093);
        const london = proj.geoToScreen(51.5074, -0.1278);
        expect(sydney.y).toBeGreaterThan(london.y);
    });
});