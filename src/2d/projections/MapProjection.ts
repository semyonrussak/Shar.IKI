export abstract class MapProjection {
    abstract readonly name: string;

    // Абстрактный класс, преобразующий географические координаты в нормализованные
    // Принимает lat - Широта в градусах (-90 до 90) и lon - Долгота в градусах (-180 до 180)
    // Возвращает нормализованные координаты {x, y}
    abstract geoToScreen(lat: number, lon: number): { x: number; y: number };

    // Возвращает границы проекции в нормализованных координатах.
    abstract getVisibleBounds(): { minX: number; maxX: number; minY: number; maxY: number };
}