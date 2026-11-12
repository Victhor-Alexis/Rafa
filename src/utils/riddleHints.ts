const DAY_MS = 24 * 60 * 60 * 1000;
const LAST_HINT_WINDOW_MS = 12 * 60 * 60 * 1000;

/**
 * Reconstrói o início pelo prazo absoluto e pela duração salva no Supabase.
 * Pressupõe que essa duração é a mesma usada para iniciar a rodada ativa.
 * Apenas calcula a exibição: nunca altera a sessão ou o prazo.
 */
export function getRiddleHintCount(
  deadline: number | null,
  timerDurationSeconds: number,
  now = Date.now(),
): 0 | 1 | 2 {
  if (deadline === null || !Number.isFinite(deadline) || !Number.isFinite(now) ||
      !Number.isFinite(timerDurationSeconds) || timerDurationSeconds <= 0 || now >= deadline) {
    return 0;
  }

  const startedAt = deadline - timerDurationSeconds * 1000;
  const elapsed = now - startedAt;
  if (elapsed >= 2 * DAY_MS) return 2;
  if (elapsed >= DAY_MS) return 1;
  return 0;
}

/** Disponível durante as últimas 12 horas do prazo existente, inclusive ao reabrir. */
export function isLastRiddleHintAvailable(deadline: number | null, now = Date.now()): boolean {
  if (deadline === null || !Number.isFinite(deadline) || !Number.isFinite(now)) return false;
  const remaining = deadline - now;
  return remaining > 0 && remaining <= LAST_HINT_WINDOW_MS;
}
