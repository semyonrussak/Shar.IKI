import { MapProjection } from './MapProjection';
// Паттерн Strategy
// Projection Manager превращает нормализованные координаты (которые возвращает проекция) в реальные пиксели на экране. 
export class ProjectionManager { // Объявляет класс, доступный другим модулям
    currentProjection: MapProjection; // Текущая активная проекция, может быть заменена в любой момент методом setProjection()
    width: number; // Ширина и высота видимой области в пикселях
    height: number;

    // Принимает начальную проекцию и размеры области. Сохраняет их в поля. 
    // Обычно вызывается при старте приложения, сразу после получения размеров контейнера.
    constructor(projection: MapProjection, width: number, height: number) {
        this.currentProjection = projection;
        this.width = width;
        this.height = height;
    } 

    // Публичный метод, который будет вызываться из каждого рендерера (точек, отрезков, треугольников). 
    // На вход получает географические координаты одной точки, возвращает её экранные координаты в пикселях.
    projectPoint(lat: number, lon: number): { x: number; y: number } {
        const norm = this.currentProjection.geoToScreen(lat, lon); // Вызывает метод geoToScreen() текущей активной проекции. Получает нормализованные координаты в диапазоне [0, 1] по обеим осям. Благодаря полиморфизму (паттерн «Стратегия») мы не знаем, какая именно проекция активна, но точно знаем, что у неё есть этот метод.
        return { x: (norm.x - 0.5) * this.width,     // центрируем: 0.5 -> 0
                 y: (norm.y - 0.5) * this.height };  // и масштабируем до пикселей
    }
    // Это соглашение «центр экрана = (0,0)» идеально сочетается с нашей ортографической камерой, у которой left = -width/2, right = width/2 и т.д

    setProjection(projection: MapProjection): void {
        this.currentProjection = projection;
    }
    // Позволяет сменить текущую проекцию «на лету» (например, с Equirectangular на Mercator). 
    // После этого все последующие вызовы projectPoint() будут использовать новую проекцию.

    updateSize(width: number, height: number): void {
        this.width = width;
        this.height = height;
    }
    // Обновляет размеры области отображения. Будет вызываться из обработчика resize нашего RenderEngine2D, чтобы координаты всегда соответствовали актуальным размерам canvas.
}