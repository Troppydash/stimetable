
// Base Features class
import { MapRendererRefs } from "../mapRenderer";
import { Object3D } from "three";
import { CanvasSize, THREEObject } from "../typesHelpers";

export abstract class Feature {
    abstract runSetup(refs: MapRendererRefs): void;
    abstract onTraverseChild(child: THREEObject): void;
    abstract onHoverBuilding(building: THREEObject): void;
    abstract onClickBuilding(building: THREEObject): void;
    abstract onExitBuilding(building: THREEObject): void;
    abstract onResizeCanvas(newSize: CanvasSize): void;
}
