export const DRIVING_SETTINGS_KEY = 'swipe-out-driving-settings';
export const DEFAULT_DRIVING_SETTINGS = Object.freeze({ handling: 'swipeout', camera: 'auto', assist: 1 });

export function normalizeDrivingSettings(value) {
  return { handling: value?.handling === 'wipeout' ? 'wipeout' : 'swipeout',
    camera: ['auto', 'swipeout', 'wipeout'].includes(value?.camera) ? value.camera : 'auto',
    assist: [0, 0.5, 1].includes(value?.assist) ? value.assist : 1 };
}
export function loadDrivingSettings(storage) {
  try { return normalizeDrivingSettings(JSON.parse(storage.getItem(DRIVING_SETTINGS_KEY))); }
  catch { return { ...DEFAULT_DRIVING_SETTINGS }; }
}
export function saveDrivingSettings(storage, value) {
  try { storage.setItem(DRIVING_SETTINGS_KEY, JSON.stringify(normalizeDrivingSettings(value))); return true; }
  catch { return false; }
}
export function cameraProfile(settings) { return settings.camera === 'auto' ? settings.handling : settings.camera; }

export function readClassicGamepad(gamepad) {
  const axis = i => {
    const value = gamepad?.axes?.[i] || 0, magnitude = Math.abs(value);
    return magnitude < 0.12 ? 0 : Math.sign(value) * Math.pow(Math.min(1, (magnitude - 0.12) / 0.88), 1.3);
  };
  const button = i => Math.min(1, Math.max(0, gamepad?.buttons?.[i]?.value || (gamepad?.buttons?.[i]?.pressed ? 1 : 0)));
  return { steer: axis(0) || button(15) - button(14), pitch: axis(1),
    thrust: button(0), brakeLeft: Math.max(button(4), button(6)), brakeRight: Math.max(button(5), button(7)) };
}
