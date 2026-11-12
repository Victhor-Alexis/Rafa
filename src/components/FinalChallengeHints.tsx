import { useId } from 'react';
import { MAX_FINAL_ATTEMPTS } from '../constants';

interface FinalChallengeHintsProps {
  attempts: number;
}

const HINTS = [
  {
    id: 'first-error',
    title: 'Dica após o 1º erro',
    message: 'Essa melodia você conhece bem… a escolha não foi por acaso.',
  },
  {
    id: 'second-error',
    title: 'Dica após o 2º erro',
    message: 'Toque a melodia antes... mulher afobada 😅',
  },
] as const;

/** Deriva as dicas dos erros já salvos, sem registrar ou consumir tentativas. */
export function FinalChallengeHints({ attempts }: FinalChallengeHintsProps) {
  const componentId = useId();

  if (!Number.isInteger(attempts) || attempts < 1 || attempts >= MAX_FINAL_ATTEMPTS) return null;

  return (
    <div className="final-attempt-hints" aria-live="polite" aria-relevant="additions text">
      {HINTS.slice(0, attempts).map((hint) => {
        const titleId = `${componentId}-${hint.id}-title`;
        return (
          <section className="final-attempt-hint" key={hint.id} aria-labelledby={titleId}>
            <h3 id={titleId}>{hint.title}</h3>
            <p>{hint.message}</p>
          </section>
        );
      })}
    </div>
  );
}
