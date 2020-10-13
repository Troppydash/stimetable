import * as THREE from 'three';
import { Mesh, MeshStandardMaterial, Object3D, Quaternion, Vector3 } from 'three';
import * as similarity from 'string-similarity';

import { AdvanceSettings, BasicSettings, ColorPalette, TimeOfDay } from "./mapRendererSettingsTypes";
import { CanvasSize } from "./typesHelpers";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { OutlinePass } from "three/examples/jsm/postprocessing/OutlinePass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { ResourceTracker } from "./helpers/resourceTracker";
import { FullscreenHandler } from "./helpers/fullscreenHandler";
import TWEEN from "@tweenjs/tween.js";
import { CreatePositionTween, CreateRotationTween, IsVectorAlmostTheSame } from "./helpers/tweenHelper";
import { Interaction } from 'three.interaction';

export class MapRenderer {

    /// BASIC FIELDS ///

    // mapRenderer settings object containing basic and advance settings
    private readonly settings: {
        basic: BasicSettings,
        advance: AdvanceSettings
    };

    // refs for all important elements
    private readonly refs: {
        camera: THREE.PerspectiveCamera,
        controls: OrbitControls,
        scene: THREE.Scene,
        renderer: THREE.WebGLRenderer,

        composer?: EffectComposer,
        outlinePassSelected?: OutlinePass,
        outlinePassHover?: OutlinePass,
        renderPass?: RenderPass,
        fxaaPass?: ShaderPass,
    };

    // size of the threejs world
    private canvasSize: {
        old: CanvasSize,
        current: CanvasSize,
    };

    /// END->BASIC FIELDS ///

    /// THREEJS FIELDS ///

    // list of models add during the loadMap function
    private models: THREE.Object3D[] = [];

    // cached colors calculated from the constructor
    private colors: {
        timeOfDay: TimeOfDay,
        colorPalette: ColorPalette,
    };

    // whether this renderer has been disposed
    private disposed = false;
    // resource tracker to keep track of the materials and geometries
    private resourceTracker = new ResourceTracker();

    /// END->THREEJS FIELDS ///

    /// SELECTION FIELDS ///
    // the selected item's name
    private selectedItem?: Object3D;
    // is animation playing
    private isAnimating: boolean = false;
    private tweenID: number = -1;

    // TODO:
    // private isControlMoving: boolean = false;
    /// END->SELECTION FIELDS ///

    // FULLSCREEN HANDLER FIELDS //
    // is the canvas fullscreen
    public get isFullscreen() {
        return this.fullscreenHandler.isFullscreen;
    };

    // handler for handling fullscreen
    private fullscreenHandler: FullscreenHandler;

    /// END->FULLSCREEN HANDLER FIELDS ///

    // INTERACTION FIELDS //
    private interaction: Interaction;

    private oldMousePosition: { screenX: number, screenY: number } = { screenX: 0, screenY: 0 };
    // END->INTERACTION FIELDS //


