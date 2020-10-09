import * as similarity from 'string-similarity';
import * as TWEEN from "@tweenjs/tween.js";
import * as THREE from 'three';

import {
    BasicSettings,
    CreateDefaultMapRendererSettingsFromQuality,
    MapRendererSettings, MergeMapRendererSettings
} from "./mapRendererSettingsTypes";
import { RecursivePartial } from "./typesHelpers";

export class MapRenderer {

    private readonly settings: {
        basic: BasicSettings,
        advance: MapRendererSettings
    }

    constructor( basicSettings: BasicSettings, advanceSettings?: RecursivePartial<MapRendererSettings> ) {
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

        console.debug( this.settings );

        const t1 = similarity;
        const t2 = TWEEN;
        const t3 = THREE;
    }
}
