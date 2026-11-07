import { useEffect, useState } from 'react';

/** Usa um prazo absoluto para que recarregar a página não reinicie a contagem. */
export function useChallengeTimer(deadline: number | null, onExpire: () => void): number {
  const [remaining, setRemaining] = useState(() => secondsUntil(deadline));

  useEffect(() => {
    if (deadline === null) return;

    function update() {
      const seconds = secondsUntil(deadline);
      setRemaining(seconds);
      if (seconds === 0) onExpire();
    }

    update();
    const interval = window.setInterval(update, 250);
    return () => window.clearInterval(interval);
  }, [deadline, onExpire]);

  return remaining;
}

function secondsUntil(deadline: number | null): number {
  if (!deadline) return 0;
  return Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
}
