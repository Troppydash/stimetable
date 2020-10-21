import { Feature, FeatureMethods } from "./Feature";
import { CanvasSize, THREEObject } from "../renderer";
import { MapRenderer, MapRendererRefs } from "../renderer/mapRenderer";

export interface Callback {
    method: FeatureMethods,
    callback: (args: any[]) => void,
}

export class CallbackFeature extends Feature {

    constructor( private callbacks: Callback[] ) {
        super();
    }

    private proxy( method: FeatureMethods, ...args: any[] ) {
        this.callbacks.forEach( callback => {
            if ( callback.method === method ) {
                callback.callback( args );
            }
        } )
    }

    onClickBuilding( building: THREEObject, event: PointerEvent ): void {
        this.proxy( "onClickBuilding", building, event);
    }

    onControlEnd(): void {
        this.proxy('onControlEnd');
    }

    onControlStart(): void {
        this.proxy('onControlStart');
    }

    onExitBuilding( building: THREEObject, event: PointerEvent ): void {
        this.proxy('onExitBuilding', building, event);
    }

    onFocusBuilding( newBuilding: THREEObject, oldBuilding?: THREEObject ): void {
        this.proxy('onFocusBuilding', newBuilding, oldBuilding);
    }

    onHoverBuilding( building: THREEObject, event: PointerEvent ): void {
        this.proxy('onHoverBuilding', building, event);
    }

    onMoveBuilding( building: THREEObject, event: PointerEvent ): void {
        this.proxy('onMoveBuilding', building, event);
    }

    onResizeCanvas( newSize: CanvasSize ): void {
        this.proxy('onResizeCanvas', newSize);
    }

    onToggleFullscreen( isFullscreen: boolean ): void {
        this.proxy('onToggleFullscreen', isFullscreen);
    }

    onTraverseChild( child: THREEObject ): void {
        this.proxy('onTraverseChild', child);
    }

    runCleanup(): void {
        this.proxy('runCleanup');
    }

    runSetup( refs: MapRendererRefs, mapRenderer: MapRenderer ): void {
        this.proxy('runSetup', refs, mapRenderer);
    }

}
