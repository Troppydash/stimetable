import dayjs from "dayjs";
import { RecursivePartial } from "./typesHelpers";
import { AdvanceSettings, ColorPalette, LightingSettings, TimeOfDay } from "./mapRendererSettingsTypes";

/// default settings functions and variables ///
export const defaultColors = {
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
};

// Default GetTimeOfDay function
function defaultGetTimeOfDay(): TimeOfDay {
    const h = dayjs().hour();
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

// Default advance settings from quality function
export function CreateDefaultMapRendererSettingsFromQuality( quality: number ): AdvanceSettings {
    return {
        quality: {
            postprocessing: quality > 6,
            shadow: quality > 3,
            antialias: quality > 3,
        },
        camera: {
            smooth: true,
        },
        canvas: {
            size: {
                height: 1024,
                width: 768,
            },
            fixed: false,
            globalScale: 1,
        },
        map: {
            timeDependedColors: defaultColors,
            timeDependedGetTimeOfDay: defaultGetTimeOfDay,
            noInteractions: false,
        },
        performance: {
            powerPreference: 'default'
        },
        lighting: {
            ambient: {
                intensity: 1
            }
        }
    }
}

// deep merge two objects
// hopefully this works
function deepAssign(target: any, ...sources: any) {
    for (const source of sources) {
        for (const k in source) {
            let vs = source[k], vt = target[k]
            if (Object(vs) == vs && Object(vt) === vt) {
                target[k] = deepAssign(vt, vs)
                continue
            }
            target[k] = source[k]
        }
    }
    return target
}

// Merge two advance settings object together with s2 overriding s1
export function MergeMapRendererSettings( s1: AdvanceSettings, s2: RecursivePartial<AdvanceSettings> ): AdvanceSettings {
    return deepAssign(s1, s2);
    // return {
    //     canvas: {
    //         fixed: s2.canvas?.fixed || s1.canvas?.fixed,
    //         size: { ...s1.canvas.size, ...s2.canvas?.size },
    //         globalScale: s2.canvas?.globalScale || s1.canvas.globalScale,
    //     },
    //     map: {
    //         timeDependedGetTimeOfDay: s2.map?.timeDependedGetTimeOfDay ? s2.map?.timeDependedGetTimeOfDay as () => TimeOfDay : s1.map.timeDependedGetTimeOfDay,
    //         timeDependedColors: s2.map?.timeDependedColors ? s2.map?.timeDependedColors as { [key in keyof typeof TimeOfDay]: ColorPalette } : s1.map.timeDependedColors,
    //     },
    //     camera: { ...s1.camera, ...s2.camera },
    //     quality: { ...s1.quality, ...s2.quality },
    //     performance: { ...s1.performance, ...s2.performance },
    //     lighting: { ...s1.lighting as LightingSettings, ...s2.lighting as LightingSettings }
    // }
}