    // constructor that sets up the mapRenderer
    constructor( basic: BasicSettings, advance: AdvanceSettings ) {
        this.settings = {
            basic,
            advance,
        }
        console.debug( this.settings );

        // SETUP //

        const { targetElement } = this.settings.basic;
        const { antialias, shadow, postprocessing } = this.settings.advance.quality;
        const { powerPreference } = this.settings.advance.performance;
        const { size } = this.settings.advance.canvas;
        const { smooth } = this.settings.advance.camera;
        const { quality } = this.settings.basic;

        const { timeDependedColors, timeDependedGetTimeOfDay } = this.settings.advance.map;
        const timeOfDay = timeDependedGetTimeOfDay();
        const colorPalette = timeDependedColors[timeOfDay];

        this.colors = {
            timeOfDay, colorPalette,
        };

        // clean up and set defaults
        {
            targetElement.innerHTML = '';
            this.canvasSize = {
                current: size,
                old: size,
            };
            this.fullscreenHandler = new FullscreenHandler( this.toggleFullscreen );
        }
        // setup refs
        {
            // RENDERER //
            const renderer = this.track( new THREE.WebGLRenderer( {
                antialias,
                powerPreference
            } ) );
            renderer.setSize( size.width, size.height );
            renderer.physicallyCorrectLights = true;
            if ( shadow ) {
                renderer.shadowMap.enabled = true;
                renderer.shadowMap.autoUpdate = false;
                renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            }
            targetElement.appendChild( renderer.domElement );

            // SCENE //
            const scene = new THREE.Scene();
            scene.background = new THREE.Color( colorPalette.skylight );

            // CAMERA //
            const camera = this.track( new THREE.PerspectiveCamera( 55, size.width / size.height, 0.1, 4000 ) );
            camera.position.set( 0, 200, 200 );
            scene.add( camera );

            // CONTROLS //
            const controls = this.track( new OrbitControls( camera, renderer.domElement ) );
            controls.rotateSpeed = 0.2;
            controls.zoomSpeed = 1;
            controls.panSpeed = 1;
            controls.enableZoom = true;

            controls.addEventListener( 'change', this.render );

            this.refs = {
                controls,
                renderer,
                camera,
                scene
            };

            this.interaction = new Interaction( renderer, scene, camera );
        }
        {
            // COMPOSER //
            if ( postprocessing ) {
                const composer = this.track( new EffectComposer( this.refs.renderer ) );
                const renderPass = this.track( new RenderPass( this.refs.scene, this.refs.camera ) );
                composer.addPass( renderPass );

                const params = {
                    edgeStrength: 4.0,
                    edgeGlow: 0.0,
                    edgeThickness: 1,
                    pulsePeriod: 0,
                };
                const outlinePass = this.track( new OutlinePass( new THREE.Vector2( size.width, size.height ), this.refs.scene, this.refs.camera ) );
                composer.addPass( outlinePass );
                outlinePass.edgeStrength = params.edgeStrength;
                outlinePass.edgeGlow = params.edgeGlow;
                outlinePass.edgeThickness = params.edgeThickness;
                outlinePass.pulsePeriod = params.pulsePeriod;
                outlinePass.visibleEdgeColor.set( colorPalette.buildings.selected );
                outlinePass.hiddenEdgeColor.set( colorPalette.buildings.selected );

                const outlinePassHover = this.track( new OutlinePass( new THREE.Vector2( size.width, size.height ), this.refs.scene, this.refs.camera ) );
                composer.addPass( outlinePassHover );
                outlinePassHover.edgeStrength = params.edgeStrength;
                outlinePassHover.edgeGlow = params.edgeGlow;
                outlinePassHover.edgeThickness = params.edgeThickness;
                outlinePassHover.pulsePeriod = params.pulsePeriod;
                outlinePassHover.visibleEdgeColor.set( colorPalette.buildings.hovered );
                outlinePassHover.hiddenEdgeColor.set( colorPalette.buildings.hovered );


                const fxaaPass = this.track( new ShaderPass( FXAAShader ) );
                fxaaPass.uniforms['resolution'].value.set( 1 / size.width, 1 / size.height );
                composer.addPass( fxaaPass );

                this.refs = {
                    ...this.refs,
                    composer,
                    renderPass,
                    outlinePassSelected: outlinePass,
                    outlinePassHover,
                    fxaaPass,
                };
            }
        }

        // setup lights
        {
            const lightShadowMultiplier = timeOfDay === TimeOfDay.night ? 3 : (Math.min( quality, 7 ) + 6);

            const topLight = this.track( new THREE.DirectionalLight( colorPalette.toplight, 4 ) );
            topLight.position.set( 0, 25 * 3, -20 * 3 );
            topLight.target.position.set( 0, 0, 0 );

            if ( shadow ) {
                // topLight.castShadow = false;
                topLight.shadow.camera.near = 18;
                topLight.shadow.camera.far = 60 * 3;
                topLight.shadow.mapSize.width = 2 ** lightShadowMultiplier;
                topLight.shadow.mapSize.height = 2 ** lightShadowMultiplier;
                topLight.shadow.bias = -0.01;

                topLight.shadow.camera.left = -100;
                topLight.shadow.camera.right = 100;
                topLight.shadow.camera.top = 175;
                topLight.shadow.camera.bottom = -100;
            }

            this.refs.scene.add( topLight );
            // this.scene.add(new THREE.CameraHelper(topLight.shadow.camera));


            // Side light
            const sidelight = this.track( new THREE.DirectionalLight( colorPalette.sunlight, 3 ) );
            sidelight.position.set( 50 * 2, 70 * 2, 120 * 2 );
            sidelight.target.position.set( 30, 0, 0, );

            if ( shadow ) {
                sidelight.castShadow = true;

                sidelight.shadow.mapSize.width = 2 ** lightShadowMultiplier;
                sidelight.shadow.mapSize.height = 2 ** lightShadowMultiplier;
                sidelight.shadow.bias = -0.01;

                sidelight.shadow.camera.left = -200;
                sidelight.shadow.camera.right = 200;
                sidelight.shadow.camera.top = 200;
                sidelight.shadow.camera.bottom = -200;

                sidelight.shadow.camera.near = 20;
                sidelight.shadow.camera.far = 450;
            }

            this.refs.scene.add( sidelight );

            // add fake sun
            const geometry = this.track( new THREE.SphereBufferGeometry( 5, 64, 64 ) );
            const material = this.track( new THREE.MeshStandardMaterial() );
            material.color.set( colorPalette.sunlight );
            material.emissive.set( colorPalette.sunlight );
            material.emissiveIntensity = 1;
            const mesh = new THREE.Mesh( geometry, material );
            mesh.position.set( sidelight.position.x, sidelight.position.y, sidelight.position.z );
            this.refs.scene.add( mesh );

            // Ambient Light
            const ambientLight = this.track( new THREE.AmbientLight( colorPalette.ambient, 1 ) );
            this.refs.scene.add( ambientLight );
        }

        this.models = [];
        this.render();

        this.loadMap()
            .then( () => {
                this.render();
                console.debug( this );
            } )
            .catch( err => {
                console.error( err );
            } );
    }

