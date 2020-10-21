import { Feature } from "./Feature";
import { CanvasSize, THREEObject } from "../renderer";
import { MapRenderer, MapRendererRefs } from "../renderer/mapRenderer";

export class AutoresizeFeature extends Feature {
    private _refs!: MapRendererRefs;
    public get refs() {
        return this._refs;
    }

    private _mapRenderer!: MapRenderer;
    public get mapRenderer() {
        return this._mapRenderer;
    }

    constructor( private getWidth: ( self: AutoresizeFeature ) => number, private aspectRatio = 16 / 9 ) {
        super();
    }

    onClickBuilding( building: THREEObject, event: PointerEvent ): void {
    }

    onControlEnd(): void {
    }

    onControlStart(): void {
    }

    onExitBuilding( building: THREEObject, event: PointerEvent ): void {
    }

    onFocusBuilding( newBuilding: THREEObject, oldBuilding?: THREEObject ): void {
    }

    onHoverBuilding( building: THREEObject, event: PointerEvent ): void {
    }

    onMoveBuilding( building: THREEObject, event: PointerEvent ): void {
    }

    onResizeCanvas( newSize: CanvasSize ): void {
    }

    onToggleFullscreen( isFullscreen: boolean ): void {
    }

    onTraverseChild( child: THREEObject ): void {
    }

    runCleanup(): void {
        window.removeEventListener('resize' , this.autoresize);
    }

    private autoresize = () => {
        const width = this.getWidth(this);
        this.mapRenderer.resize( {
            width,
            height: width / this.aspectRatio
        } )
    }

    runSetup( refs: MapRendererRefs, mapRenderer: MapRenderer ): void {
        this._refs = refs;
        this._mapRenderer = mapRenderer;
        window.addEventListener( 'resize', this.autoresize );
    }

}
