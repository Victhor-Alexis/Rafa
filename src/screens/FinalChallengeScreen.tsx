import { useState } from 'react';
import { KeywordForm } from '../components/KeywordForm';
import { FINAL_ANSWER, MAX_FINAL_ATTEMPTS } from '../constants';
import { normalizeAnswer } from '../utils/normalizeAnswer';

interface FinalChallengeScreenProps {
  attempts: number;
  onAttempt: (answer: string) => void;
}

export function FinalChallengeScreen({ attempts, onAttempt }: FinalChallengeScreenProps) {
  const [error, setError] = useState('');
  const remainingAttempts = MAX_FINAL_ATTEMPTS - attempts;

  function verify(value: string) {
    const correct = normalizeAnswer(value) === FINAL_ANSWER;
    if (!correct) setError('Não foi dessa vez.');
    onAttempt(value);
  }

  return (
    <section className="panel game-panel final-panel">
      <div className="eyebrow">TUDO OU NADA</div>
      <h2>Último<br /><em>desafio.</em></h2>
      <p className="game-intro">kkkk Ainda está aqui... O que acha que vai conseguir?</p>
      <p className="game-intro">
        Vamos para o tudo ou nada, logo. Dessa vez não tem o limite de tempo,
        mas são apenas <strong>3 tentativas</strong>, para compensar os 3 foras que me deu 😢
      </p>
      <p className="game-intro">Boa sorte! (Ainda tem aquele teclado?)</p>
      <div className="riddle final-riddle">
        <div className="riddle-label">DESAFIO MUSICAL <span>♫</span></div>
        <p className="music-hint">C,C,C, C#,C#,C#, C,C,C, A#,A#,A#</p>
        <p className="attempts">São <strong>notas</strong>, não acordes.</p>
        <p className="attempts">Tentativas disponíveis: <strong>{remainingAttempts}</strong></p>
        <KeywordForm length={7} onSubmit={verify} error={error} />
      </div>
    </section>
  );
}
