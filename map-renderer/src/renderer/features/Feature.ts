
// Base Features class
import { MapRendererRefs } from "../mapRenderer";
import { Object3D } from "three";
import { CanvasSize, THREEObject } from "../typesHelpers";

export abstract class Feature {
    abstract runSetup(refs: MapRendererRefs): void;
    abstract runCleanup(): void;
    abstract onTraverseChild(child: THREEObject): void;
    abstract onHoverBuilding(building: THREEObject, event: PointerEvent): void;
    abstract onClickBuilding(building: THREEObject, event: PointerEvent): void;
    abstract onMoveBuilding(building: THREEObject, event: PointerEvent): void;
    abstract onExitBuilding(building: THREEObject, event: PointerEvent): void;
    abstract onControlStart(): void;
    abstract onControlEnd(): void;
    abstract onResizeCanvas(newSize: CanvasSize): void;
}
