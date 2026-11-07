export type Stage = 'login' | 'warning' | 'riddle' | 'waiting' | 'final' | 'success' | 'ending';

interface GameSession {
  stage: Stage;
  deadline: number | null;
  finalAttempts: number;
}

const SESSION_KEY = 'rafaela-miranga-v2-session';
const LEGACY_END_KEY = 'rafaela-miranga-end';
const LEGACY_LOCK_KEY = 'rafaela-miranga-locked';

export const initialSession: GameSession = {
  stage: 'login',
  deadline: null,
  finalAttempts: 0,
};

export function readSession(): GameSession {
  // A versão anterior persistia um encerramento definitivo por engano.
  // Essas chaves antigas não interferem no novo fluxo.
  localStorage.removeItem(LEGACY_LOCK_KEY);
  sessionStorage.removeItem(LEGACY_END_KEY);

  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return { ...initialSession };

    const saved = JSON.parse(raw) as Partial<GameSession>;
    const stage = saved.stage;
    if (!stage || !['login', 'warning', 'riddle', 'waiting', 'final', 'success', 'ending'].includes(stage)) {
      return { ...initialSession };
    }

    const deadline = typeof saved.deadline === 'number' ? saved.deadline : null;
    const finalAttempts = typeof saved.finalAttempts === 'number' ? saved.finalAttempts : 0;

    if (stage === 'riddle' && (!deadline || Date.now() >= deadline)) {
      return { stage: 'ending', deadline: null, finalAttempts };
    }

    if (stage === 'waiting' && (!deadline || Date.now() >= deadline)) {
      return { stage: 'final', deadline: null, finalAttempts };
    }

    return { stage, deadline, finalAttempts };
  } catch {
    return { ...initialSession };
  }
}

export function writeSession(session: GameSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function resetSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(LEGACY_LOCK_KEY);
  sessionStorage.removeItem(LEGACY_END_KEY);
}
