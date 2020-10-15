import { Feature } from "./Feature";
import { CanvasSize, THREEObject } from "../typesHelpers";
import { MapRendererRefs } from "../mapRenderer";

export interface PositionOffset {
    relX: number,
    relY: number
}

export interface TooltipSettings {
    delay: number,
}

interface ClientOffset {
    clientX: number,
    clientY: number,
}

export class TooltipFeature extends Feature {

    private timeoutID: number = -1;

    private hoveredBuilding?: THREEObject;

    private mostRecentLocation: PositionOffset = TooltipFeature.defaultPositionOffset;

    static defaultSettings: TooltipSettings = {
        delay: 0.5 * 1000
    }

    static defaultPositionOffset: PositionOffset = {
        relY: -1,
        relX: -1
    }

    constructor(
        private parentElement: HTMLElement,
        private tooltipElement: HTMLElement,
        private setTooltip: ( newText: string, relativePosition: PositionOffset ) => void,
        private settings: TooltipSettings = TooltipFeature.defaultSettings
    ) {
        super();
    }

    onClickBuilding( building: THREEObject, event: PointerEvent ): void {
    }

    onExitBuilding( building: THREEObject, event: PointerEvent ): void {
        if (building.name === this.hoveredBuilding?.name) {
            this.hideTooltip();
            clearTimeout( this.timeoutID );
        }
    }

    onHoverBuilding( building: THREEObject, event: PointerEvent ): void {
        this.hoveredBuilding = building;
        this.hideTooltip();
        clearTimeout( this.timeoutID );
        this.timeoutID = setTimeout( () => {
            this.showTooltip( building.name.split('_').join(' '), this.mostRecentLocation );
        }, this.settings.delay );
    }

    onResizeCanvas( newSize: CanvasSize ): void {
    }

    onTraverseChild( child: THREEObject ): void {
    }

    runSetup( refs: MapRendererRefs ): void {
    }

    onMoveBuilding( building: THREEObject, event: PointerEvent ): void {
        const clientOffset: ClientOffset = {
            clientX: event.clientX,
            clientY: event.clientY
        };
        this.mostRecentLocation = this.pageOffsetToRelOffset( clientOffset );
    }

    runCleanup(): void {
        clearInterval(this.timeoutID);
    }

    private pageOffsetToRelOffset( clientOffset: ClientOffset ): PositionOffset {
        const rect = this.parentElement.getBoundingClientRect();
        const relX = clientOffset.clientX - rect.left;
        const relY = clientOffset.clientY - rect.top;
        return {
            relX,
            relY
        }
    }

    private showTooltip( text: string, position: PositionOffset ) {
        this.setTooltip( text, position );
    }

    private hideTooltip() {
        this.setTooltip( '', TooltipFeature.defaultPositionOffset);
    }

    onControlEnd(): void {
    }

    onControlStart(): void {
        clearTimeout(this.timeoutID);
        this.hideTooltip();
        this.hoveredBuilding = undefined;
    }

}
