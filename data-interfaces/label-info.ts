import * as THREE from 'three';

export namespace shariki {
    export interface LabelInfo {
        label: string,
        color: string,
        backgroundColor: string,
        position: THREE.Vector3
    }
}