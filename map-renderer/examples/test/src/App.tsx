import React, { useEffect, useState } from 'react';
import * as MapRenderer from "@stimetable/map-renderer";
import { MapRendererBuilder, TimeOfDay } from "@stimetable/map-renderer/lib/renderer";
import { TooltipFeature, TestFeature, PositionOffset } from "@stimetable/map-renderer/lib/renderer/features";
import './App.css';

function App() {

    const [ builder, setBuilder ] = useState<MapRendererBuilder | undefined>( undefined );
    const [ tooltipText, setTooltipText ] = useState<string>( '' );
    const [ relPos, setRelPos ] = useState<PositionOffset>( { relX: 0, relY: 0 } );

    useEffect( () => {

        const builder = new MapRendererBuilder( {
            quality: 7,
            targetElement: document.getElementById( "map" )!,
            gltfLocation: process.env.PUBLIC_URL + "scots.gltf"
        }, {
            camera: {
                smooth: true,
            },
            performance: {},
            quality: {
                postprocessing: true
            },
            canvas: {
                size: {
                    height: 1024 / 16 * 9,
                    width: 1024,
                },
                fixed: true,
            },
            map: {
                timeDependedGetTimeOfDay: function () {
                    return TimeOfDay.night;
                }
            }
        } );
        builder.addFeature( new TooltipFeature(
            document.getElementById( "map" )!,
            document.getElementById( 'map-tooltip' )!,
            ( newText: string, relativePosition: PositionOffset ) => {
                setTooltipText( newText );
                setRelPos( relativePosition );
            },
        ) );
        setBuilder( builder );

        builder?.register();

        return () => {
            builder?.dispose();
        }
    }, [] );


    return (
        <div>
            <p>Text</p>
            <button onClick={( ev ) => {
                builder?.ref?.toggleFullscreen();
            }}>Full
            </button>
            <button onClick={async ( ev ) => {
                console.log( await builder?.ref?.focusObject( 'mck13' ) );
            }}>
                Select
            </button>
            <div style={{ position: 'relative'}}>
                <span id="map-tooltip" style={{ top: relPos.relY - 15, left: relPos.relX + 15 }}>{tooltipText}</span>
                <div id="map"></div>
            </div>
        </div>
    );
}

export default App;
