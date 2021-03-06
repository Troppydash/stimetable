import * as THREE from 'three';
import { Mesh, MeshStandardMaterial, Object3D, Quaternion, Vector3 } from 'three';
import * as similarity from 'string-similarity';

import { AdvanceSettings, BasicSettings, ColorPalette, LoggingLevels, TimeOfDay } from "./mapRendererSettingsTypes";
import { CanvasSize } from "./typesHelpers";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { ResourceTracker } from "../helpers/resourceTracker";
import { FullscreenHandler } from "../helpers/fullscreenHandler";
import TWEEN from "@tweenjs/tween.js";
import { CreatePositionTween, CreateRotationTween, IsVectorAlmostTheSame } from "../helpers/tweenHelper";
import { Interaction } from 'three.interaction';
import { Feature } from "../features";
import { ClientOffset, PageOffsetToRelOffset } from "../helpers";
import { isNotDefined } from "../helpers/javasciptHelpers";


// refs for mapRenderer
export interface MapRendererRefs {
    camera: THREE.PerspectiveCamera,
    controls: OrbitControls,
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,

    composer?: EffectComposer,
    renderPass?: RenderPass,
    fxaaPass?: ShaderPass,
}

// MapRenderer is the instance created for rendering maps and handling events
export class MapRenderer {

    /// BASIC FIELDS ///

    // mapRenderer settings object containing basic and advance settings
    public readonly settings: {
        basic: BasicSettings,
        advance: AdvanceSettings
    };

    public get targetElement() {
        return this.settings.basic.targetElement;
    }

    // refs for all important elements
    private readonly refs: MapRendererRefs;

    // size of the threejs world
    private canvasSize: {
        old: CanvasSize,
        current: CanvasSize,
    };

    public get size() {
        return this.canvasSize.current;
    }

    private readonly globalScale: number;
    /// END->BASIC FIELDS ///

    /// THREEJS FIELDS ///

    // list of models add during the loadMap function
    private models: THREE.Object3D[] = [];

    // cached colors calculated from the constructor
    private readonly colors: {
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

    private isControlMoving: boolean = false;
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

    // FEATURES //
    private features: Feature[] = [];

    // constructor that sets up the mapRenderer
    constructor( basic: BasicSettings, advance: AdvanceSettings, features: Feature[] ) {
        this.settings = {
            basic,
            advance,
        }
        this.globalScale = advance.canvas.globalScale;
        this.features = features;

        this.logMessage( 'constructor', 'Settings', this.settings, LoggingLevels.info );

        // SETUP //

        const { targetElement } = this.settings.basic;
        const { antialias, shadow, postprocessing } = this.settings.advance.quality;
        const { powerPreference } = this.settings.advance.performance;
        const { size } = this.settings.advance.canvas;
        // const { smooth } = this.settings.advance.camera;
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
                antialias: !postprocessing ? antialias : false,
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
            camera.position.set( 0, 200 * this.globalScale, 200 * this.globalScale );
            scene.add( camera );

            // CONTROLS //
            const controls = this.track( new OrbitControls( camera, renderer.domElement ) );
            controls.rotateSpeed = 0.2;
            controls.zoomSpeed = 1;
            controls.panSpeed = 1;
            controls.enableZoom = true;

            controls.addEventListener( 'change', this.render );
            controls.addEventListener( 'start', this.callback_control_onstart );
            controls.addEventListener( 'end', this.callback_control_onend );

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

                const fxaaPass = this.track( new ShaderPass( FXAAShader ) );
                fxaaPass.uniforms['resolution'].value.set( 1 / size.width, 1 / size.height );
                composer.addPass( fxaaPass );

                this.refs = {
                    ...this.refs,
                    composer,
                    renderPass,
                    fxaaPass,
                };
            }
        }

