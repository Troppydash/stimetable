import { Vector3 } from "three";
import TWEEN from "@tweenjs/tween.js";

// Helper Method that creates a rotation tween and returns a promise handler
export function CreateRotationTween( onUpdate: (time: number) => void, onComplete: Function, duration: number = 1000 ): Promise<null> {
    return new Promise<null>( ( resolve ) => {
        const time = { t: 0 };
        new TWEEN.Tween( time )
            .to( { t: 1 } , duration)
            .easing(TWEEN.Easing.Exponential.InOut)
            .onUpdate(() => {
                onUpdate(time.t);
            })
            .onComplete(() => {
                onComplete();
                resolve();
            })
            // must ignore
            // @ts-ignore
            .start();
    } )
}

// Helper Method that creates a position tween and returns a promise handler
export function CreatePositionTween( from: Vector3, to: Vector3, onUpdate: (time: Vector3) => void, onComplete: Function, duration: number = 1000 ): Promise<null> {
    return new Promise<null>( ( resolve ) => {
        new TWEEN.Tween( from as any )
            .to( to as any , duration)
            .easing(TWEEN.Easing.Exponential.InOut)
            .onUpdate(() => {
                onUpdate(from);
            })
            .onComplete(() => {
                onComplete();
                resolve();
            })
            // must ignore
            // @ts-ignore
            .start();
    } )
}