import { Feature } from "./Feature";
import { CanvasSize, THREEObject } from "../typesHelpers";
import { MapRendererRefs } from "../mapRenderer";

export class TestFeature extends Feature {
    constructor(private name: string) {
        super();
    }

    private log(functionName: string) {
        console.log(`${this.name}: called ${functionName}`);
    }

    onClickBuilding( building: THREEObject ): void {
        this.log('onClickBuilding');
    }

    onExitBuilding( building: THREEObject ): void {
        this.log('onExitBuilding');
    }

    onHoverBuilding( building: THREEObject ): void {
        this.log('onHoverBuilding');
    }

    onResizeCanvas( newSize: CanvasSize ): void {
        this.log('onResizeCanvas');
    }

    onTraverseChild( child: THREEObject ): void {
        this.log('onTraverseChild');
    }

    runSetup( refs: MapRendererRefs ): void {
        this.log('runSetup');
    }

    onMoveBuilding( building: THREEObject, event: Event ): void {
        this.log('onMoveBuilding');
    }

    runCleanup(): void {
        this.log('runCleanup');
    }

    onControlEnd(): void {
        this.log('onControlEnd');
    }

    onControlStart(): void {
        this.log('onControlStart');
    }

}