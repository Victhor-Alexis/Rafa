import { useCallback, useEffect, useState } from 'react';
import { Blossoms } from './components/Blossoms';
import { CHALLENGE_DURATION_SECONDS, MAX_FINAL_ATTEMPTS } from './constants';
import { useChallengeTimer } from './hooks/useChallengeTimer';
import { EndingScreen } from './screens/EndingScreen';
import { FinalChallengeScreen } from './screens/FinalChallengeScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RiddleScreen } from './screens/RiddleScreen';
import { SuccessScreen } from './screens/SuccessScreen';
import { WaitingScreen } from './screens/WaitingScreen';
import { WarningScreen } from './screens/WarningScreen';
import { initialSession, readSession, resetSession, writeSession } from './utils/session';

export default function App() {
  const [session, setSession] = useState(readSession);
  const { stage, deadline, finalAttempts } = session;

  const expireTimer = useCallback(() => {
    setSession((current) => {
      if (current.stage === 'riddle') {
        return { ...current, stage: 'ending', deadline: null };
      }

      if (current.stage === 'waiting') {
        return { ...current, stage: 'final', deadline: null };
      }

      return current;
    });
  }, []);

  const remaining = useChallengeTimer(
    stage === 'riddle' || stage === 'waiting' ? deadline : null,
    expireTimer,
  );

  useEffect(() => {
    writeSession(session);
  }, [session]);

  function startChallenge() {
    setSession({
      stage: 'riddle',
      deadline: Date.now() + CHALLENGE_DURATION_SECONDS * 1000,
      finalAttempts: 0,
    });
  }

  function submitFinalAnswer(correct: boolean) {
    if (correct) {
      setSession((current) => ({ ...current, stage: 'success' }));
      return;
    }

    setSession((current) => {
      const nextAttempts = current.finalAttempts + 1;
      return {
        ...current,
        finalAttempts: nextAttempts,
        stage: nextAttempts >= MAX_FINAL_ATTEMPTS ? 'ending' : 'final',
      };
    });
  }

  function restartForDevelopment() {
    resetSession();
    setSession({ ...initialSession });
  }

  return (
    <main className={`page page--${stage}`}>
      <Blossoms />
      <div className="glow glow-one" aria-hidden="true" />
      <div className="glow glow-two" aria-hidden="true" />

      {stage === 'login' && (
        <LoginScreen onSuccess={() => setSession((current) => ({ ...current, stage: 'warning' }))} />
      )}
      {stage === 'warning' && (
        <WarningScreen
          onNo={() => setSession({ ...initialSession })}
          onYes={startChallenge}
        />
      )}
      {stage === 'riddle' && (
        <RiddleScreen
          remaining={remaining}
          onSolved={() => setSession((current) => {
            if (current.stage !== 'riddle') return current;
            if (!current.deadline || Date.now() >= current.deadline) {
              return { ...current, stage: 'ending', deadline: null };
            }
            return { ...current, stage: 'waiting' };
          })}
        />
      )}
      {stage === 'waiting' && <WaitingScreen remaining={remaining} />}
      {stage === 'final' && (
        <FinalChallengeScreen attempts={finalAttempts} onAttempt={submitFinalAnswer} />
      )}
      {stage === 'success' && <SuccessScreen />}
      {stage === 'ending' && <EndingScreen />}

      {import.meta.env.DEV && false && (
        <button className="dev-reset" onClick={restartForDevelopment} type="button">
          ↻ Reiniciar teste
        </button>
      )}
    </main>
  );
}
