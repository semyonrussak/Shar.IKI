export namespace shariki {
    export interface Point3D {
        x: number,
        y: number,
        z: number
    }

    export class GeoCartesianConverter {
        public static geoToCartesian(
            latitude: number,
            longitude: number,
            altitude: number,
            radius: number
        ) {
            // Преобразуем широту и долготу в радианы
            const latitudeRad = latitude * Math.PI / 180;
            const longitudeRad = longitude * Math.PI / 180;

            // Вычисляем радиус на высоте altitude
            const r = radius + altitude;

            // Преобразование в декартовы координаты
            const x = r * Math.cos(latitudeRad) * Math.cos(longitudeRad);
            const y = r * Math.sin(latitudeRad);
            const z = r * Math.cos(latitudeRad) * Math.sin(longitudeRad);

            return [x, y, z];
        }

        public static cartesianToGeo(
            x: number,
            y: number,
            z: number,
            radius: number
        ) {
            // Вычисляем расстояние от центра
            const r = Math.sqrt(x * x + y * y + z * z);

            // Вычисляем высоту над поверхностью
            const altitude = r - radius;

            // Вычисляем широту (в радианах)
            const latitudeRad = Math.asin(y / r);

            // Вычисляем долготу (в радианах)
            const longitudeRad = Math.atan2(z, x);

            // Преобразуем в градусы
            let latitude = latitudeRad * 180 / Math.PI;
            let longitude = longitudeRad * 180 / Math.PI;

            return [
                latitude,
                longitude,
                altitude
            ];
        }

        public static cartesianToGeo2(point: Point3D, altitude: number) {
            return this.cartesianToGeo(
                point.x,
                point.y,
                point.z,
                altitude
            )
        }
    }
}