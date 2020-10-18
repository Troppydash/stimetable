import { MapRenderer, MapRendererRefs } from "../mapRenderer";
import { CanvasSize, THREEObject } from "../typesHelpers";

// Base Features class
export abstract class Feature {
    abstract runSetup( refs: MapRendererRefs, mapRenderer: MapRenderer ): void;

    abstract runCleanup(): void;

    abstract onTraverseChild( child: THREEObject ): void;

    abstract onHoverBuilding( building: THREEObject, event: PointerEvent ): void;

    abstract onClickBuilding( building: THREEObject, event: PointerEvent ): void;

    abstract onMoveBuilding( building: THREEObject, event: PointerEvent ): void;

    abstract onExitBuilding( building: THREEObject, event: PointerEvent ): void;

    abstract onControlStart(): void;

    abstract onControlEnd(): void;

    abstract onResizeCanvas( newSize: CanvasSize ): void;

    abstract onToggleFullscreen( isFullscreen: boolean ): void;

    abstract onFocusBuilding( newBuilding: THREEObject, oldBuilding?: THREEObject ): void;
}
