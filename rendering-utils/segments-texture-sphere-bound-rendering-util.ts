import * as THREE from 'three';

import { shariki as SharIKIRenderingUtil } from "./rendering-util"
import { shariki as SharIKISphereTextureRenderingUtil } from "./sphere-texture-rendering-util"
import { shariki as PointData } from "../data-interfaces/point-on-sphere-data"
import { shariki as SegmentData } from "../data-interfaces/segment-on-sphere-data"

export namespace shariki {
    export class SegmentsTextureSphereBoundRenderingUtil
        extends SharIKISphereTextureRenderingUtil.SphereTextureRenderingUtil
        implements SharIKIRenderingUtil.RenderingUtil {
        public needsAsynchronousTextureLoad(): boolean {
            return false
        }

        public initLabelInfos(): void {
        }

        protected getTexture() {
            return this.drawTexture(this.source.getData())
        }

        private drawTexture(data: SegmentData.SegmentOnSphereData[]): THREE.CanvasTexture {
            let [canvas, ctx] = this.createCanvas(
                SegmentsTextureSphereBoundRenderingUtil.CANVAS_SIZE,
                SegmentsTextureSphereBoundRenderingUtil.CANVAS_SIZE,
                SegmentsTextureSphereBoundRenderingUtil.CANVAS_SIZE + 'px',
                SegmentsTextureSphereBoundRenderingUtil.CANVAS_SIZE + 'px'
            );

            // Устанавливаем прозрачный фон
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Функция для преобразования географических координат в координаты canvas
            const latLonToCanvas = (lat: number, lon: number): [number, number] => {
                // Нормализуем долготу в диапазон [0, 360)
                const normalizedLon = ((lon % 360) + 360) % 360;

                // Преобразуем в координаты текстуры
                const x = (normalizedLon / 360) * canvas.width;
                const y = ((90 - lat) / 180) * canvas.height;

                return [x, y];
            };

            // Функция для рисования одного отрезка
            const drawSegment = (firstEnd: PointData.PointOnSphereData, secondEnd: PointData.PointOnSphereData, width: number, gradientColor: boolean) => {
                const [x1, y1] = latLonToCanvas(firstEnd.lat, firstEnd.lon);
                const [x2, y2] = latLonToCanvas(secondEnd.lat, secondEnd.lon);

                ctx.lineWidth = width;
                ctx.lineCap = 'round';

                if (gradientColor) {
                    // Создаем градиент
                    const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
                    gradient.addColorStop(0, firstEnd.color);
                    gradient.addColorStop(1, secondEnd.color);
                    ctx.strokeStyle = gradient;
                } else {
                    // Используем цвет первого конца
                    ctx.strokeStyle = firstEnd.color;
                }

                // Рисуем отрезок
                ctx.beginPath();
                ctx.moveTo(x1, y1);
                ctx.lineTo(x2, y2);
                ctx.stroke();
            };

            // Обрабатываем каждый отрезок
            data.forEach(segment => {
                const { firstEndData, secondEndData, width, gradientColor } = segment;

                // Проверяем, пересекает ли отрезок меридиан 180°
                const lonDiff = Math.abs(firstEndData.lon - secondEndData.lon);

                if (lonDiff > 180) {
                    // Отрезок пересекает меридиан 180° - рисуем две части

                    // Первая часть - оригинальные координаты
                    drawSegment(firstEndData, secondEndData, width, gradientColor);

                    // Вторая часть - смещенная на 360°
                    const shiftedFirstEnd = {
                        ...firstEndData,
                        lon: firstEndData.lon + (firstEndData.lon < 0 ? 360 : -360)
                    };
                    const shiftedSecondEnd = {
                        ...secondEndData,
                        lon: secondEndData.lon + (secondEndData.lon < 0 ? 360 : -360)
                    };

                    drawSegment(shiftedFirstEnd, shiftedSecondEnd, width, gradientColor);
                } else {
                    // Обычный отрезок - рисуем один раз
                    drawSegment(firstEndData, secondEndData, width, gradientColor);
                }
            });

            let result = new THREE.CanvasTexture(canvas);
            this.removeCanvas(canvas);

            return result;
        }
    }
}