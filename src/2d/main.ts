import { RenderEngine2D } from './engine/RenderEngine2D';
import { EquirectangularProjection } from './projections/EquirectangularProjection';
import { WebMercatorProjection } from './projections/WebMercatorProjection';
import { GeomagneticPolarProjection } from './projections/GeomagneticPolarProjection';
import { GeographicPolarProjection } from './projections/GeographicPolarProjection';
import { ProjectionManager } from './projections/ProjectionManager';
import { PointsRenderer2D } from './rendering-utils/PointsRenderer2D';
import { SegmentsRenderer2D, SegmentData2D } from './rendering-utils/SegmentsRenderer2D';



const engine = new RenderEngine2D('app-2d');

// Создаём проекцию и менеджер
const projection = new EquirectangularProjection();
const projectionManager = new ProjectionManager( projection,
                                                 engine.getCanvas().clientWidth,
                                                 engine.getCanvas().clientHeight );

// Создаём рендерер точек
const pointsRenderer = new PointsRenderer2D(engine, projectionManager);

// Тестовые города
const cities = [
    { name: 'Moscow', lat: 55.7558, lon: 37.6173, color: '#ff3333' },
    { name: 'London', lat: 51.5074, lon: -0.1278, color: '#33ff33' },
    { name: 'Sydney', lat: -33.8688, lon: 151.2093, color: '#3333ff' }
];

// Передаём данные в рендерер
pointsRenderer.setData(cities);

// Создаём рендерер отрезков
const segmentsRenderer = new SegmentsRenderer2D(engine, projectionManager);

// Тестовые отрезки
const testSegments: SegmentData2D[] = [
    {
        lat1: 55.7558, lon1: 37.6173,   // Moscow
        lat2: 51.5074, lon2: -0.1278,   // London
        color1: '#ff3333', color2: '#33ff33',
        width: 5, gradientColor: true
    },
    {
        lat1: -33.8688, lon1: 151.2093, // Sydney
        lat2: 34.0522, lon2: -118.2437, // Los Angeles
        color1: '#3333ff', color2: '#ffff33',
        width: 3, gradientColor: false
    }
];

segmentsRenderer.setData(testSegments);

// Projection switching logic
function switchToEquirectangular() {
    projectionManager.setProjection(new EquirectangularProjection());
    pointsRenderer.update();
    segmentsRenderer.update();
}

function switchToMercator() {
    projectionManager.setProjection(new WebMercatorProjection());
    pointsRenderer.update();
    segmentsRenderer.update();
}

function switchToGeomagneticPolar() {
    projectionManager.setProjection(new GeomagneticPolarProjection());
    pointsRenderer.update();
    segmentsRenderer.update();
}

function switchToGeographicPolarNorth() {
    projectionManager.setProjection(new GeographicPolarProjection('north'));
    pointsRenderer.update();
    segmentsRenderer.update();
}

// Attach event listeners
document.getElementById('btn-equi')?.addEventListener('click', switchToEquirectangular);
document.getElementById('btn-merc')?.addEventListener('click', switchToMercator);
document.getElementById('btn-geopolar')?.addEventListener('click', switchToGeomagneticPolar);
document.getElementById('btn-geopolarn')?.addEventListener('click', switchToGeographicPolarNorth);

// Цикл анимации
(function animate() {
    requestAnimationFrame(animate);
    engine.render();
})();