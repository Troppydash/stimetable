import { Feature } from "./Feature";
import { CanvasSize, THREEObject } from "../renderer";
import { MapRenderer, MapRendererRefs } from "../renderer/mapRenderer";
import { ClientOffset, PageOffsetToRelOffset, PositionOffset } from "../helpers";

export interface TooltipSettings {
    delay: number,
}

export class TooltipFeature extends Feature {

    private timeoutID?: NodeJS.Timeout;

    private hoveredBuilding?: THREEObject;

    private mostRecentLocation: PositionOffset = TooltipFeature.defaultPositionOffset;

    static defaultSettings: TooltipSettings = {
        delay: 0.5 * 1000
    }

    static defaultPositionOffset: PositionOffset = {
        relY: -1,
        relX: -1
    }

    private targetElement!: HTMLElement;

    constructor(
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
            this.timeoutID && clearTimeout( this.timeoutID );
        }
    }

    onHoverBuilding( building: THREEObject, event: PointerEvent ): void {
        this.hoveredBuilding = building;
        this.hideTooltip();
        this.timeoutID && clearTimeout( this.timeoutID );
        this.timeoutID = setTimeout( () => {
            this.showTooltip( building.name.split('_').join(' '), this.mostRecentLocation );
        }, this.settings.delay );
    }

    onResizeCanvas( newSize: CanvasSize ): void {
        this.hideTooltip();
    }

    onTraverseChild( child: THREEObject ): void {
    }

    runSetup( refs: MapRendererRefs, mapRenderer: MapRenderer ): void {
        this.hideTooltip();
        this.targetElement = mapRenderer.targetElement;
    }

    onMoveBuilding( building: THREEObject, event: PointerEvent ): void {
        if (this.hoveredBuilding?.uuid !== building.uuid) {
            this.onHoverBuilding(building, event);
        }
        const clientOffset: ClientOffset = {
            clientX: event.clientX,
            clientY: event.clientY
        };
        this.mostRecentLocation = PageOffsetToRelOffset( this.targetElement, clientOffset );
    }

    runCleanup(): void {
        this.timeoutID && clearInterval(this.timeoutID);
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
        this.timeoutID && clearTimeout(this.timeoutID);
        this.hideTooltip();
        this.hoveredBuilding = undefined;
    }

    onToggleFullscreen(isFullscreen: boolean): void {
        this.hideTooltip();
    }

    onFocusBuilding( newBuilding: THREEObject, oldBuilding?: THREEObject ): void {
    }
}
