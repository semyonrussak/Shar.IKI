import * as THREE from 'three';
import { Controller2D } from './Controller2D';

export class RenderEngine2D {                 // Объявляет новый класс RenderEngine2D, который будет использоваться в других модулях (главном main.ts). Это ядро 2D-движка.
    private canvas: HTMLCanvasElement;        // Холст, на котором Three.js будет рисовать. Создаётся в конструкторе на чистом JavaScript, а потом передаётся в WebGL-рендерер.
    private renderer: THREE.WebGLRenderer;    // Главный объект Three.js, который управляет WebGL-контекстом и отрисовывает сцену на canvas.
    private scene: THREE.Scene;               // Контейнер для всех отображаемых объектов (мешей, источников света). В нашей 2D-сцене здесь будут лежать спрайты, точки, отрезки и т.д.
    private camera: THREE.OrthographicCamera; // Камера с ортографической проекцией. В отличие от перспективной камеры (как в 3D-Земле), ортографическая не имеет перспективы: размер объектов не зависит от расстояния. Идеально подходит для плоских картографических проекций.
    private controller: Controller2D;         // Экземпляр контроллера, который будет слушать события мыши и управлять панорамированием и зумом.
    private width: number;                    
    private height: number;                   // Будут хранить текущие ширину и высоту контейнера (и canvas). Нужны для правильной настройки камеры и обработки ресайза.

    constructor(containerId: string) {        // Принимает идентификатор HTML-элемента (div), в который будет встроен canvas.
        const container = document.getElementById(containerId); // Ищет DOM-элемент с заданным id. Если не найден, вернётся null.
        if (!container) {
            throw new Error(`Контейнер с id "${containerId}" не найден`);
        }

        this.canvas = document.createElement('canvas');
        this.canvas.style.display = 'block';                  // Убираем лишние отступы вокруг canvas (по умолчанию он может вести себя как inline-элемент и давать полосу прокрутки).
        container.innerHTML = '';
        container.appendChild(this.canvas);                   // Очищаем контейнер от возможного предыдущего содержимого и вставляем в него созданный canvas.

        this.renderer = new THREE.WebGLRenderer({             // Создаётся рендерер Three.js, связанный с нашим canvas.
            canvas: this.canvas,                  
            antialias: true,                                  // Включает сглаживание (края не будут «зубчатыми»).
            powerPreference: 'high-performance'               // Подсказка браузеру использовать дискретную видеокарту, если она есть.
        });
        this.renderer.setPixelRatio(window.devicePixelRatio); // Задаёт плотность пикселей, соответствующую экрану (например, на Retina-дисплеях она равна 2). Без этого изображение может быть размытым.

        this.scene = new THREE.Scene();                       // Создаётся пустая сцена.
        this.scene.background = new THREE.Color(0x111122);    // Устанавливается тёмно-синий фон сцены (почти чёрный, но не совсем). Это цвет, который будет виден там, где нет объектов.

        const width = container.clientWidth;
        const height = container.clientHeight;                // Получаем текущие размеры контейнера в пикселях.
        this.camera = new THREE.OrthographicCamera(           // Создаётся ортографическая камера. Параметры:
            -width / 2, width / 2,                            // Левая и правая границы видимой области по X (центр в нуле).
            height / 2, -height / 2,                          // Верхняя и нижняя границы по Y (инвертированы, потому что ось Y экрана направлена вниз, а ось Y сцены — вверх).
            0.1, 100                                          // Ближняя и дальняя плоскости отсечения (по Z). Пока объекты будут на z=0, камера на z=10, так что всё будет видно.
        );
        this.camera.position.set(0, 0, 10);                   // Располагаем камеру на расстоянии 10 единиц от плоскости XY (наблюдатель смотрит сверху на сцену). Ортографическая камера не меняет размер объекта от расстояния, но её положение влияет на то, какие объекты окажутся внутри области отсечения.
        this.camera.lookAt(0, 0, 0);                          // Направляем взгляд камеры в центр координат (0,0,0), где и будут располагаться наши графические элементы.

        this.controller = new Controller2D(this);             // Создаём контроллер мыши, передавая ему ссылку на текущий движок (чтобы он мог получить canvas и камеру). В конструкторе Controller2D навешивает обработчики событий на canvas.

        window.addEventListener('resize', this.resize.bind(this)); // При изменении размеров окна браузера будет вызываться метод resize, чтобы обновить размеры камеры и рендерера. Используем .bind(this), чтобы внутри resize ключевое слово this указывало на экземпляр RenderEngine2D.
        this.resize();                                        // Немедленно вызываем resize() для первоначальной установки размеров рендерера (на случай, если к моменту создания размеры были не нулевые).
    }

    // ПУБЛИЧНЫЕ ГЕТТЕРЫ
    // Позволяют внешнему коду (например, рендерерам или главному main.ts) получить доступ к ключевым объектам без прямого обращения к приватным полям. Это паттерн инкапсуляции.
    public getScene(): THREE.Scene { return this.scene; }
    public getCamera(): THREE.OrthographicCamera { return this.camera; }
    public getRenderer(): THREE.WebGLRenderer { return this.renderer; }
    public getCanvas(): HTMLCanvasElement { return this.canvas; }

    public render(): void { // Команда рендереру отрисовать сцену с точки зрения нашей камеры. Вызывается в каждом кадре анимации.
        this.renderer.render(this.scene, this.camera);
    }

    private resize(): void {
        const container = this.canvas.parentElement; // Получаем родительский элемент canvas (контейнер). Если canvas был удалён из DOM, parentElement может быть null.
        if (!container) return;
        this.width = container.clientWidth;
        this.height = container.clientHeight; // Сохраняем новые размеры контейнера.
        this.renderer.setSize(this.width, this.height, false); // Приказываем рендереру изменить размер области вывода. Последний параметр false означает, что мы не хотим менять CSS-размер canvas, только его внутренний буфер (мы уже манипулируем размерами canvas через родительский контейнер).
        this.camera.left = -this.width / 2;
        this.camera.right = this.width / 2;
        this.camera.top = this.height / 2;
        this.camera.bottom = -this.height / 2; // Пересчитываем границы ортографической камеры в соответствии с новыми размерами. Принцип тот же, что в конструкторе.
        this.camera.updateProjectionMatrix();  // Обязательно вызываем после изменения параметров камеры, чтобы Three.js пересчитал внутренние матрицы.
    }
}