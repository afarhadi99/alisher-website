export const INTRO_DURATION = 12000;
export const REVEAL_AT = 8000;
export function terminalFrame(ms) {
  const login = "alisher farhadi".slice(
    0,
    Math.max(0, Math.floor((ms - 4000) / 95)),
  );
  const password = "*".repeat(
    Math.max(0, Math.min(12, Math.floor((ms - 5700) / 95))),
  );
  return {
    login,
    password,
    passwordVisible: ms >= 5400,
    accepted: ms >= 7700,
    opening: ms >= 8200,
    cursor: Math.floor(ms / 450) % 2 === 0,
  };
}