        const { ambient } = this.settings.advance.lighting;
        // setup lights
        {
            const lightShadowMultiplier = timeOfDay === TimeOfDay.night ? 3 : (Math.min( quality, 7 ) + 6);

            const topLight = this.track( new THREE.DirectionalLight( colorPalette.toplight, 4 ) );
            topLight.position.set( 0, 25 * 3, -20 * 3 );
            topLight.target.position.set( 0, 0, 0 );

            if ( shadow ) {
                // topLight.castShadow = false;
                topLight.shadow.camera.near = 18 * this.globalScale;
                topLight.shadow.camera.far = 180 * this.globalScale;
                topLight.shadow.mapSize.width = 2 ** lightShadowMultiplier;
                topLight.shadow.mapSize.height = 2 ** lightShadowMultiplier;
                topLight.shadow.bias = -0.01;

                topLight.shadow.camera.left = -100 * this.globalScale;
                topLight.shadow.camera.right = 100 * this.globalScale;
                topLight.shadow.camera.top = 175 * this.globalScale;
                topLight.shadow.camera.bottom = -100 * this.globalScale;
            }

            this.refs.scene.add( topLight );
            // this.scene.add(new THREE.CameraHelper(topLight.shadow.camera));


            // Side light
            const sidelight = this.track( new THREE.DirectionalLight( colorPalette.sunlight, 3 ) );
            sidelight.position.set( 100 * this.globalScale, 140 * this.globalScale, 240 * this.globalScale );
            sidelight.target.position.set( 30 * this.globalScale, 0, 0, );

            if ( shadow ) {
                sidelight.castShadow = true;

                sidelight.shadow.mapSize.width = 2 ** lightShadowMultiplier;
                sidelight.shadow.mapSize.height = 2 ** lightShadowMultiplier;
                sidelight.shadow.bias = -0.01;

                sidelight.shadow.camera.left = -200 * this.globalScale;
                sidelight.shadow.camera.right = 200 * this.globalScale;
                sidelight.shadow.camera.top = 200 * this.globalScale;
                sidelight.shadow.camera.bottom = -200 * this.globalScale;

                sidelight.shadow.camera.near = 20 * this.globalScale;
                sidelight.shadow.camera.far = 450 * this.globalScale;
            }

            this.refs.scene.add( sidelight );

            // add fake sun
            const geometry = this.track( new THREE.SphereBufferGeometry( 5 * this.globalScale, 64, 64 ) );
            const material = this.track( new THREE.MeshStandardMaterial() );
            material.color.set( colorPalette.sunlight );
            material.emissive.set( colorPalette.sunlight );
            material.emissiveIntensity = 1;
            const mesh = new THREE.Mesh( geometry, material );
            mesh.position.set( sidelight.position.x, sidelight.position.y, sidelight.position.z );
            this.refs.scene.add( mesh );

            // Ambient Light
            const ambientLight = this.track( new THREE.AmbientLight( colorPalette.ambient, ambient.intensity ) );
            this.refs.scene.add( ambientLight );
        }

        {
            this.runAllFeatures( (feature => {
                feature.runSetup( this.refs, this );
            }) )
        }

        this.models = [];
        this.render();
        this.logMessage('constructor', 'Hello World', undefined, LoggingLevels.info);