    // dispose the mapRenderer and removes its content
    public dispose() {
        this.disposed = true;

        cancelAnimationFrame( this.tweenID );

        this.resourceTracker.dispose();
        this.interaction.destroy();
        this.settings.basic.targetElement.innerHTML = '';
        this.models = [];

        this.unbindAllCallbacks();
    }


    // resize the map and camera size
    public resize( width: number, height: number ) {
        const { renderer, composer, fxaaPass, camera } = this.refs;
        this.canvasSize.current = {
            width,
            height
        };
        renderer.setSize( width, height );
        composer?.setSize( width, height );
        fxaaPass?.uniforms['resolution'].value.set( 1 / width, 1 / height );
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        this.render();
    }

    // toggle canvas fullscreen
    public toggleFullscreen = async () => {
        if ( !this.isFullscreen ) {
            // fullscreen code goes here
            this.canvasSize.old = this.canvasSize.current;
            await this.fullscreenHandler.openFullscreen();
            setTimeout( () => {
                this.resize( window.innerWidth, window.innerHeight );
            }, 50 );
        } else {
            // un-fullscreen code goes here
            this.canvasSize.current = this.canvasSize.old;
            await this.fullscreenHandler.closeFullscreen();
            this.resize( this.canvasSize.current.width, this.canvasSize.current.height );
        }
    }

