interface CountdownProps {
  remaining: number;
}

export function Countdown({ remaining }: CountdownProps) {
  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  const pad = (value: number) => String(value).padStart(2, '0');

  // Prazo longo: dias + relógio; prazo curto: horas ou minutos + segundos.
  const formatted = days > 0
    ? `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : hours > 0
      ? `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
      : `${pad(minutes)}:${pad(seconds)}`;

  return (
    <div className={`timer ${remaining <= 30 ? 'urgent' : ''}`} role="timer" aria-label="Tempo restante">
      <small>TEMPO RESTANTE</small>
      <strong>{formatted}</strong>
    </div>
  );
}
