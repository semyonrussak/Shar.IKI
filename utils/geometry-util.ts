import {
    BufferGeometry,
    BufferAttribute,
    Vector3,
    Matrix4,
} from 'three';

export namespace shariki {
    export class GeometryUtil {
        public static createSphereBufferGeometry(
            radius: number,
            nWidthSegments: number,
            nHeightSegments: number
        ): BufferGeometry {
            // Количество точек по ширине и высоте
            const widthPoints = nWidthSegments + 1;
            const heightPoints = nHeightSegments + 1;

            // Угловые шаги
            const alpha = Math.PI / nHeightSegments; // угол между рядами (от полюса до полюса)
            const beta = (2 * Math.PI) / nWidthSegments; // угол между столбцами (по долготе)

            // Буферы для атрибутов
            const positions: number[] = [];
            const normals: number[] = [];
            const uvs: number[] = [];
            const indices: number[] = [];

            // Эталонный вектор - направлен на северный полюс
            const referenceVector = new Vector3(0, radius, 0);
            const tempVector = new Vector3();

            // Матрицы для поворотов
            const rotationX = new Matrix4();
            const rotationY = new Matrix4();

            // Создаем вершинные атрибуты
            for (let row = 0; row < heightPoints; row++) {
                const phi = row * alpha; // угол от северного полюса

                for (let col = 0; col < widthPoints; col++) {
                    const theta = col * beta; // угол долготы

                    // Создаем матрицу поворота вокруг оси X
                    rotationX.makeRotationX(phi);

                    // Применяем первый поворот вокруг X
                    tempVector.copy(referenceVector).applyMatrix4(rotationX);

                    // Создаем матрицу поворота вокруг оси Y
                    rotationY.makeRotationY(theta);

                    // Применяем второй поворот вокруг Y
                    tempVector.applyMatrix4(rotationY);

                    // Позиция
                    positions.push(tempVector.x, tempVector.y, tempVector.z);

                    // Нормаль (нормализованный вектор от центра к точке)
                    tempVector.normalize();
                    normals.push(tempVector.x, tempVector.y, tempVector.z);

                    // UV координаты (equirectangular проекция)
                    const u = col / nWidthSegments; // от 0 до 1 по долготе
                    const v = 1 - (row / nHeightSegments); // от 1 до 0 по широте (северный полюс = 0, южный = 1)
                    uvs.push(u, v);
                }
            }

            // Создаем индексный буфер
            for (let row = 0; row < nHeightSegments; row++) {
                for (let col = 0; col < nWidthSegments; col++) {
                    // Индексы четырех вершин текущего квада
                    const a = row * widthPoints + col;
                    const b = row * widthPoints + col + 1;
                    const c = (row + 1) * widthPoints + col;
                    const d = (row + 1) * widthPoints + col + 1;

                    // Два треугольника, образующих квад
                    indices.push(a, c, b); // первый треугольник
                    indices.push(b, c, d); // второй треугольник
                }
            }

            // Создаем геометрию и устанавливаем атрибуты
            const geometry = new BufferGeometry();

            geometry.setAttribute(
                'position',
                new BufferAttribute(new Float32Array(positions), 3)
            );

            geometry.setAttribute(
                'normal',
                new BufferAttribute(new Float32Array(normals), 3)
            );

            geometry.setAttribute(
                'uv',
                new BufferAttribute(new Float32Array(uvs), 2)
            );

            geometry.setIndex(indices);

            // Вычисляем ограничивающую сферу для оптимизации отрисовки
            geometry.computeBoundingSphere();

            return geometry;
        }

        // public static createSphereTrianglesArray(
        //     radius: number,
        //     nWidthSegments: number,
        //     nHeightSegments: number
        // ): Array<{
        //     x1: number, y1: number, z1: number, lat1: number, lon1: number,
        //     x2: number, y2: number, z2: number, lat2: number, lon2: number,
        //     x3: number, y3: number, z3: number, lat3: number, lon3: number,
        //     type: string
        // }> {
        //     // Количество точек по ширине и высоте
        //     const widthPoints = nWidthSegments + 1;
        //     const heightPoints = nHeightSegments + 1;

