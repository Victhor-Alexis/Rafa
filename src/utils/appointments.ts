/** Horários apresentados localmente; não representam disponibilidade em um calendário externo. */
export interface AppointmentDay {
  isoDate: string;
  label: string;
  weekday: string;
  times: string[];
}

function timeSlots(startHour: number, endHour: number): string[] {
  const slots: string[] = [];
  for (let minutes = startHour * 60; minutes <= endHour * 60; minutes += 30) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    slots.push(`${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
  }
  return slots;
}

const WEEKDAY_TIMES = timeSlots(19, 21);
const SATURDAY_TIMES = timeSlots(9, 21);

function localISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Três semanas completas, começando na próxima segunda-feira; domingos excluídos. */
export function getAppointmentDays(now = new Date()): AppointmentDay[] {
  const dates: AppointmentDay[] = [];

  // Segunda-feira seguinte, mesmo quando hoje já é segunda-feira.
  const daysUntilMonday = ((8 - now.getDay()) % 7) || 7;
  const firstMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilMonday);

  for (let offset = 0; offset < 21; offset += 1) {
    const date = new Date(firstMonday.getFullYear(), firstMonday.getMonth(), firstMonday.getDate() + offset);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0) continue;

    const times = dayOfWeek === 6 ? SATURDAY_TIMES : WEEKDAY_TIMES;

    dates.push({
      isoDate: localISODate(date),
      label: new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(date),
      weekday: new Intl.DateTimeFormat('pt-BR', { weekday: 'long' }).format(date),
      times,
    });
  }

  return dates;
}
