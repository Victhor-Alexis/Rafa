import { useId, useState } from 'react';

interface RiddleHintsProps {
  unlockedCount: number;
}

const HINTS = [
  {
    id: 'day-one',
    title: 'Pois é, já se passou um dia...',
    button: 'Preciso de uma diquinha 🐔',
    message: 'Pegue o início de cada versículo e forme uma frase',
  },
  {
    id: 'day-two',
    title: 'Dois dias...',
    button: 'Diquinha 2💅',
    message: 'A frase formada pela charada dos versos foi escrita por você, talvez só precise se lembrar do que estava falando',
  },
] as const;

/** Exibe somente dicas liberadas; abrir uma dica não altera o estado do jogo. */
export function RiddleHints({ unlockedCount }: RiddleHintsProps) {
  const componentId = useId();
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  if (unlockedCount <= 0) return null;

  return (
    <div className="riddle-hints">
      {HINTS.slice(0, unlockedCount).map((hint) => {
        const titleId = `${componentId}-${hint.id}-title`;
        const messageId = `${componentId}-${hint.id}-message`;
        const isRevealed = Boolean(revealed[hint.id]);

        return (
          <section className="riddle-hint-card" key={hint.id} aria-labelledby={titleId}>
            <h3 id={titleId}>{hint.title}</h3>
            <button
              className="secondary riddle-hint-button"
              type="button"
              aria-expanded={isRevealed}
              aria-controls={messageId}
              onClick={() => setRevealed((current) => ({ ...current, [hint.id]: true }))}
            >
              {hint.button}
            </button>
            <p className="riddle-hint-message" id={messageId} hidden={!isRevealed}>
              {hint.message}
            </p>
          </section>
        );
      })}
    </div>
  );
}
