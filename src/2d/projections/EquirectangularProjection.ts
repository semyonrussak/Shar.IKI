import { MapProjection } from './MapProjection'; // Импорт абстрактного класса MapProjection

export class EquirectangularProjection extends MapProjection {
    readonly name = 'Equirectangular';

    geoToScreen(lat: number, lon: number): { x: number; y: number } {
        // Нормализуем долготу к диапазону [-180, 180]
        let normalizedLon = lon; // Создаём переменную для нормализованной долготы (в диапазоне [-180, 180])
        while (normalizedLon > 180) normalizedLon -= 360;
        while (normalizedLon < -180) normalizedLon += 360;
        if (normalizedLon === 180) normalizedLon = -180; // Долготы -180 и 180 дадут normalizedLon = -180, и x = (-180 + 180)/360 = 0

        const x = (normalizedLon + 180) / 360; // Получаем значения в диапазоне [0, 1]
        const y = (90 - lat) / 180;            // Вычитаем широту из 90, потому что на экране ось Y направлена вниз, а в географии север – вверх
        return { x, y };
    }

    getVisibleBounds(): { minX: number; maxX: number; minY: number; maxY: number } {
        return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
    }
    // Сообщает, что вся поверхность Земли, которую отображает эта проекция, лежит в диапазоне от 0 до 1 по обеим осям. 
    // Это понадобится позже для отсечения невидимых объектов.
}