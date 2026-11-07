/** Estado único armazenado no Supabase, nunca em sessionStorage/localStorage. */
export type Stage = 'login' | 'warning' | 'riddle' | 'waiting' | 'final' | 'success' | 'ending';

export interface GameSession {
  stage: Stage;
  deadline: number | null;
  finalAttempts: number;
  selectedDate: string | null;
  selectedTime: string | null;
  bookingSent: boolean;
  timerDurationSeconds: number;
}

export const initialSession: GameSession = {
  stage: 'login', deadline: null, finalAttempts: 0,
  selectedDate: null, selectedTime: null, bookingSent: false, timerDurationSeconds: 3 * 24 * 60 * 60,
};
