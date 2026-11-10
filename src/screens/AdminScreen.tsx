import { FormEvent, useEffect, useState } from 'react';
import { AdminRiddleAttempts } from '../components/AdminRiddleAttempts';
import { GameSession } from '../utils/session';
import { resetGlobalSession, saveAdminTimerDuration, signInAdmin } from '../services/supabase';

const STAGES: Record<string, string> = {
  login: 'Tela inicial', warning: 'Aviso inicial', riddle: 'Charada bíblica',
  waiting: 'Aguardando cronômetro', final: 'Desafio musical',
  success: 'Parabéns / escolha de horário', ending: 'Encerramento',
};

interface AdminScreenProps {
  session: GameSession | null;
  onRefresh: () => Promise<void>;
  onReset: (session: GameSession) => void;
}

export function AdminScreen({ session, onRefresh, onReset }: AdminScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [days, setDays] = useState(3);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [applyToCurrent, setApplyToCurrent] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    // Não sobrescreve a edição durante uma operação ou quando o formulário está focado.
    if (!session || busy) return;
    const seconds = session.timerDurationSeconds;
    setDays(Math.floor(seconds / 86400));
    setHours(Math.floor((seconds % 86400) / 3600));
    setMinutes(Math.floor((seconds % 3600) / 60));
  }, [session?.timerDurationSeconds]);

  async function saveTimer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const seconds = (days * 86400) + (hours * 3600) + (minutes * 60);
    if (!Number.isInteger(seconds) || seconds < 60 || seconds > 30 * 86400 ||
        !Number.isInteger(days) || !Number.isInteger(hours) || !Number.isInteger(minutes) ||
        days < 0 || days > 30 || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      setError('Informe um prazo entre 1 minuto e 30 dias, com horas de 0 a 23 e minutos de 0 a 59.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      onReset(await saveAdminTimerDuration(accessToken, seconds, applyToCurrent));
      setNotice(applyToCurrent
        ? 'Duração salva. O cronômetro ativo foi reiniciado a partir de agora.'
        : 'Duração salva para o próximo início do cronômetro.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar o temporizador.');
    } finally { setBusy(false); }
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const token = await signInAdmin(email, password);
      setAccessToken(token);
      setPassword('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível entrar.');
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!window.confirm('Reiniciar o desafio para todos? Essa ação não pode ser desfeita.')) return;
    setBusy(true);
    setError('');
    try {
      onReset(await resetGlobalSession(accessToken));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível reiniciar.');
    } finally { setBusy(false); }
  }

  return (
    <section className="panel admin-panel">
      <div className="eyebrow">ACOMPANHAMENTO PRIVADO</div>
      <h2>Painel <em>Rafa</em></h2>
      {!accessToken ? (
        <form onSubmit={login}>
          <label htmlFor="admin-email">E-mail do administrador</label>
          <input id="admin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label htmlFor="admin-password">Senha do administrador</label>
          <input id="admin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" className="primary" disabled={busy}>Entrar no painel</button>
        </form>
      ) : (
        <>
          <div className="admin-grid">
            <div className="admin-detail">Etapa atual<strong>{session ? STAGES[session.stage] : 'Carregando...'}</strong></div>
            <div className="admin-detail">Prazo do cronômetro<strong>{session?.deadline ? new Date(session.deadline).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'Não há prazo ativo'}</strong></div>
            <div className="admin-detail">Tentativas do desafio musical<strong>{session?.finalAttempts ?? '—'} de 3</strong></div>
            <div className="admin-detail">Horário escolhido<strong>{session?.selectedDate && session?.selectedTime ? `${session.selectedDate} às ${session.selectedTime}` : 'Ainda não escolhido'}</strong></div>
            <div className="admin-detail">Registro enviado<strong>{session?.bookingSent ? 'Sim' : 'Ainda não'}</strong></div>
          </div>
          <AdminRiddleAttempts accessToken={accessToken} />
          <form className="admin-timer-form" onSubmit={saveTimer}>
            <h3>Configurar temporizador</h3>
            <p className="admin-note">Esta duração ficará salva no Supabase e será usada quando a charada começar.</p>
            <div className="admin-duration-grid">
              <label htmlFor="timer-days">Dias
                <input id="timer-days" type="number" inputMode="numeric" min="0" max="30" step="1" required value={days} onChange={(e) => setDays(Number(e.target.value))} />
              </label>
              <label htmlFor="timer-hours">Horas
                <input id="timer-hours" type="number" inputMode="numeric" min="0" max="23" step="1" required value={hours} onChange={(e) => setHours(Number(e.target.value))} />
              </label>
              <label htmlFor="timer-minutes">Minutos
                <input id="timer-minutes" type="number" inputMode="numeric" min="0" max="59" step="1" required value={minutes} onChange={(e) => setMinutes(Number(e.target.value))} />
              </label>
            </div>
            <label className="admin-checkbox">
              <input type="checkbox" checked={applyToCurrent} onChange={(e) => setApplyToCurrent(e.target.checked)} />
              Aplicar também ao cronômetro ativo, reiniciando a contagem a partir de agora
            </label>
            <button className="primary" type="submit" disabled={busy}>Salvar duração</button>
            {notice && <p className="admin-notice" role="status">{notice}</p>}
          </form>
          <div className="choices">
            <button className="secondary" type="button" onClick={() => void onRefresh()}>Atualizar</button>
            <button className="secondary" type="button" disabled={busy} onClick={() => void reset()}>Reiniciar tudo</button>
          </div>
          <p className="admin-note">Atualização automática a cada 2,5 segundos. Não compartilhe o acesso de administrador.</p>
        </>
      )}
      {error && <p className="admin-error" role="alert">{error}</p>}
    </section>
  );
}
