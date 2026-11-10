import { GameSession, Stage } from '../utils/session';

const url = (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
const apiKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(url && apiKey && !url.includes('SEU_PROJETO'));

interface RemoteSession {
  stage: Stage;
  deadline: string | null;
  final_attempts: number;
  selected_date: string | null;
  selected_time: string | null;
  booking_sent: boolean;
  timer_duration_seconds: number;
}

function fromRemote(remote: RemoteSession): GameSession {
  return {
    stage: remote.stage,
    deadline: remote.deadline ? new Date(remote.deadline).getTime() : null,
    finalAttempts: remote.final_attempts,
    selectedDate: remote.selected_date,
    selectedTime: remote.selected_time,
    bookingSent: remote.booking_sent,
    timerDurationSeconds: remote.timer_duration_seconds,
  };
}

async function post<T>(path: string, body: unknown, accessToken?: string): Promise<T> {
  if (!isSupabaseConfigured) throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.');
  const response = await fetch(`${url}${path}`, {
    method: 'POST',
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${accessToken || apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.message || result?.error_description || 'Falha ao conectar com o Supabase.');
  return result as T;
}

export async function fetchGameSession(): Promise<GameSession> {
  return fromRemote(await post<RemoteSession>('/rest/v1/rpc/rafa_get_state', {}));
}

export type GameAction = 'login' | 'back' | 'start' | 'solve_riddle' | 'final_answer' | 'booking_sent';

export async function advanceGame(action: GameAction, answer = '', date?: string, time?: string): Promise<GameSession> {
  const result = await post<RemoteSession>('/rest/v1/rpc/rafa_advance', {
    p_action: action, p_answer: answer, p_date: date || null, p_time: time || null,
  });
  return fromRemote(result);
}

interface AuthResponse { access_token: string; }

export async function signInAdmin(email: string, password: string): Promise<string> {
  const result = await post<AuthResponse>('/auth/v1/token?grant_type=password', { email, password });
  return result.access_token;
}

export async function resetGlobalSession(accessToken: string): Promise<GameSession> {
  return fromRemote(await post<RemoteSession>('/rest/v1/rpc/rafa_admin_reset', {}, accessToken));
}

/** Configuração privada; opcionalmente redefine o prazo ativo a partir do horário do servidor. */
export async function saveAdminTimerDuration(
  accessToken: string,
  seconds: number,
  applyToCurrent: boolean,
): Promise<GameSession> {
  return fromRemote(await post<RemoteSession>('/rest/v1/rpc/rafa_admin_set_timer', {
    p_duration_seconds: seconds,
    p_apply_to_current: applyToCurrent,
  }, accessToken));
}

export interface RiddleAttempt {
  id: number;
  answer: string;
  created_at: string;
}

export interface RiddleAttemptsPage {
  total: number;
  attempts: RiddleAttempt[];
}

/** Histórico separado da sessão: não avança etapas nem altera o cronômetro. */
export async function recordRiddleAttempt(answer: string): Promise<void> {
  await post('/rest/v1/rpc/rafa_record_riddle_attempt', { p_answer: answer });
}

export async function fetchRiddleAttempts(accessToken: string, offset = 0): Promise<RiddleAttemptsPage> {
  return post<RiddleAttemptsPage>('/rest/v1/rpc/rafa_admin_riddle_attempts', {
    p_offset: offset,
  }, accessToken);
}
