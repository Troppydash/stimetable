import React, { useEffect, useState } from 'react';
import * as MapRenderer from "@stimetable/map-renderer";
import { MapRendererBuilder, TimeOfDay } from "@stimetable/map-renderer/lib/renderer";
import { TooltipFeature, TestFeature } from "@stimetable/map-renderer/lib/renderer/features";

function App() {

    const [ builder, setBuilder ] = useState<MapRendererBuilder | undefined>( undefined );

    useEffect( () => {

        const builder = new MapRendererBuilder( {
            quality: 5,
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
        builder.addFeature( new TooltipFeature() );
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
            <div>
                <div id="map"></div>
            </div>
        </div>
    );
}

export default App;
