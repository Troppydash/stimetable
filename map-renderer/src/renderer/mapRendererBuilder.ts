import {
    AdvanceSettings,
    BasicSettings,
} from "./mapRendererSettingsTypes";
import { RecursivePartial } from "./typesHelpers";
import { MapRenderer } from "./mapRenderer";
import {
    CreateDefaultMapRendererSettingsFromQuality,
    DeepAssign,
    MergeMapRendererSettings
} from "./mapRendererSettingsHelpers";
import { Feature } from "../features";

// MapRenderer Builder class
export class MapRendererBuilder {
    // mapRenderer settings object containing basic and advance settings
    private readonly settings: {
        basic: BasicSettings,
        advance: AdvanceSettings
    }

    public ref?: MapRenderer;

    private features: Feature[] = [];

    // constructor with settings as parameters
    constructor( basicSettings: BasicSettings, advanceSettings?: RecursivePartial<AdvanceSettings> ) {
        /// this part sets up the settings of map renderer ///
        let basic = basicSettings;

        const paramAS = advanceSettings;
        const defaultAS = CreateDefaultMapRendererSettingsFromQuality( basic.quality );
        let calcAs;
        if ( basic.createSettingsFromQuality ) {
            calcAs = basic.createSettingsFromQuality( basic.quality );
        }

        let mergedAS = defaultAS;
        if ( paramAS ) {
            mergedAS = MergeMapRendererSettings( mergedAS, paramAS );
        }
        if ( calcAs ) {
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
        if (this.ref) {
            this.dispose();
        }
        this.ref = new MapRenderer( this.settings.basic, this.settings.advance, this.features );
        return this.ref;
    }

    // dispose the mapRenderer and removes its content
    public dispose() {
        this.ref?.dispose();
        this.ref = undefined;
    }

}
