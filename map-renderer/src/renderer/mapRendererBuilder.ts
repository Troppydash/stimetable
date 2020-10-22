import {
    AdvanceSettings,
    BasicSettings, PartialAdvanceSettings,
} from "./mapRendererSettingsTypes";
import { MapRenderer } from "./mapRenderer";
import {
    CreateDefaultMapRendererSettingsFromQuality,
    MergeMapRendererSettings
} from "./mapRendererSettingsHelpers";
import { Feature } from "../features";

// MapRenderer Builder class
export class MapRendererBuilder {
    // mapRenderer settings object containing basic and advance settings
    public readonly settings: {
        basic: BasicSettings,
        advance: AdvanceSettings
    }

    private _instance?: MapRenderer;
    public get instance() {
        return this._instance;
    }

    private features: Feature[] = [];

    // constructor with settings as parameters
    constructor( basicSettings: BasicSettings, advanceSettings?: PartialAdvanceSettings ) {
        /// this part sets up the settings of map renderer ///
        const basic = basicSettings;

        const paramAS = advanceSettings;
        const defaultAS = CreateDefaultMapRendererSettingsFromQuality( basic.quality );
        let mergedAS = defaultAS;
        if ( paramAS ) {
            mergedAS = MergeMapRendererSettings( mergedAS, paramAS );
        }
        if ( basic.createSettings ) {
            const calcAs = basic.createSettings( basic.quality, mergedAS );
            mergedAS = MergeMapRendererSettings( mergedAS, calcAs );
        }

        this.settings = {
            basic,
            advance: mergedAS,
        }
    }


    public addFeature( feature: Feature ): this {
        this.features = [ ...this.features, feature ];
        return this;
    }

    // registers the mapRenderer, this calls loadMap
    public register(): MapRenderer {
        if (this._instance) {
            this.dispose();
        }
        this._instance = new MapRenderer( this.settings.basic, this.settings.advance, this.features );
        return this._instance;
    }

    // dispose the mapRenderer and removes its content
    public dispose() {
        this._instance?.dispose();
        this._instance = undefined;
    }

}
