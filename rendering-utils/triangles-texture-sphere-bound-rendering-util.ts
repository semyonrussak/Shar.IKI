import * as THREE from 'three';

import { shariki as RenderingUtil } from "./rendering-util"
import { shariki as SphereTextureRenderingUtil } from "./sphere-texture-rendering-util"
import { shariki as PointData } from "../data-interfaces/point-on-sphere-data"
import { shariki as TriangleData } from "../data-interfaces/triangle-on-sphere-data"

export namespace shariki {
    export class TrianglesTextureSphereBoundRenderingUtil
        extends SphereTextureRenderingUtil.SphereTextureRenderingUtil
        implements RenderingUtil.RenderingUtil {
        public needsAsynchronousTextureLoad(): boolean {
            return false
        }

        public initLabelInfos(): void {
        }

        protected getTexture(): THREE.Texture<unknown> {
            return this.drawTexture(this.source.getData())
        }

        private drawTexture(
            data: TriangleData.TriangleOnSphereData[]
        ) {
            let [canvas, ctx] = this.createCanvas(
                TrianglesTextureSphereBoundRenderingUtil.CANVAS_SIZE,
                TrianglesTextureSphereBoundRenderingUtil.CANVAS_SIZE,
                TrianglesTextureSphereBoundRenderingUtil.CANVAS_SIZE + 'px',
                TrianglesTextureSphereBoundRenderingUtil.CANVAS_SIZE + 'px'
            );

            // Устанавливаем прозрачный фон
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Функция для преобразования географических координат в координаты canvas
            const latLonToCanvas = (lat: number, lon: number): [number, number] => {
                // Нормализуем долготу в диапазон [0, 360)
                const normalizedLon = ((lon % 360) + 360) % 360;

                // Преобразуем в координаты текстуры (equirectangular проекция)
                const x = (normalizedLon / 360) * canvas.width;
                const y = ((90 - lat) / 180) * canvas.height;

                return [x, y];
            };

            // Функция для проверки пересечения меридиана 180°
            const crosses180Meridian = (points: PointData.PointOnSphereData[]): boolean => {
                let minLon = Infinity;
                let maxLon = -Infinity;

                points.forEach(point => {
                    const normalizedLon = ((point.lon % 360) + 360) % 360;
                    minLon = Math.min(minLon, normalizedLon);
                    maxLon = Math.max(maxLon, normalizedLon);
                });

                return (maxLon - minLon) > 180;
            };

            // Функция для создания смещенной копии точки
            const createShiftedPoint = (point: PointData.PointOnSphereData, shift: number): PointData.PointOnSphereData => {
                return {
                    ...point,
                    lon: point.lon + shift
                };
            };

            // Функция для рисования одного треугольника
            const drawTriangle = (v1: PointData.PointOnSphereData, v2: PointData.PointOnSphereData, v3: PointData.PointOnSphereData, gradientColor: boolean) => {
                const [x1, y1] = latLonToCanvas(v1.lat, v1.lon);
                const [x2, y2] = latLonToCanvas(v2.lat, v2.lon);
                const [x3, y3] = latLonToCanvas(v3.lat, v3.lon);

                // Начинаем путь треугольника
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.lineTo(x3, y3);
                ctx.closePath();

                if (gradientColor) {
                    // Создаем градиент на основе bounding box треугольника
                    const minX = Math.min(x1, x2, x3);
                    const maxX = Math.max(x1, x2, x3);
                    const minY = Math.min(y1, y2, y3);
                    const maxY = Math.max(y1, y2, y3);

                    // Используем радиальный градиент для более плавного перехода цветов
                    const gradient = ctx.createRadialGradient(
                        (x1 + x2 + x3) / 3, (y1 + y2 + y3) / 3, 0,
                        (x1 + x2 + x3) / 3, (y1 + y2 + y3) / 3, Math.max(maxX - minX, maxY - minY) / 2
                    );

                    gradient.addColorStop(0, v1.color);
                    gradient.addColorStop(0.5, v2.color);
                    gradient.addColorStop(1, v3.color);

                    ctx.fillStyle = gradient;
                } else {
                    // Используем цвет первой вершины
                    ctx.fillStyle = v1.color;
                }

                // Заполняем треугольник
                ctx.fill();
            };

            // Обрабатываем каждый треугольник из данных
            data.forEach(triangle => {
                const { firstVertexData, secondVertexData, thirdVertexData, gradientColor } = triangle;
                const vertices = [firstVertexData, secondVertexData, thirdVertexData];

                // Проверяем, пересекает ли треугольник меридиан 180°
                if (crosses180Meridian(vertices)) {
                    // Рисуем оригинальный треугольник
                    drawTriangle(firstVertexData, secondVertexData, thirdVertexData, gradientColor);

                    // Рисуем смещенную копию треугольника
                    const shift = firstVertexData.lon < 0 ? 360 : -360;
                    const shiftedV1 = createShiftedPoint(firstVertexData, shift);
                    const shiftedV2 = createShiftedPoint(secondVertexData, shift);
                    const shiftedV3 = createShiftedPoint(thirdVertexData, shift);

                    drawTriangle(shiftedV1, shiftedV2, shiftedV3, gradientColor);
                } else {
                    // Обычный треугольник - рисуем один раз
                    drawTriangle(firstVertexData, secondVertexData, thirdVertexData, gradientColor);
                }
            });

            let result = new THREE.CanvasTexture(canvas);
            this.removeCanvas(canvas);

            return result;
        }
    }
}