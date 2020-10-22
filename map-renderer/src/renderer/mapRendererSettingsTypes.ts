import { CanvasSize, RecursivePartial } from "./typesHelpers";
import { Light, Vector3 } from "three";

// hex color type
export type HexColor = string;
export type Vector = Vector3;

// time of day enum
export enum TimeOfDay {
    morning = "morning",
    afternoon = "afternoon",
    sunset = "sunset",
    night = "night",
}

// Basic settings
export interface BasicSettings {
    quality: number,
    targetElement: HTMLElement,
    gltfLocation: string,
    createSettings?: ( quality: number, existingSettings?: PartialAdvanceSettings ) => PartialAdvanceSettings,
}

// Advance settings
export interface AdvanceSettings {
    quality: QualitySettings,
    camera: CameraSettings,
    canvas: CanvasSettings,
    map: MapSettings,
    performance: PerformanceSettings,
    lighting: LightingSettings,
    misc: MiscSettings,
}

export type PartialAdvanceSettings = RecursivePartial<AdvanceSettings>;

export enum LoggingLevels {
    // logs none
    none,
    // logs error only
    error,
    // logs warning and errors
    warning,
    // logs general info
    info,
    // logs debug information
    debug,
}

export interface MiscSettings {
    logging: LoggingLevels
}

// Lighting settings
export interface LightingSettings {
    addDefaultLights: boolean,
    ambient: LightSettings,
    top: LightSettings,
    sun: LightSettings;
    sky: LightSettings;
}

export interface LightSettings {
    intensity: number,
    position: Vector,
    targetPosition: Vector
}

// Quality settings
export interface QualitySettings {
    shadow: boolean,
    antialias: boolean,
    postprocessing: boolean,
}

// Camera settings
export interface CameraSettings {
    smooth: boolean,
}

// Canvas settings
export interface CanvasSettings {
    size: CanvasSize,
    fixed: boolean,
    globalScale: number,
}

// Performance settings
export interface PerformanceSettings {
    powerPreference: 'low-power' | 'default' | 'high-performance',
}

// Map settings
export interface MapSettings {
    timeDependedColors: { [key in keyof typeof TimeOfDay]: ColorPalette },
    timeDependedGetTimeOfDay: () => TimeOfDay,
    noInteractions: boolean
}

// Color palette
export interface ColorPalette {
    sunlight: string;
    ambient: string;
    skylight: string;
    toplight: string;
}

