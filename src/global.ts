export var uglySettings = {
    updatesPaused: false,
    stats: {
        died: 0,
        sacrificed: 0,
        transplanted: 0
    }
}

// parameters
export const DOCTOR_SPEED = 0.07;
export const DOCTOR_SPAWN_INTERVAL = 30000;
export const PATIENT_SPAWN_INTERVAL = 30000;
export const EASY_PATIENT_PROB = 0.3;
export const PATIENT_MISSING_ORGAN_PROB = 0.5;
export const EASY_MIN_PROBLEM_INTERVAL = 30000;
export const EASY_MAX_PROBLEM_INTERVAL = 600000;
export const HARD_MIN_PROBLEM_INTERVAL = 10000;
export const HARD_MAX_PROBLEM_INTERVAL = 40000;
export const ORGAN_TIME_TO_DECAY = 60000;
export const GRINDER_APPEAR_TIME = 120000;
export const INITIAL_ORGAN_NUMBER = 10;

// visuals
export const GAME_WIDTH = 464;
export const GAME_HEIGHT = 261;
export const HOVER_OPACITY = 0.7;
export const SELECT_OPACITY = 0.5;
export const FONT_FAMILY = 'akhbar';
export const DARK_COLOR = '#28221f';
export const LIGHT_COLOR = '#d4eded';