        this.loadMap()
            .then( () => {
                this.render();
                this.logMessage('constructor.loadMap', 'Success', this, LoggingLevels.info);
            } )
            .catch( err => {
                this.logMessage('constructor.loadMap', 'Error', err, LoggingLevels.error);
            } );
    }

    private logMessage( method: string, message: string, obj: any, level: LoggingLevels = LoggingLevels.debug ) {
        if ( level <= this.settings.advance.misc.logging ) {
            const msg = `[${LoggingLevels[level].toUpperCase()}] MapRenderer.${method}: ${message}`;
            switch ( level ) {
                case LoggingLevels.none:
                    break;
                case LoggingLevels.debug:
                    console.log( msg );
                    break;
                case LoggingLevels.warning:
                    console.warn( msg );
                    break;
                case LoggingLevels.info:
                    console.log( msg );
                    break;
                case LoggingLevels.error:
                    console.error( msg );
                    break;
            }
            if (this.settings.advance.misc.logging == LoggingLevels.debug && !isNotDefined(obj)) {
                console.log(obj);
            }
        }
    }

    // dispose the mapRenderer and removes its content
    public dispose() {
        this.disposed = true;

        cancelAnimationFrame( this.tweenID );
        this.refs.renderer.forceContextLoss();
        this.resourceTracker.dispose();
        try {
            this.interaction.destroy();
        } catch ( _ ) {
        }
        this.settings.basic.targetElement.innerHTML = '';
        this.models = [];

        this.unbindAllCallbacks();
        this.runAllFeatures( feature => feature.runCleanup() );
        this.logMessage('dispose', 'Disposed World', undefined, LoggingLevels.info);
    }


    // resize the map and camera size
    public resize( size: CanvasSize ) {
        if ( this.settings.advance.canvas.fixed ) {
            return;
        }

        const { width, height } = size;
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

        this.runAllFeatures( feature => feature.onResizeCanvas( size ) );

        this.render();
    }

    // toggle canvas fullscreen
    public toggleFullscreen = async ( newSize?: CanvasSize ) => {
        if ( this.settings.advance.canvas.fixed ) {
            return;
        }

        this.runAllFeatures( feature => feature.onToggleFullscreen( !this.isFullscreen ) );
        if ( !this.isFullscreen ) {
            // fullscreen code goes here
            if ( newSize ) {
                this.canvasSize.current = newSize;
            }
            this.canvasSize.old = this.canvasSize.current;
            await this.fullscreenHandler.openFullscreen();
            setTimeout( () => {
                this.resize( { width: window.innerWidth, height: window.innerHeight } );
            }, 50 );
        } else {
            // un-fullscreen code goes here
            if ( newSize ) {
                this.canvasSize.old = newSize;
            }
            this.canvasSize.current = this.canvasSize.old;
            await this.fullscreenHandler.closeFullscreen();
            this.resize( { width: this.canvasSize.current.width, height: this.canvasSize.current.height } );
        }
    }

    // load map into the canvas
    private loadMap() {
        const { timeOfDay } = this.colors;
        const { shadow } = this.settings.advance.quality;

        return new Promise( ( resolve, reject ) => {
            const loader = new GLTFLoader();
            loader.load( this.settings.basic.gltfLocation, ( gltf ) => {
                // const ground: THREE.Object3D[] = [];
                const lights: THREE.Object3D[] = [];
                gltf.scene.traverse( child => {
                    this.runAllFeatures( feature => {
                        feature.onTraverseChild( child );
                    } );
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
                        //buildingMaterial.color.set( colorPalette.buildings.unchanged );
                        (buildingMaterial.color as any).roughness = 1;
                        if ( shadow ) {
                            building.castShadow = true;
                            building.receiveShadow = true;
                        }
                        buildingMaterial.flatShading = true;

                        const interaction = building as any;
                        interaction.cursor = 'pointer';
                        interaction.on( 'mouseover', ( event: any ) => {
                            this.callback_interaction__onMouseHover( child, event.data.originalEvent as PointerEvent )
                        } );
                        interaction.on( 'mouseout', ( event: any ) => {
                            this.callback_interaction__onMouseExit( child, event.data.originalEvent as PointerEvent )
                        } );
                        interaction.on( 'mousemove', ( event: any ) => {
                            event = event.data.originalEvent;
                            const clientOffset: ClientOffset = {
                                clientX: event.clientX,
                                clientY: event.clientY
                            };
                            const relOffset = PageOffsetToRelOffset( this.settings.basic.targetElement, clientOffset );
                            if ( relOffset.relX >= this.size.width || relOffset.relX <= 0 ) {
                                return;
                            }
                            if ( relOffset.relY >= this.size.height || relOffset.relY <= 0 ) {
                                return;
                            }
                            this.callback_interaction__onMouseMove( child, event as PointerEvent )
                        } );
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
                                this.callback_interaction__onMouseClick( child, event.data.originalEvent as PointerEvent );
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

    // update control
    private update = () => {
        this.refs.controls.update();
    }

    // render scene
    public render = () => {
        const { renderer, scene, camera, composer } = this.refs;
        renderer.render( scene, camera );
        composer?.render();
    }

    // track an object for disposal later, acts as a proxy for this.resourceTracker
    public track<T>( object: T ) {
        return this.resourceTracker.track( object );
    }

    // OTHERS //

    public async focusBuilding( building: Object3D ): Promise<boolean> {
        if ( this.isAnimating ) {
            return false;
        }
        // if (this.selectedItem?.uuid === building.uuid) {
        //     return true;
        // }

        // this.runAllFeatures(feature => feature.onFocusBuilding(building, this.selectedItem));
        this.selectedItem = building;

        if ( this.settings.advance.map.noInteractions ) {
            this.isAnimating = false;
            return true;
        }

        this.isAnimating = true;

        /// ANIMATIONS ///

        const { camera, controls } = this.refs;

        // find positions and rotations
        const fromPos = camera.position.clone();
        const toPos = building.position.clone();
        const offsetX = 30 * this.globalScale;
        const offsetY = 45 * this.globalScale;
        const toPosOffset = new Vector3(
            fromPos.x - toPos.x > 0 ? toPos.x + offsetX : toPos.x - offsetX,
            toPos.y + offsetY,
            fromPos.z - toPos.z > 0 ? toPos.z + offsetX : toPos.z - offsetX
        );

        if ( IsVectorAlmostTheSame( controls.target, toPos ) && IsVectorAlmostTheSame( camera.position, toPosOffset ) ) {
            this.isAnimating = false;
            return true;
        }

        const fromRot = camera.quaternion.clone();
        const oldRot = fromRot.clone();
        const oldPos = fromPos.clone();
        camera.position.set( toPosOffset.x, toPosOffset.y, toPosOffset.z );
        camera.lookAt( new THREE.Vector3( toPos.x, toPos.y, toPos.z ) );

        const toRot = camera.quaternion.clone();
        camera.position.set( oldPos.x, oldPos.y, oldPos.z );
        camera.rotation.set( oldRot.x, oldRot.y, oldRot.z );


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

    // focus an object with name, returns is successful
    public async focusBuildingByName( name: string ): Promise<boolean> {
        if ( this.isAnimating || name.length === 0 ) {
            return false;
        }
        const mostLikelyItem = this.findModelFromName( name );
        this.runAllFeatures( feature => feature.onFocusBuilding( mostLikelyItem, this.selectedItem ) );
        return this.focusBuilding( mostLikelyItem );
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

    private runAllFeatures( fn: ( feature: Feature ) => void ) {
        this.features.forEach( fn );
    }

    // CALLBACKS //

    private unbindAllCallbacks() {
        this.refs.controls.removeEventListener( 'change', this.render );
    }

    private callback_interaction__onMouseHover = ( building: Mesh, event: PointerEvent ) => {
        if ( this.isControlMoving ) {
            return;
        }
        this.runAllFeatures( feature => feature.onHoverBuilding( building, event ) );
    }

    private callback_interaction__onMouseExit = ( building: Mesh, event: PointerEvent ) => {
        if ( this.isControlMoving ) {
            return;
        }
        this.runAllFeatures( feature => feature.onExitBuilding( building, event ) );
    }

    private callback_interaction__onMouseClick = ( building: Mesh, event: PointerEvent ) => {
        this.focusBuilding( building );
        this.runAllFeatures( feature => feature.onClickBuilding( building, event ) );
    }

    private callback_interaction__onMouseMove = ( building: Mesh, event: PointerEvent ) => {
        if ( this.isControlMoving ) {
            return;
        }
        this.runAllFeatures( feature => feature.onMoveBuilding( building, event ) );
    }

    private callback_control_onstart = () => {
        this.isControlMoving = true;
        this.runAllFeatures( feature => feature.onControlStart() );
    }

    private callback_control_onend = () => {
        this.isControlMoving = false;
        this.runAllFeatures( feature => feature.onControlEnd() );
    }
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


