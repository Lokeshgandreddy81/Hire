import { Easing } from 'react-native-reanimated';

// 🔒 MOTION SYSTEM TOKENS (LOCKED)
// Do not modify these values.

export const MOTION = {
    // Durations
    durations: {
        instant: 60,
        fast: 90,
        standard: 120,
        emphasis: 180,
        breathing: 6000,
    },

    // Easings
    easings: {
        out: Easing.bezier(0.16, 1, 0.3, 1),
        standard: Easing.bezier(0.4, 0.0, 0.2, 1),
        linear: Easing.linear,
    },

    // Scale Values
    scale: {
        pressDown: 0.985,
        enterStart: 0.98,
        enterEnd: 1.0,
    },

    // Translation
    translate: {
        revealOffsetY: 6,
        chatOffsetY: 2,
        floatOffsetY: 2, // ±2px handled in logic
    },

    // Opacity
    opacity: {
        enterStart: 0,
        enterEnd: 1,
        chatStart: 0.9,
    },
};
