import moment from "moment";
import { RecursivePartial } from "./typesHelpers";

/// hex color type
type HexColor = string;
/// time of day enum
export enum TimeOfDay {
    morning = "morning",
    afternoon = "afternoon",
    sunset = "sunset",
    night = "night",
}

/// basic settings
export interface BasicSettings {
    quality: number,
    targetElement: HTMLElement,
    gltfLocation: string,
    createSettingsFromQuality?: (quality: number) => RecursivePartial<MapRendererSettings>,
}

/// advance settings
export interface MapRendererSettings {
    quality: QualitySettings,
    camera: CameraSettings,
    canvas: CanvasSettings,
    mapSettings: MapSettings,
}

/// quality
interface QualitySettings {
    shadow: boolean,
    postprocessing: boolean,
}

/// camera
interface CameraSettings {
    smooth: boolean,
    autoRotate: boolean,
    autoRotateDelay: number,
}

/// canvas
interface CanvasSettings {
    width: number,
    height: number,
    fixed: boolean,
}

/// map color
interface MapSettings {
    timeDepended: boolean,
    colors: {[key in keyof typeof TimeOfDay]: ColorPalette},
    getTimeOfDay: () => TimeOfDay,
}

/// color palette
interface ColorPalette {
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

/// default settings functions and variables ///
const defaultColors = {
    morning: {
        sunlight: '#ffa24b',
        ambient: '#888',
        toplight: '#fff1e5',
        skylight: '#485e6b',

        buildings: {
            unchanged: "#8e8e8e",
            hovered: "#ffffff",
            selected: "#b82832",
        },
    },
    afternoon: {
        sunlight: '#fdfbd3',
        ambient: '#dedede',
        toplight: '#fdfbd3',
        skylight: '#87ceeb',

        buildings: {
            unchanged: "#8e8e8e",
            hovered: "#ffffff",
            selected: "#b82832",
        },
    },
    sunset: {
        sunlight: '#FDB813',
        ambient: '#ccc',
        toplight: '#d69800',
        skylight: '#f5c6a1',

        buildings: {
            unchanged: "#8e8e8e",
            hovered: "#ffffff",
            selected: "#b82832",
        },
    },
    night: {
        sunlight: '#333',
        ambient: '#222',
        toplight: '#343434',
        skylight: '#87889c',

        buildings: {
            unchanged: "#8e8e8e",
            hovered: "#ffffff",
            selected: "#b82832",
        },
    },
}

function defaultGetTimeOfDay(): TimeOfDay {
    const h = moment().hour();
    if ( h >= 5 && h < 11 ) {
        return TimeOfDay.morning;
    }
    if ( h >= 11 && h < 15 ) {
        return TimeOfDay.afternoon;
    }
    if ( h >= 15 && h < 17 ) {
        return TimeOfDay.sunset;
    }
    return TimeOfDay.night;
}

export function CreateDefaultMapRendererSettingsFromQuality(quality: number): MapRendererSettings {
    return {
        quality: {
            postprocessing: quality > 5,
            shadow: quality > 3,
        },
        camera: {
            autoRotate: false,
            autoRotateDelay: 0,
            smooth: true,
        },
        canvas: {
            height: 1024,
            width: 768,
            fixed: false
        },
        mapSettings: {
            timeDepended: true,
            colors: defaultColors,
            getTimeOfDay: defaultGetTimeOfDay
        }
    }
}

export function MergeMapRendererSettings(s1: MapRendererSettings, s2: RecursivePartial<MapRendererSettings>): MapRendererSettings {
    return {
        canvas: { ...s1.canvas, ...s2.canvas },
        mapSettings: {
            timeDepended: s2.mapSettings?.timeDepended || s1.mapSettings.timeDepended,
            getTimeOfDay: s2.mapSettings?.getTimeOfDay ? s2.mapSettings?.getTimeOfDay as () => TimeOfDay: s1.mapSettings.getTimeOfDay,
            colors: s2.mapSettings?.colors ? s2.mapSettings?.colors as {[key in keyof typeof TimeOfDay]: ColorPalette}: s1.mapSettings.colors,
        },
        camera: { ...s1.camera, ...s2.camera },
        quality: { ...s1.quality, ...s2.quality },
    }
}