    // load map into the canvas
    private loadMap() {
        const { colorPalette, timeOfDay } = this.colors;
        const { shadow } = this.settings.advance.quality;

        return new Promise( ( resolve, reject ) => {
            const loader = new GLTFLoader();
            loader.load( this.settings.basic.gltfLocation, ( gltf ) => {
                const ground: THREE.Object3D[] = [];
                const lights: THREE.Object3D[] = [];
                gltf.scene.traverse( child => {
                    if ( child instanceof THREE.PointLight ) {
                        // if is point light
                        const light = child;

                        light.castShadow = false;
                        light.intensity /= 4;
                        if ( timeOfDay !== 'night' ) {
                            lights.push( light );
                        }
                    } else if ( child instanceof THREE.Mesh && child.name.indexOf( 'Plane' ) === -1 ) {
                        // if is building

                        const building = child as THREE.Mesh;
                        const buildingMaterial = building.material as MeshStandardMaterial;
                        buildingMaterial.color.set( colorPalette.buildings.unchanged );
                        (buildingMaterial.color as any).roughness = 1;
                        if ( shadow ) {
                            building.castShadow = true;
                            building.receiveShadow = true;
                        }
                        buildingMaterial.flatShading = true;

                        const interaction = building as any;
                        interaction.cursor = 'pointer';
                        interaction.on( 'mouseover', () => { this.callback_interaction__onMouseHover(child)} );
                        interaction.on( 'mouseout', () => { this.callback_interaction__onMouseExit(child)} );
                        interaction.on( 'mousedown', ( event: any ) => {
                            const { screenX, screenY } = event.data.originalEvent;
                            child.userData['isMouseDown'] = true;
                            this.oldMousePosition = {
                                screenX,
                                screenY
                            };
                        } );
                        interaction.on( 'mouseup', ( event: any ) => {
                            const leeway = 15;
                            const { screenX, screenY } = event.data.originalEvent;
                            if ( child.userData['isMouseDown'] === true
                                && Math.abs( this.oldMousePosition.screenX - screenX ) < leeway
                                && Math.abs( this.oldMousePosition.screenY - screenY ) < leeway ) {
                                this.callback_interaction__onMouseClick( child );
                                child.userData['isMouseDown'] = undefined;
                            }
                        } );

                        // TODO: Add on click
                    } else {
                        // if is ground

                        const ground = child;
                        ground.castShadow = false;
                        ground.receiveShadow = true;
                    }
                } )


                if ( timeOfDay !== 'night' ) {
                    for ( let i = 0; i < lights.length; i++ ) {
                        const parent = lights[i].parent;
                        if ( parent ) {
                            gltf.scene.remove( parent );
                        }
                    }
                }

                if ( shadow ) {
                    this.refs.renderer.shadowMap.needsUpdate = true;
                }

                this.models = gltf.scene.children;
                this.models.forEach( model => {
                    if ( model instanceof Mesh ) {
                        this.track( model.material );
                        this.track( model.geometry );
                    }
                } )
                this.refs.scene.add( gltf.scene );
                resolve();
            }, undefined, err => {
                reject( err );
            } );
        } );
    };

    // THREE.JS main render loop
    private animate = () => {
        // const { renderer, scene, camera, composer, controls } = this.refs;
        this.tweenID = requestAnimationFrame( this.animate );

        // have to ignore this
        // @ts-ignore
        TWEEN.update();
        this.render();
    }

    private update = () => {
        this.refs.controls.update();
    }

    private render = () => {
        const { renderer, scene, camera, composer } = this.refs;
        renderer.render( scene, camera );
        composer?.render();
    }

    // track an object for disposal later, acts as a proxy for this.resourceTracker
    private track<T>( object: T ) {
        return this.resourceTracker.track( object );
    }

    // OTHERS //

    private outlineObject( building: Object3D ) {
        if ( this.settings.advance.quality.postprocessing ) {
            this.refs.outlinePassSelected!.selectedObjects = [ building ];
            this.refs.outlinePassHover!.selectedObjects = [ ];
        } else {
            ((building as Mesh).material as MeshStandardMaterial).color.set( this.colors.colorPalette.buildings.selected );
        }
        this.render();
    }

    private hoverObject ( building: Object3D) {
        if (building.name === this.selectedItem?.name) {
            return;
        }
        if ( this.settings.advance.quality.postprocessing ) {
            this.refs.outlinePassHover!.selectedObjects = [ building ];
        } else {
            ((building as Mesh).material as MeshStandardMaterial).color.set( this.colors.colorPalette.buildings.hovered );
        }
        this.render();
    }

