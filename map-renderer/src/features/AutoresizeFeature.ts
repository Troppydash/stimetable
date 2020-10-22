import { Feature } from "./Feature";
import { CanvasSize, RecursivePartial, THREEObject } from "../renderer";
import { MapRenderer, MapRendererRefs } from "../renderer/mapRenderer";
import { DeepAssign } from "../renderer/mapRendererSettingsHelpers";
import set = Reflect.set;

export interface AutoresizeFeatureSettings {
    getWidth: ( self: AutoresizeFeature ) => number,
    watchWindow: boolean
}

export class AutoresizeFeature extends Feature {
    private _refs!: MapRendererRefs;
    public get refs() {
        return this._refs;
    }

    private _mapRenderer!: MapRenderer;
    public get mapRenderer() {
        return this._mapRenderer;
    }

    static defaultSettings: AutoresizeFeatureSettings = {
        getWidth: () => window.innerWidth,
        watchWindow: true,
    }

    private settings: AutoresizeFeatureSettings;

    constructor(
        settings: RecursivePartial<AutoresizeFeatureSettings> = AutoresizeFeature.defaultSettings,
        private aspectRatio = 16 / 9
    ) {
        super();
        this.settings = DeepAssign(AutoresizeFeature.defaultSettings, settings);
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
        if ( this.settings.watchWindow ) {
            window.removeEventListener( 'resize', this.autoresize );
        }
    }

    public autoresize = () => {
        const width = this.settings.getWidth( this );
        this.mapRenderer.resize( {
            width,
            height: width / this.aspectRatio
        } )
    }

    runSetup( refs: MapRendererRefs, mapRenderer: MapRenderer ): void {
        this._refs = refs;
        this._mapRenderer = mapRenderer;
        if ( this.settings.watchWindow ) {
            window.addEventListener( 'resize', this.autoresize );
            this.autoresize();
        }
    }

}
