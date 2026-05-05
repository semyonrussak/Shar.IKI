import * as THREE from 'three';

export namespace shariki {
    export class TextureUtil {
        private texture: THREE.Texture | null = null;
        private texturePath
        private textureSrc: string | null = null
        private invalidTexureSrc = false

        public onTextureLoaded: () => void

        public getTexture() {
            return this.texture
        }

        public constructor(
            texturePath: string
        ) {
            this.texturePath = texturePath
        }

        public setTexture(
            texture: THREE.Texture
        ) {
            this.texture = texture
        }

        public setTextureSrc(
            textureSrc: string
        ) {
            this.textureSrc = textureSrc
            this.texture = null
        }

        // Метод для предварительной загрузки текстуры
        public async loadTexture(): Promise<void> {
            if (this.texture) return; // Текстура уже загружена

            return new Promise((resolve, reject) => {
                // Если есть textureSrc (base64), используем его
                if (this.textureSrc) {
                    try {
                        const texture = new THREE.Texture();
                        const image = new Image();

                        image.onload = () => {
                            // texture.image = ImageUtil.mirrorImage(image);
                            texture.image = image
                            texture.needsUpdate = true;
                            texture.wrapS = THREE.ClampToEdgeWrapping;
                            texture.wrapT = THREE.ClampToEdgeWrapping;
                            texture.colorSpace = THREE.NoColorSpace;
                            texture.needsUpdate = true
                            this.texture = texture;
                            this.invalidTexureSrc = false

                            if (this.onTextureLoaded) {
                                this.onTextureLoaded()
                            }

                            resolve();
                        };

                        image.onerror = (/* error */) => {
                            // console.error('Error loading texture from base64:', error);
                            this.invalidTexureSrc = true


                            if (this.onTextureLoaded) {
                                this.onTextureLoaded()
                            }

                            // reject(new Error('Failed to load base64 texture'));
                        };

                        image.src = this.textureSrc;
                    } catch (error) {
                        console.error('Error creating texture from base64:', error);

                        if (this.onTextureLoaded) {
                            this.onTextureLoaded()
                        }

                        reject(error);
                    }
                } else {
                    // Используем стандартный путь к текстуре
                    new THREE.TextureLoader().load(
                        this.texturePath,
                        (texture: THREE.Texture) => {
                            // texture.image = ImageUtil.mirrorImage(texture.image)
                            texture.wrapS = THREE.ClampToEdgeWrapping;
                            texture.wrapT = THREE.ClampToEdgeWrapping;
                            texture.colorSpace = THREE.NoColorSpace;
                            texture.needsUpdate = true
                            this.texture = texture;

                            if (this.onTextureLoaded) {
                                this.onTextureLoaded()
                            }

                            resolve();
                        },
                        undefined,
                        (error: unknown) => {
                            console.error(`Error loading texture from path: ${this.texturePath}`);
                            console.error('Current working directory:', window.location.href);

                            if (this.onTextureLoaded) {
                                this.onTextureLoaded()
                            }

                            reject(error);
                        }
                    );
                }
            });
        }

        public texureSrcIsValid() {
            return !this.invalidTexureSrc
        }

        public dispose() {
            if (this.texture) {
                this.texture.dispose()
            }

            this.texture = null
        }
    }
}