    // focus an object with name, returns is successful
    public async focusObject( name: string ): Promise<boolean> {
        if ( this.isAnimating || name.length === 0 ) {
            return false;
        }

        this.isAnimating = true;

        if ( !this.settings.advance.quality.postprocessing && this.selectedItem ) {
            ((this.selectedItem as Mesh).material as MeshStandardMaterial).color.set( this.colors.colorPalette.buildings.unchanged );
        }

        const mostLikelyItem = this.findModelFromName( name );
        this.selectedItem = mostLikelyItem;

        /// ANIMATIONS ///

        const { camera, controls } = this.refs;

        // find positions and rotations
        const fromPos = camera.position.clone();
        const toPos = mostLikelyItem.position.clone();
        const toPosOffset = new Vector3(
            fromPos.x - toPos.x > 0 ? toPos.x + 30 : toPos.x - 30,
            toPos.y + 45,
            fromPos.z - toPos.z > 0 ? toPos.z + 30 : toPos.z - 30
        );

        const fromRot = camera.quaternion.clone();
        const oldRot = fromRot.clone();
        const oldPos = fromPos.clone();
        camera.position.set( toPosOffset.x, toPosOffset.y, toPosOffset.z );
        camera.lookAt( new THREE.Vector3( toPos.x, toPos.y, toPos.z ) );

        const toRot = camera.quaternion.clone();
        camera.position.set( oldPos.x, oldPos.y, oldPos.z );
        camera.rotation.set( oldRot.x, oldRot.y, oldRot.z );

        if ( IsVectorAlmostTheSame( controls.target, toPos ) && IsVectorAlmostTheSame( camera.position, toPosOffset ) ) {
            this.isAnimating = false;
            return true;
        }

        this.outlineObject( mostLikelyItem );

        if ( this.settings.advance.camera.smooth ) {
            this.animate();
            // tween if allows
            const rotTween = CreateRotationTween( ( t ) => {
                Quaternion.slerp( fromRot, toRot, camera.quaternion, t );
            }, () => {
                camera.quaternion.copy( toRot );
            } );
            const posTween = CreatePositionTween( fromPos, toPosOffset as Vector3, ( from ) => {
                camera.position.set( from.x, from.y, from.z );
            }, () => {
                camera.position.copy( toPosOffset );
                controls.target = toPos;
            } );
            await Promise.all( [ rotTween, posTween ] )
            this.isAnimating = false;
            cancelAnimationFrame( this.tweenID );
            return true;
        } else {
            // snaps if not allowed
            controls.target = toPos;
            camera.position.set( toPosOffset.x, toPosOffset.y, toPosOffset.z );
            this.isAnimating = false;
            this.render();
            this.update();
            return true;
        }

    }

    // find the most similar model from this.models base on their name
    private findModelFromName( name: string ): Object3D {
        name = name.toLowerCase();

        const filteredModels = this.models
            .filter( model => (model as any).material );

        let maxNumber = -1;
        let maxIndex = -1;
        filteredModels
            .map( model => modelNameMatchingPercent( name, model.name ) )
            .forEach( ( score, index ) => {
                if ( score > maxNumber ) {
                    maxNumber = score;
                    maxIndex = index;
                }
            } );

        return filteredModels[maxIndex];
    }

    // CALLBACKS //

    private unbindAllCallbacks() {
        this.refs.controls.removeEventListener( 'change', this.render );
    }

    private callback_interaction__onMouseHover = ( building: Mesh ) => {
        this.hoverObject(building);
    }

    private callback_interaction__onMouseExit = ( building: Mesh ) => {

    }

    private callback_interaction__onMouseClick = ( building: Mesh ) => {
        this.focusObject( building.name );
    }

    // private callback_control__onstart = () => {
    //     clearInterval( this.dampingID );
    // }
    //
    // private callback_control__onend = () => {
    //     let t = 0;
    //     this.dampingID = setInterval( () => {
    //         if ( t > 1500 ) {
    //             clearInterval( this.dampingID );
    //         }
    //         this.update();
    //         this.render();
    //         t += 1000 / 100;
    //     }, 1000 / 100 );
    // }
}

// returns the highest matching percent of a model's name
function modelNameMatchingPercent( name: string, modelName: string ): number {
    const list = modelName.split( '_' ).map( mName => similarity.compareTwoStrings( mName.toLowerCase(), name ) );
    let maxNumber = -1;
    list.forEach( ( score ) => {
        if ( score > maxNumber ) {
            maxNumber = score;
        }
    } )

    return maxNumber;
}
