import { RenderEngine2D } from './engine/RenderEngine2D';
import { WebMercatorProjection } from './projections/WebMercatorProjection';
import { ProjectionManager } from './projections/ProjectionManager';
import * as THREE from 'three';

const engine = new RenderEngine2D('app-2d');

// Создаём проекцию и менеджер (размеры пока возьмём из камеры)
const camera = engine.getCamera();
const width = camera.right - camera.left;
const height = camera.top - camera.bottom;
const projection = new WebMercatorProjection();
const projectionManager = new ProjectionManager(projection, width, height);

// Тестовые точки (широта, долгота, цвет)
const cities = [
    { name: 'Moscow', lat: 55.7558, lon: 37.6173, color: '#ff3333' },
    { name: 'London', lat: 51.5074, lon: -0.1278, color: '#33ff33' },
    { name: 'Sydney', lat: -33.8688, lon: 151.2093, color: '#3333ff' }
];

const positions: number[] = [];
const colors: number[] = [];

cities.forEach(city => {
    const screenPos = projectionManager.projectPoint(city.lat, city.lon);
    positions.push(screenPos.x, screenPos.y, 0);

    const color = new THREE.Color(city.color);
    colors.push(color.r, color.g, color.b);
});

// Создаём геометрию точек
const geometry = new THREE.BufferGeometry();
geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
geometry.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));

const material = new THREE.PointsMaterial({ size: 10, vertexColors: true });
const points = new THREE.Points(geometry, material);
engine.getScene().add(points);


// Запуск цикла анимации
(function animate() {
    requestAnimationFrame(animate);
    engine.render();
})();