        //     // Угловые шаги
        //     const alpha = Math.PI / nHeightSegments; // угол между рядами (от полюса до полюса)
        //     const beta = (2 * Math.PI) / nWidthSegments; // угол между столбцами (по долготе)

        //     // Буферы для вершин
        //     const vertices: Array<{
        //         x: number, y: number, z: number,
        //         lat: number, lon: number
        //     }> = [];

        //     // Создаем вершины
        //     for (let row = 0; row < heightPoints; row++) {
        //         const phi = row * alpha; // угол от северного полюса

        //         for (let col = 0; col < widthPoints; col++) {
        //             const theta = col * beta; // угол долготы

        //             // Вычисляем координаты сферической поверхности
        //             const x = radius * Math.sin(phi) * Math.cos(theta);
        //             const y = radius * Math.cos(phi); // Y - ось вверх (северный полюс)
        //             const z = radius * Math.sin(phi) * Math.sin(theta);

        //             // Вычисляем географические координаты
        //             const lat = 90 - (phi * 180 / Math.PI);
        //             let lon = (theta * 180 / Math.PI);
        //             if (lon > 180) lon -= 360;

        //             vertices.push({ x, y, z, lat, lon });
        //         }
        //     }

        //     // Создаем массив треугольников
        //     const triangles: Array<{
        //         x1: number, y1: number, z1: number, lat1: number, lon1: number,
        //         x2: number, y2: number, z2: number, lat2: number, lon2: number,
        //         x3: number, y3: number, z3: number, lat3: number, lon3: number,
        //         type: string
        //     }> = [];

        //     // ПРАВИЛЬНОЕ ФОРМИРОВАНИЕ ТРЕУГОЛЬНИКОВ
        //     for (let row = 0; row < nHeightSegments; row++) {
        //         for (let col = 0; col < nWidthSegments; col++) {
        //             // Индексы вершин для текущего квадрата
        //             const topLeft = row * widthPoints + col;
        //             const topRight = row * widthPoints + col + 1;
        //             const bottomLeft = (row + 1) * widthPoints + col;
        //             const bottomRight = (row + 1) * widthPoints + col + 1;

        //             const vTL = vertices[topLeft];
        //             const vTR = vertices[topRight];
        //             const vBL = vertices[bottomRight];
        //             const vBR = vertices[bottomLeft];

        //             // Два треугольника, образующих квадратную грань:
        //             // Диагональ разделяет квадрат на два треугольника

        //             // Треугольник 1: topLeft -> topRight -> bottomRight
        //             triangles.push({
        //                 x1: vTL.x, y1: vTL.y, z1: vTL.z, lat1: vTL.lat, lon1: vTL.lon,
        //                 x2: vTR.x, y2: vTR.y, z2: vTR.z, lat2: vTR.lat, lon2: vTR.lon,
        //                 x3: vBR.x, y3: vBR.y, z3: vBR.z, lat3: vBR.lat, lon3: vBR.lon,
        //                 type: 'A'
        //             });

        //             // Треугольник 2: topLeft -> bottomRight -> bottomLeft
        //             triangles.push({
        //                 x1: vTL.x, y1: vTL.y, z1: vTL.z, lat1: vTL.lat, lon1: vTL.lon,
        //                 x2: vBR.x, y2: vBR.y, z2: vBR.z, lat2: vBR.lat, lon2: vBR.lon,
        //                 x3: vBL.x, y3: vBL.y, z3: vBL.z, lat3: vBL.lat, lon3: vBL.lon,
        //                 type: 'B'
        //             });
        //         }
        //     }

        //     let minY = Infinity


        //     for (let triangle of triangles) {
        //         if (minY > triangle.y1) {
        //             minY = triangle.y1
        //         }

        //         if (minY > triangle.y2) {
        //             minY = triangle.y2
        //         }

        //         if (minY > triangle.y3) {
        //             minY = triangle.y3
        //         }
        //     }

        //     console.log(`min y: ${minY}`)
        //     console.log(`triangles.length: ${triangles.length}`)

        //     return triangles;
        // }

