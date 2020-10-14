// Typescript Partial but extended recursively
import { Object3D } from "three";

export type RecursivePartial<T> = {
    [P in keyof T]?:
    T[P] extends (infer U)[] ? RecursivePartial<U>[] :
        T[P] extends object ? RecursivePartial<T[P]> :
            T[P];
};


export interface CanvasSize {
    width: number,
    height: number,
}

export type THREEObject = Object3D;
