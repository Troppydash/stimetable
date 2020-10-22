import { Feature } from "./Feature";
import { CanvasSize, RecursivePartial, THREEObject } from "../renderer/typesHelpers";
import { MapRenderer, MapRendererRefs } from "../renderer/mapRenderer";
import { HexColor } from "../renderer/mapRendererSettingsTypes";
import { Mesh, MeshStandardMaterial, Object3D } from "three";
import * as THREE from "three";
import { DeepAssign } from "../renderer/mapRendererSettingsHelpers";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";

export interface HighlightingFeatureSettings {
    colors: {
        unchanged: HexColor,
        hovered: HexColor,
        selected: HexColor
    },
    postprocessing: boolean,
}

export class HighlightingFeature extends Feature {

    static defaultSettings: HighlightingFeatureSettings = {
        colors: {
            unchanged: "#8e8e8e",
            hovered: "#ffffff",
            selected: "#b82832",
        },
        postprocessing: false
    }

    private refs!: MapRendererRefs
    private render!: Function

    private selectedBuilding?: Object3D
    private hoveredBuilding?: Object3D

    private settings: HighlightingFeatureSettings;

    private outlinePassSelected!: OutlinePass;
    private outlinePassHover!: OutlinePass;

    constructor( settings: RecursivePartial<HighlightingFeatureSettings> = HighlightingFeature.defaultSettings ) {
        super();

        this.settings = DeepAssign(HighlightingFeature.defaultSettings, settings);
    }

    private setColor( building: Object3D | undefined, color: HexColor ) {
        ((building as any)?.material as MeshStandardMaterial)?.color.set( color );
    }

    private selectBuilding( building: Object3D ) {
        if ( this.settings.postprocessing ) {
            this.outlinePassSelected.selectedObjects = [ building ];
            this.outlinePassHover.selectedObjects = [];
        } else {
            this.setColor( this.selectedBuilding, this.settings.colors.unchanged );
            this.setColor( this.hoveredBuilding, this.settings.colors.unchanged );
            this.setColor( building, this.settings.colors.selected );
        }
        this.selectedBuilding = building;
        this.hoveredBuilding = building;
        this.render();
    }

    private hoverBuilding( building: Object3D ) {
        if ( building.uuid === this.selectedBuilding?.uuid ) {
            return;
        }

        this.hoveredBuilding = building;
        if ( this.settings.postprocessing ) {
            this.outlinePassHover.selectedObjects = [ building ];
        } else {
            ((building as Mesh).material as MeshStandardMaterial).color.set( this.settings.colors.hovered );
        }

        this.render();
    }

    private unhoverBuilding( building: Object3D ) {
        if ( !building ) {
            return;
        }
        this.hoveredBuilding = undefined;
        if (building.uuid === this.selectedBuilding?.uuid) {
            return;
        }
        if ( this.settings.postprocessing ) {
            this.outlinePassHover.selectedObjects = this.outlinePassHover.selectedObjects.filter( obj => obj.name !== building.name );
        } else {
            ((building as Mesh).material as MeshStandardMaterial).color.set( this.settings.colors.unchanged );
        }
        this.render();
    }

    onClickBuilding( building: THREEObject, event: PointerEvent ): void {
        this.selectBuilding( building );
    }

    onControlEnd(): void {

    }

    onControlStart(): void {
        if ( this.hoveredBuilding ) {
            this.unhoverBuilding( this.hoveredBuilding );
        }
    }

    onExitBuilding( building: THREEObject, event: PointerEvent ): void {
        this.unhoverBuilding( building );
    }

    onHoverBuilding( building: THREEObject, event: PointerEvent ): void {
        this.hoverBuilding( building );
    }

    onMoveBuilding( building: THREEObject, event: PointerEvent ): void {
        if ( building.uuid !== this.hoveredBuilding?.uuid ) {
            this.onHoverBuilding( building, event );
        }
    }

    onResizeCanvas( newSize: CanvasSize ): void {
        if ( this.hoveredBuilding ) {
            this.unhoverBuilding( this.hoveredBuilding );
        }
    }

    onToggleFullscreen( isFullscreen: boolean ): void {
        if ( this.hoveredBuilding ) {
            this.unhoverBuilding( this.hoveredBuilding );
        }
    }

    onTraverseChild( child: THREEObject ): void {
        if ( child instanceof THREE.Mesh && child.name.indexOf( 'Plane' ) === -1 ) {
            (child as any).material.color.set( this.settings.colors.unchanged );
        }
    }

    runCleanup(): void {
    }

    runSetup( refs: MapRendererRefs, mapRenderer: MapRenderer ): void {
        if ( this.settings.postprocessing ) {
            if ( refs.composer === undefined ) {
                throw new Error( 'MapRenderer does not have postprocessing enabled, please enable it during the constructor call.' );
            }
            const { selected, hovered } = this.settings.colors;
            const { size } = mapRenderer;
            const params = {
                edgeStrength: 4.0,
                edgeGlow: 0.0,
                edgeThickness: 1,
                pulsePeriod: 0,
            };
            const outlinePassSelected = mapRenderer.track(new OutlinePass( new THREE.Vector2( size.width, size.height ), refs.scene, refs.camera ));
            refs?.composer.addPass( outlinePassSelected );
            outlinePassSelected.edgeStrength = params.edgeStrength;
            outlinePassSelected.edgeGlow = params.edgeGlow;
            outlinePassSelected.edgeThickness = params.edgeThickness;
            outlinePassSelected.pulsePeriod = params.pulsePeriod;
            outlinePassSelected.visibleEdgeColor.set( selected );
            outlinePassSelected.hiddenEdgeColor.set( selected );

            const outlinePassHover = mapRenderer.track( new OutlinePass( new THREE.Vector2( size.width, size.height ), refs.scene, refs.camera ) );
            refs?.composer.addPass( outlinePassHover );
            outlinePassHover.edgeStrength = params.edgeStrength;
            outlinePassHover.edgeGlow = params.edgeGlow;
            outlinePassHover.edgeThickness = params.edgeThickness;
            outlinePassHover.pulsePeriod = params.pulsePeriod;
            outlinePassHover.visibleEdgeColor.set( hovered );
            outlinePassHover.hiddenEdgeColor.set( hovered );

            this.outlinePassSelected = outlinePassSelected;
            this.outlinePassHover = outlinePassHover;
        }

        this.refs = refs;
        this.render = mapRenderer.render;
    }

    onFocusBuilding( newBuilding: THREEObject, oldBuilding?: THREEObject): void {
        this.selectBuilding(newBuilding);
    }

}
