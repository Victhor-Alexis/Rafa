import { useState } from 'react';
import { Countdown } from '../components/Countdown';
import { KeywordForm } from '../components/KeywordForm';
import { REFERENCES, SECOND_PASSWORD } from '../constants';
import { normalizeAnswer } from '../utils/normalizeAnswer';
import { recordRiddleAttempt } from '../services/supabase';
import { RiddleHints } from '../components/RiddleHints';
import { getRiddleHintCount } from '../utils/riddleHints';

interface RiddleScreenProps {
  remaining: number;
  deadline: number | null;
  timerDurationSeconds: number;
  onSolved: (answer: string) => void;
}

export function RiddleScreen({ remaining, deadline, timerDurationSeconds, onSolved }: RiddleScreenProps) {
  const [error, setError] = useState('');
  const unlockedHints = getRiddleHintCount(deadline, timerDurationSeconds);

  function verify(value: string) {
    // O histórico é independente: falha ou lentidão nunca bloqueia a resposta.
    void recordRiddleAttempt(value).catch(() => {});
    if (normalizeAnswer(value) === SECOND_PASSWORD) {
      onSolved(value);
    } else {
      setError('Ainda não é essa a palavra-chave. Tente novamente!');
    }
  }

  return (
    <section className="panel game-panel">
      <div className="game-head">
        <div>
          <div className="eyebrow">A CHARADA COMEÇOU</div>
          <h2>Que comecem<br /><em>os jogos.</em></h2>
        </div>
        <Countdown remaining={remaining} />
      </div>

      <p className="game-intro">
        kkkkk eita, Rafa, não tem jeito...<br />
        Que comecem os jogos. Você tem <strong>3 dias</strong>.
        Se vacilar, só olhará a terra prometida de longe ;(
      </p>

      <div className="riddle">
        <div className="riddle-label">UM ENIGMA PARA VOCÊ <span>✦</span></div>
        <p className="riddle-hint">
          “Às vezes, a mensagem não está no que se lê, mas na maneira como tudo começa”
        </p>
        <p className="version">Bíblia ACF · Almeida Corrigida Fiel</p>
        <div className="refs" aria-label="Referências bíblicas em sequência">
          {REFERENCES.map((line, rowIndex) => (
            <div className="refs-line" key={rowIndex}>
              {line.map((reference) => (
                <span className="ref" key={reference.label}>
                  <span className="ref-mark" aria-hidden="true">
                    {'mark' in reference ? reference.mark : '\u00a0'}
                  </span>
                  <span>{reference.label}</span>
                </span>
              ))}
            </div>
          ))}
        </div>
        <RiddleHints unlockedCount={unlockedHints} />
        <KeywordForm length={8} onSubmit={verify} error={error} />
      </div>
    </section>
  );
}
