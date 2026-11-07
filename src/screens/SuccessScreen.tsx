import { useMemo, useState } from 'react';
import { isFormspreeConfigured, submitBooking } from '../services/formspree';
import { getAppointmentDays } from '../utils/appointments';
import { GameSession } from '../utils/session';

interface SuccessScreenProps {
  session: GameSession;
  onBookingSaved: (date: string, time: string) => Promise<void>;
}

export function SuccessScreen({ session, onBookingSaved }: SuccessScreenProps) {
  const days = useMemo(() => getAppointmentDays(), []);
  const [selectedDate, setSelectedDate] = useState<string | null>(session.selectedDate);
  const [selectedTime, setSelectedTime] = useState<string | null>(session.selectedTime);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>(session.bookingSent ? 'sent' : 'idle');
  const [error, setError] = useState<string | null>(null);

  const day = days.find((item) => item.isoDate === selectedDate);
  const isLocked = status === 'sending' || status === 'sent' || session.bookingSent;

  function selectDay(isoDate: string) {
    if (isLocked) return;
    setSelectedDate(isoDate);
    setSelectedTime(null);
    setError(null);
  }

  async function confirmBooking() {
    if (!day || !selectedTime || isLocked) return;

    setStatus('sending');
    setError(null);

    try {
      await submitBooking({
        date: day.isoDate,
        weekday: day.weekday,
        time: selectedTime,
      });
      await onBookingSaved(day.isoDate, selectedTime);
      setStatus('sent');
    } catch (cause) {
      setStatus('idle');
      setError(cause instanceof Error ? cause.message : 'Não foi possível registrar a escolha.');
    }
  }

  return (
    <section className="panel game-panel success-panel">
      <div className="success-heading">
        <div className="seal">♡</div>
        <div className="eyebrow">MISSÃO CUMPRIDA</div>
        <h2>Parabéns,<br /><em>parabéns!</em></h2>
        <p className="game-intro">Se chegou até aqui, merece tudo.</p>
        <blockquote className="rose-quote">“Foi o tempo que dedicaste à tua rosa que a fez tão importante.”</blockquote>
        <p className="success-instruction">Escolha o dia e horário disponíveis:</p>
      </div>

      <div className="booking-section">
        <h3>1. Escolha o dia</h3>
        <p className="booking-caption">Próximas 3 semanas · segunda a sábado</p>
        <div className="day-grid" role="group" aria-label="Dias disponíveis">
          {days.map((item) => (
            <button
              key={item.isoDate}
              type="button"
              disabled={isLocked}
              className={`option-button day-option${selectedDate === item.isoDate ? ' selected' : ''}`}
              aria-pressed={selectedDate === item.isoDate}
              onClick={() => selectDay(item.isoDate)}
            >
              <span className="day-name">{item.weekday}</span>
              <strong>{item.label}</strong>
            </button>
          ))}
        </div>
      </div>

      {day && (
        <div className="booking-section">
          <h3>2. Escolha o horário</h3>
          <p className="booking-caption">
            {day.weekday === 'sábado' ? 'Sábado · 09:00 às 21:00' : 'Dia de semana · 19:00 às 21:00'}
          </p>
          <div className="time-grid" role="group" aria-label="Horários disponíveis">
            {day.times.map((time) => (
              <button
                key={time}
                type="button"
                disabled={isLocked}
                className={`option-button time-option${selectedTime === time ? ' selected' : ''}`}
                aria-pressed={selectedTime === time}
                onClick={() => {
                  setSelectedTime(time);
                  setError(null);
                }}
              >
                {time}
              </button>
            ))}
          </div>
        </div>
      )}

      {day && selectedTime && (
        <div className="booking-summary">
          <p><strong>Sua escolha:</strong> {day.weekday}, {day.label}, às {selectedTime}.</p>

          {status === 'sent' || session.bookingSent ? (
            <p className="booking-confirmation" role="status">
              ♡ Sua escolha foi enviada com sucesso! Agora é só aguardar.
            </p>
          ) : (
            <button
              className="primary"
              type="button"
              disabled={status === 'sending' || !isFormspreeConfigured()}
              onClick={confirmBooking}
            >
              {status === 'sending' ? 'Enviando...' : 'Confirmar escolha ♡'}
            </button>
          )}

          {!isFormspreeConfigured() && (
            <p className="booking-error" role="alert">
              Formulário não configurado. Defina VITE_FORMSPREE_FORM_ID no arquivo .env.local.
            </p>
          )}
          {error && <p className="booking-error" role="alert">{error}</p>}
          <small>A escolha será enviada para confirmação. Os horários exibidos não são sincronizados com uma agenda.</small>
        </div>
      )}
    </section>
  );
}
