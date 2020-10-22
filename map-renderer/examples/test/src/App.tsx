import React, { useEffect, useState } from 'react';
import {
    LoggingLevels,
    MapRendererBuilder,
    PartialAdvanceSettings,
    TimeOfDay
} from "@stimetable/map-renderer/lib/renderer";
import {
    TooltipFeature,
    HighlightingFeature, AutoresizeFeature, CallbackFeature
} from "@stimetable/map-renderer/lib/features";
import { PositionOffset } from '@stimetable/map-renderer/lib/helpers';
import './App.css';

function App() {

    const [ builder, setBuilder ] = useState<MapRendererBuilder | undefined>( undefined );
    const [ tooltipText, setTooltipText ] = useState<string>( '' );
    const [ relPos, setRelPos ] = useState<PositionOffset>( { relX: 0, relY: 0 } );

    useEffect( () => {
        const pp = true;
        const mapBuilder = new MapRendererBuilder( {
                quality: 8,
                targetElement: document.getElementById( "map" )!,
                gltfLocation: process.env.PUBLIC_URL + "scots.gltf",
                createSettings: ( quality: number, existingSettings?: PartialAdvanceSettings ) => {
                    return {}
                }
            },
            {
                camera: {
                    smooth: true,
                },
                lighting: {
                    ambient: {
                        intensity: 1
                    }
                },
                quality: {
                    postprocessing: pp
                },
                canvas: {
                    size: {
                        height: 1024 / 16 * 9,
                        width: 1024,
                    },
                    globalScale: 1,
                },
                map: {
                    timeDependedGetTimeOfDay: function () {
                        return TimeOfDay.afternoon;
                    },
                }
            } );
        mapBuilder.addFeature( new TooltipFeature(
            document.getElementById( 'map-tooltip' )!,
            ( newText: string, relativePosition: PositionOffset ) => {
                setTooltipText( newText );
                setRelPos( relativePosition );
            },
            {}
        ) );
        mapBuilder.addFeature( new HighlightingFeature( {
            postprocessing: pp,
        } ) )
        mapBuilder.addFeature(new AutoresizeFeature({
        }));
        mapBuilder.addFeature( new CallbackFeature( [ {
            method: 'onToggleFullscreen',
            callback: ( args: any ) => {
                console.log( args );
            }
        } ] ) )
        setBuilder( mapBuilder );

        mapBuilder.register();

        return () => {
            mapBuilder.dispose();
        }
    }, [] );

    return (
        <div>
            <p>Text</p>
            <button onClick={() => {
                builder?.register();
            }}>create
            </button>
            <button onClick={() => {
                builder?.dispose();
            }}>dispose
            </button>
            <button onClick={( ev ) => {
                builder?.instance?.toggleFullscreen();
            }}>Full
            </button>
            <button onClick={( ev ) => {
                builder?.instance?.toggleFullscreen( { width: 300, height: 300 } );
            }}>UnFull
            </button>
            <button onClick={async ( ev ) => {
                console.log( await builder?.instance?.focusBuildingByName( 'mck13' ) );
            }}>
                Select
            </button>
            <div style={{ position: 'relative' }}>
                <span id="map-tooltip" style={{ top: relPos.relY - 15, left: relPos.relX + 15 }}>{tooltipText}</span>
                <div id="map"></div>
            </div>
        </div>
    );
}

export default App;
