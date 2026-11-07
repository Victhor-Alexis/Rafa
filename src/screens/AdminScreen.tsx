import { FormEvent, useState } from 'react';
import { GameSession } from '../utils/session';
import { resetGlobalSession, signInAdmin } from '../services/supabase';

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
            <div className="admin-detail">Tentativas usadas<strong>{session?.finalAttempts ?? '—'} de 3</strong></div>
            <div className="admin-detail">Horário escolhido<strong>{session?.selectedDate && session?.selectedTime ? `${session.selectedDate} às ${session.selectedTime}` : 'Ainda não escolhido'}</strong></div>
            <div className="admin-detail">Registro enviado<strong>{session?.bookingSent ? 'Sim' : 'Ainda não'}</strong></div>
          </div>
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
