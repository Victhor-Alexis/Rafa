import { useCallback, useEffect, useRef, useState } from 'react';
import { Blossoms } from './components/Blossoms';
import { useChallengeTimer } from './hooks/useChallengeTimer';
import { AdminScreen } from './screens/AdminScreen';
import { EndingScreen } from './screens/EndingScreen';
import { FinalChallengeScreen } from './screens/FinalChallengeScreen';
import { LoginScreen } from './screens/LoginScreen';
import { RiddleScreen } from './screens/RiddleScreen';
import { SuccessScreen } from './screens/SuccessScreen';
import { WaitingScreen } from './screens/WaitingScreen';
import { WarningScreen } from './screens/WarningScreen';
import { advanceGame, fetchGameSession, isSupabaseConfigured, GameAction } from './services/supabase';
import { GameSession } from './utils/session';

const POLL_INTERVAL_MS = 2500;

export default function App() {
  const [session, setSession] = useState<GameSession | null>(null);
  const [error, setError] = useState('');
  const isAdmin = window.location.pathname.replace(/\/$/, '') === '/admin';
  const inFlight = useRef(false);

  const refresh = useCallback(async () => {
    if (inFlight.current) return;
    try {
      const next = await fetchGameSession();
      setSession(next);
      setError('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o progresso.');
    }
  }, []);

  useEffect(() => {
    void refresh();
    const id = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);
    const onFocus = () => void refresh();
    const onVisible = () => { if (document.visibilityState === 'visible') void refresh(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh]);

  const advance = useCallback(async (action: GameAction, answer = '', date?: string, time?: string) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setError('');
    try {
      setSession(await advanceGame(action, answer, date, time));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o progresso.');
    } finally {
      inFlight.current = false;
    }
  }, [refresh]);

  const expireTimer = useCallback(() => { void refresh(); }, [refresh]);
  const stage = session?.stage || 'login';
  const remaining = useChallengeTimer(
    session && (stage === 'riddle' || stage === 'waiting') ? session.deadline : null,
    expireTimer,
  );

  return (
    <main className={`page page--${isAdmin ? 'admin' : stage}`}>
      <Blossoms />
      <div className="glow glow-one" aria-hidden="true" />
      <div className="glow glow-two" aria-hidden="true" />

      {!isSupabaseConfigured ? (
        <section className="panel loading-panel" role="alert">
          <h2>Configuração pendente</h2>
          <p>Configure as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY na Vercel.</p>
        </section>
      ) : isAdmin ? (
        <AdminScreen session={session} onRefresh={refresh} onReset={(updated) => setSession(updated)} />
      ) : !session ? (
        <section className="panel loading-panel" role="status">
          <p>{error || 'Carregando o desafio...'}</p>
          {error && <button className="secondary" onClick={() => void refresh()}>Tentar novamente</button>}
        </section>
      ) : (
        <>
          {stage === 'login' && <LoginScreen onSuccess={(answer) => void advance('login', answer)} />}
          {stage === 'warning' && <WarningScreen onNo={() => void advance('back')} onYes={() => void advance('start')} />}
          {stage === 'riddle' && (
            <RiddleScreen remaining={remaining} deadline={session.deadline}
              timerDurationSeconds={session.timerDurationSeconds}
              onSolved={(answer) => void advance('solve_riddle', answer)} />
          )}
          {stage === 'waiting' && <WaitingScreen remaining={remaining} />}
          {stage === 'final' && (
            <FinalChallengeScreen attempts={session.finalAttempts} onAttempt={(answer) => void advance('final_answer', answer)} />
          )}
          {stage === 'success' && <SuccessScreen session={session} onBookingSaved={(date, time) => advance('booking_sent', '', date, time)} />}
          {stage === 'ending' && <EndingScreen />}
          {error && <p className="sync-error" role="alert">{error}</p>}
        </>
      )}
    </main>
  );
}
