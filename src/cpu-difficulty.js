export const CPU_DIFFICULTY_KEY = 'swipe-out-cpu-difficulty-v1';
export const CPU_DIFFICULTIES = Object.freeze({
  rookie: Object.freeze({ label: 'Rookie', pace: 0.88, reaction: 1.45, error: 1.65,
    anticipation: 1.35, cornerPenalty: 1.35, passingSpace: 3.2, shortcut: 0.2,
    mistakeInterval: 13, mistakeSize: 0.85, catchUp: 0.08,
    description: 'Early braking, cautious passing and less precise lines. Shared catch-up: up to 8%.' }),
  pilot: Object.freeze({ label: 'Pilot', pace: 1, reaction: 1, error: 1,
    anticipation: 1, cornerPenalty: 1, passingSpace: 2.7, shortcut: 0.5,
    mistakeInterval: 20, mistakeSize: 0.5, catchUp: 0.08,
    description: 'Balanced pace, calculated overtakes and occasional mistakes. Shared catch-up: up to 8%.' }),
  elite: Object.freeze({ label: 'Elite', pace: 1, reaction: 0.6, error: 0.35,
    anticipation: 1.1, cornerPenalty: 0.65, passingSpace: 2.4, shortcut: 0.75,
    mistakeInterval: 32, mistakeSize: 0.25, catchUp: 0.02,
    description: 'Precise lines, later braking and committed overtakes. Shared catch-up: up to 2%.' }),
});

export function cpuDifficulty(value) {
  return Object.hasOwn(CPU_DIFFICULTIES, value) ? value : 'pilot';
}
export function loadCpuDifficulty(storage) {
  try { return cpuDifficulty(storage.getItem(CPU_DIFFICULTY_KEY)); } catch { return 'pilot'; }
}
export function saveCpuDifficulty(storage, value) {
  try { storage.setItem(CPU_DIFFICULTY_KEY, cpuDifficulty(value)); return true; } catch { return false; }
}

// Repeatable choices across laps, independent of frame rate or Math.random.
export function shortcutChoice(opponent, lap) {
  const chance = Math.max(0.05, Math.min(0.95,
    opponent.ai.shortcut + (opponent.risk - 0.5) * 0.5));
  const roll = ((lap * 0.61803398875 + opponent.phase * 0.31) % 1 + 1) % 1;
  return roll < chance;
}
