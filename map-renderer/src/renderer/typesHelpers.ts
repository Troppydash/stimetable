// Typescript Partial but extended recursively
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
