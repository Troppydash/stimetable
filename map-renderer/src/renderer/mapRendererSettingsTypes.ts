import { CanvasSize, RecursivePartial } from "./typesHelpers";

// hex color type
export type HexColor = string;

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
    createSettingsFromQuality?: ( quality: number ) => RecursivePartial<AdvanceSettings>,
}

// Advance settings
export interface AdvanceSettings {
    quality: QualitySettings,
    camera: CameraSettings,
    canvas: CanvasSettings,
    map: MapSettings,
    performance: PerformanceSettings,
    features: FeaturesSettings,
}

// Misc settings
export interface FeaturesSettings {

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
    autoRotate: boolean,
    autoRotateDelay: number,
}

// Canvas settings
export interface CanvasSettings {
    size: CanvasSize,
    fixed: boolean,
}

// Performance settings
export interface PerformanceSettings {
    powerPreference: 'low-power' | 'default' | 'high-performance',
}

// Map settings
export interface MapSettings {
    timeDependedColors: { [key in keyof typeof TimeOfDay]: ColorPalette },
    timeDependedGetTimeOfDay: () => TimeOfDay,
}

// Color palette
export interface ColorPalette {
    sunlight: string;
    ambient: string;
    skylight: string;
    toplight: string;

    buildings: {
        unchanged: HexColor,
        hovered: HexColor,
        selected: HexColor,
    },
}

