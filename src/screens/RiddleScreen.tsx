import { useState } from 'react';
import { Countdown } from '../components/Countdown';
import { KeywordForm } from '../components/KeywordForm';
import { REFERENCES, SECOND_PASSWORD } from '../constants';
import { normalizeAnswer } from '../utils/normalizeAnswer';

interface RiddleScreenProps {
  remaining: number;
  onSolved: (answer: string) => void;
}

export function RiddleScreen({ remaining, onSolved }: RiddleScreenProps) {
  const [error, setError] = useState('');

  function verify(value: string) {
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
        Que comecem os jogos. Você tem <strong>3 minutos</strong>.
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
        <KeywordForm length={8} onSubmit={verify} error={error} />
      </div>
    </section>
  );
}
