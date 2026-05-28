import { RenderEngine2D } from './engine/RenderEngine2D';
import { EquirectangularProjection } from './projections/EquirectangularProjection';
import { WebMercatorProjection } from './projections/WebMercatorProjection';
import { GeomagneticPolarProjection } from './projections/GeomagneticPolarProjection';
import { GeographicPolarProjection } from './projections/GeographicPolarProjection';
import { ProjectionManager } from './projections/ProjectionManager';
import { PointsRenderer2D } from './rendering-utils/PointsRenderer2D';
import { SegmentsRenderer2D, SegmentData2D } from './rendering-utils/SegmentsRenderer2D';
import { TrianglesRenderer2D, TriangleData2D } from './rendering-utils/TrianglesRenderer2D';

const engine = new RenderEngine2D('app-2d');

// Start with Equirectangular
const projection = new EquirectangularProjection();
const projectionManager = new ProjectionManager( projection,
                                                 engine.getCanvas().clientWidth,
                                                 engine.getCanvas().clientHeight );

// Points renderer
const pointsRenderer = new PointsRenderer2D(engine, projectionManager);

// Test cities
const cities = [
    { name: 'Moscow', lat: 55.7558, lon: 37.6173, color: '#ff3333' },
    { name: 'London', lat: 51.5074, lon: -0.1278, color: '#33ff33' },
    { name: 'Sydney', lat: -33.8688, lon: 151.2093, color: '#3333ff' },
    { name: 'Los Angeles', lat: 34.0522, lon: -118.2437, color: '#ffff33' }
];

// Transfer data to renderer
pointsRenderer.setData(cities);

// Создаём рендерер отрезков
const segmentsRenderer = new SegmentsRenderer2D(engine, projectionManager);

// Тестовые отрезки
const testSegments: SegmentData2D[] = [
    {
        lat1: 55.7558, lon1: 37.6173,   // Moscow
        lat2: 51.5074, lon2: -0.1278,   // London
        color1: '#ff0000', color2: '#ff0000',
        width: 20, gradientColor: true
    },
    {
        lat1: -33.8688, lon1: 151.2093, // Sydney
        lat2: 34.0522, lon2: -118.2437, // Los Angeles
        color1: '#ff0000', color2: '#ff0000',
        width: 20, gradientColor: false
    }
];

segmentsRenderer.setData(testSegments);

// Создаём рендерер треугольников
const trianglesRenderer = new TrianglesRenderer2D(engine, projectionManager);

// Тестовые треугольники
const testTriangles: TriangleData2D[] = [
    {
        lat1: 60, lon1: 30, color1: '#ff0000',
        lat2: 50, lon2: 50, color2: '#00ff00',
        lat3: 55, lon3: 20, color3: '#0000ff',
        gradientColor: true
    },
    {
        lat1: -20, lon1: -40, color1: '#ffff00',
        lat2: -30, lon2: -20, color2: '#ff00ff',
        lat3: -10, lon3: -50, color3: '#00ffff',
        gradientColor: false
    }
];

trianglesRenderer.setData(testTriangles);

// Projection switching logic
function switchToEquirectangular() {
    projectionManager.setProjection(new EquirectangularProjection());
    pointsRenderer.update();
    segmentsRenderer.update();
    trianglesRenderer.update();
}

function switchToMercator() {
    projectionManager.setProjection(new WebMercatorProjection());
    pointsRenderer.update();
    segmentsRenderer.update();
    trianglesRenderer.update();
}

function switchToGeomagneticPolar() {
    projectionManager.setProjection(new GeomagneticPolarProjection());
    pointsRenderer.update();
    segmentsRenderer.update();
    trianglesRenderer.update();
}

function switchToGeographicPolarNorth() {
    projectionManager.setProjection(new GeographicPolarProjection('north'));
    pointsRenderer.update();
    segmentsRenderer.update();
    trianglesRenderer.update();
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