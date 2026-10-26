// One immutable snapshot per completed edit/drag, independently for each draft.
export function createHistory(initial, limit = 60, maxCharacters = 16 * 1024 * 1024) {
  let states = [JSON.stringify(initial)];
  let index = 0;
  return {
    get canUndo() { return index > 0; },
    get canRedo() { return index < states.length - 1; },
    push(value) {
      const next = JSON.stringify(value);
      if (next === states[index]) return;
      states.splice(index + 1);
      states.push(next);
      let characters = states.reduce((sum, state) => sum + state.length, 0);
      // Embedded images can make a single snapshot large. Retain at least one
      // undo step, but trim old history before it grows with every texture edit.
      while (states.length > 2 && (states.length > limit || characters > maxCharacters)) {
        characters -= states.shift().length;
      }
      index = states.length - 1;
    },
    undo() { index = Math.max(0, index - 1); return JSON.parse(states[index]); },
    redo() { index = Math.min(states.length - 1, index + 1); return JSON.parse(states[index]); },
  };
}
