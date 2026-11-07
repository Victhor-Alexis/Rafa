interface CountdownProps {
  remaining: number;
}

export function Countdown({ remaining }: CountdownProps) {
  const minutes = String(Math.floor(remaining / 60)).padStart(2, '0');
  const seconds = String(remaining % 60).padStart(2, '0');

  return (
    <div className={`timer ${remaining <= 30 ? 'urgent' : ''}`} role="timer" aria-label="Tempo restante">
      <small>TEMPO RESTANTE</small>
      <strong>{minutes}:{seconds}</strong>
    </div>
  );
}
