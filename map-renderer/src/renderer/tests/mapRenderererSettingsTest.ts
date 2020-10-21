import { MapRendererBuilder } from "../mapRendererBuilder";
import { CreateDefaultMapRendererSettingsFromQuality } from "../mapRendererSettingsHelpers";

const toString = ( obj: object ) => JSON.stringify( obj );

describe( 'Test Settings Merging', () => {
    test( 'Quality', () => {
        const mapBuilder = new MapRendererBuilder( {
            quality: 5,
            targetElement: document.createElement( 'div' ),
            gltfLocation: 'test.gltf'
        } );
        expect( toString( mapBuilder.settings.advance ) ).toBe( toString( CreateDefaultMapRendererSettingsFromQuality( 5 ) ) );
    } )

    test( 'Testing Merging Must Fail', () => {
        const mapBuilder = new MapRendererBuilder( {
            quality: 1,
            targetElement: document.createElement( 'div' ),
            gltfLocation: 'test.gltf'
        } );
        expect( toString( mapBuilder.settings.advance ) ).not.toBe( toString( CreateDefaultMapRendererSettingsFromQuality( 5 ) ) );
    } )
} )
