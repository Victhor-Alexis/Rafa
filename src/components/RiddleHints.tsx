import { useId, useState } from 'react';

interface RiddleHintsProps {
  unlockedCount: number;
  lastHintAvailable: boolean;
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
    message: 'A frase formada pela charada dos versos foi digitada por você, quando mencionou o que gostava. Ao que se referia?',
  },
] as const;

const LAST_HINT = {
  id: 'last-hours',
  title: 'Últimas 12 horas. Desistiu? kkkk',
  button: 'dica 3',
  message: 'É o cheiro de algo',
} as const;

/** Exibe somente dicas liberadas; abrir uma dica não altera o estado do jogo. */
export function RiddleHints({ unlockedCount, lastHintAvailable }: RiddleHintsProps) {
  const componentId = useId();
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const visibleHints = [
    ...HINTS.slice(0, Math.max(0, unlockedCount)),
    ...(lastHintAvailable ? [LAST_HINT] : []),
  ];

  if (visibleHints.length === 0) return null;

  return (
    <div className="riddle-hints">
      {visibleHints.map((hint) => {
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
