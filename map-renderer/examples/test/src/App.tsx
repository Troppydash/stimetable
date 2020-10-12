import React, { useEffect, useState } from 'react';
import * as MapRenderer from "@stimetable/map-renderer";
import { MapRendererBuilder } from "@stimetable/map-renderer";
import { MathUtils } from "three";

function App() {

    const [ builder, setBuilder ] = useState<MapRendererBuilder | undefined>( undefined );

    useEffect( () => {


       const builder = new MapRenderer.MapRendererBuilder( {
            quality: 8,
            targetElement: document.getElementById( "map" )!,
            gltfLocation: process.env.PUBLIC_URL + "scots-notex.gltf"
        }, {
            canvas: {
                size: {
                    height: 1024 / 16 * 9,
                    width: 1024,
                },
                fixed: true,
            },
            map: {
                timeDependedGetTimeOfDay: function () {
                    return MapRenderer.TimeOfDay.morning;
                }
            }
        } ) ;

        setBuilder(builder);

        builder?.register();

        return () => {
            builder?.dispose();
        }
    }, [] );


    return (
        <div>
            <p>Text</p>
            <button onClick={(ev) => {
                builder?.ref?.toggleFullscreen();
            }}>Full</button>
            <button onClick={async (ev) => {
                console.log(await builder?.ref?.focusObject( 'mck13'));
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
