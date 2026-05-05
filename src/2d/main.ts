import { RenderEngine2D } from './engine/RenderEngine2D';
import * as THREE from 'three';

const engine = new RenderEngine2D('app-2d');

// красный квадрат 200x200 пикселей
const geometry = new THREE.PlaneGeometry(200, 200);
const material = new THREE.MeshBasicMaterial({ color: 0xff3333 });
const square = new THREE.Mesh(geometry, material);
engine.getScene().add(square);

(function animate() {
    requestAnimationFrame(animate);
    engine.render();
})();