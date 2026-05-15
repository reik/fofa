function applyOperations(state: number[], operations: string[]): string {
  for (const op of operations) {
    if (op === "L") {
      // Find smallest index i where state[i] === 1, set state[i-1] = 1, state[i] = 0
      const i = state.indexOf(1);
      if (i > 0) {
        state[i] = 0;
        state[i - 1] = 1;
      }
      // If i === 0 or not found (-1), do nothing
    } else {
      // "C{index}" - set state[index] = 0
      const index = parseInt(op.slice(1));
      state[index] = 0;
    }
  }

  return state.join("");
}
