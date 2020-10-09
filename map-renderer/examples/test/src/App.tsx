import React, { useEffect } from 'react';
import * as MapRenderer from "@stimetable/map-renderer";


function App() {

    useEffect(() => {
        const test = new MapRenderer.MapRenderer( {
            quality: 6,
            targetElement: document.getElementById("map")!,
            gltfLocation: "scots-notex.gltf"
        }, {
            canvas: {
                height: 14,
                width: 1920,
                fixed: true,
            }
        } );

        return () => {
            console.log("Cleanup");
        }
    });

    return (
        <div>
            <p>Text</p>
            <canvas id="map"></canvas>
        </div>
    );
}

export default App;