        public static createSphereTrianglesArray(
            radius: number,
            nWidthSegments: number,
            nHeightSegments: number
        ): Array<{
            x1: number, y1: number, z1: number, lat1: number, lon1: number,
            x2: number, y2: number, z2: number, lat2: number, lon2: number,
            x3: number, y3: number, z3: number, lat3: number, lon3: number,
            type: string
        }> {
            // Количество точек по ширине и высоте
            const widthPoints = nWidthSegments + 1;
            const heightPoints = nHeightSegments + 1;

            // Угловые шаги
            const alpha = Math.PI / nHeightSegments; // угол между рядами (от полюса до полюса)
            const beta = (2 * Math.PI) / nWidthSegments; // угол между столбцами (по долготе)

            // Буферы для вершин
            const vertices: Array<{
                x: number, y: number, z: number,
                lat: number, lon: number
            }> = [];

            // Создаем вершины
            for (let row = 0; row < heightPoints; row++) {
                const phi = row * alpha; // угол от северного полюса

                for (let col = 0; col < widthPoints; col++) {
                    const theta = col * beta; // угол долготы

                    // Вычисляем координаты сферической поверхности
                    const x = radius * Math.sin(phi) * Math.cos(theta);
                    const y = radius * Math.cos(phi); // Y - ось вверх (северный полюс)
                    const z = radius * Math.sin(phi) * Math.sin(theta);

                    // Вычисляем географические координаты
                    const lat = 90 - (phi * 180 / Math.PI);
                    let lon = (theta * 180 / Math.PI);
                    if (lon > 180) lon -= 360;

                    vertices.push({ x, y, z, lat, lon });
                }
            }

            // Создаем массив треугольников
            const triangles: Array<{
                x1: number, y1: number, z1: number, lat1: number, lon1: number,
                x2: number, y2: number, z2: number, lat2: number, lon2: number,
                x3: number, y3: number, z3: number, lat3: number, lon3: number,
                type: string
            }> = [];

            // ПРАВИЛЬНОЕ ФОРМИРОВАНИЕ ТРЕУГОЛЬНИКОВ С ЗАЦИКЛЕННОСТЬЮ
            for (let row = 0; row < nHeightSegments; row++) {
                for (let col = 0; col < nWidthSegments + 1; col++) {
                    // Индексы вершин для текущего квадрата
                    const topLeft = row * widthPoints + col;
                    const topRight = row * widthPoints + (col + 1) % widthPoints; // Зацикленность по долготе
                    const bottomLeft = (row + 1) * widthPoints + col;
                    const bottomRight = (row + 1) * widthPoints + (col + 1) % widthPoints; // Зацикленность по долготе

                    const vTL = vertices[topLeft];
                    const vTR = vertices[topRight];
                    const vBL = vertices[bottomRight];  // Сохраняем твой "костыль"
                    const vBR = vertices[bottomLeft];   // Сохраняем твой "костыль"

                    // Два треугольника, образующих квадратную грань:
                    // Диагональ разделяет квадрат на два треугольника

                    // Треугольник 1: topLeft -> topRight -> bottomRight
                    triangles.push({
                        x1: vTL.x, y1: vTL.y, z1: vTL.z, lat1: vTL.lat, lon1: vTL.lon,
                        x2: vTR.x, y2: vTR.y, z2: vTR.z, lat2: vTR.lat, lon2: vTR.lon,
                        x3: vBR.x, y3: vBR.y, z3: vBR.z, lat3: vBR.lat, lon3: vBR.lon,
                        type: 'A'
                    });

                    // Треугольник 2: topLeft -> bottomRight -> bottomLeft
                    triangles.push({
                        x1: vTL.x, y1: vTL.y, z1: vTL.z, lat1: vTL.lat, lon1: vTL.lon,
                        x2: vBR.x, y2: vBR.y, z2: vBR.z, lat2: vBR.lat, lon2: vBR.lon,
                        x3: vBL.x, y3: vBL.y, z3: vBL.z, lat3: vBL.lat, lon3: vBL.lon,
                        type: 'B'
                    });
                }
            }

            let minY = Infinity;
            for (let triangle of triangles) {
                if (minY > triangle.y1) minY = triangle.y1;
                if (minY > triangle.y2) minY = triangle.y2;
                if (minY > triangle.y3) minY = triangle.y3;
            }

            console.log(`min y: ${minY}`);
            console.log(`triangles.length: ${triangles.length}`);

            return triangles;
        }
    }
}