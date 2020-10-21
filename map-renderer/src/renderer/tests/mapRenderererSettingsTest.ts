import { MapRendererBuilder } from "../mapRendererBuilder";
import { CreateDefaultMapRendererSettingsFromQuality, DeepAssign } from "../mapRendererSettingsHelpers";

const toString = ( obj: object ) => JSON.stringify( obj );

describe( 'Tst Settings Merging', () => {
    test( 'Quality', () => {
        const mapBuilder = new MapRendererBuilder( {
            quality: 5,
            targetElement: document.createElement( 'div' ),
            gltfLocation: 'test.gltf'
        } );
        expect( toString( mapBuilder.settings.advance ) ).toBe( toString( CreateDefaultMapRendererSettingsFromQuality( 5 ) ) );
        expect( toString( mapBuilder.settings.advance ) ).not.toBe( toString( CreateDefaultMapRendererSettingsFromQuality( 10 ) ) );
    } )

    test('DeepAssign ignore undefined', () => {
        const target = {
            one: 'one',
            two: false,
            three: 1,
            four: null,
            five: undefined,
            six: () => {},
        };

        const source = {
            one: undefined,
            two: true,
            three: 5,
            four: undefined,
            five: 'five',
            six: undefined,
        };

        expect(toString(DeepAssign(target, source))).toBe(toString({
            one: 'one',
            two: true,
            three: 5,
            four: null,
            five: 'five',
            six: () => {},
        }))
        expect(toString(DeepAssign(target, source))).not.toBe(toString({
            one: undefined,
            two: true,
            three: 5,
            four: undefined,
            five: 'five',
            six: undefined,
        }))
    })
} )
