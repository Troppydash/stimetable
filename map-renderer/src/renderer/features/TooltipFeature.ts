import { Feature } from "./feature";
import { Object3D } from "three";
import { CanvasSize, THREEObject } from "../typesHelpers";
import { MapRendererRefs } from "../mapRenderer";

// TODO: Create this
export class TooltipFeature extends Feature {

    constructor(private targetElement: HTMLElement) {
        super();
    }

    onClickBuilding( building: THREEObject ): void {
    }

    onExitBuilding( building: THREEObject ): void {
    }

    onHoverBuilding( building: THREEObject ): void {
    }

    onResizeCanvas( newSize: CanvasSize ): void {
    }

    onTraverseChild( child: THREEObject ): void {
    }

    runSetup( refs: MapRendererRefs ): void {
    }

}
