export interface BookingSubmission {
  date: string;
  weekday: string;
  time: string;
}

/** Public form ID only. Never include an account password or private API token here. */
const FORM_ID = import.meta.env.VITE_FORMSPREE_FORM_ID?.trim();

export function isFormspreeConfigured(): boolean {
  return Boolean(FORM_ID && /^[a-zA-Z0-9]+$/.test(FORM_ID));
}

export async function submitBooking(booking: BookingSubmission): Promise<void> {
  if (!isFormspreeConfigured()) {
    throw new Error('O formulário ainda não foi configurado.');
  }

  const response = await fetch(`https://formspree.io/f/${FORM_ID}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      _subject: 'Rafaela escolheu um horário ♡',
      nome: 'Rafaela Miranga',
      data: booking.date,
      dia_da_semana: booking.weekday,
      horario: booking.time,
      fuso_horario: 'America/Sao_Paulo',
      origem: 'Rafaela Miranga — desafio',
    }),
  });

  if (!response.ok) {
    throw new Error('Não foi possível registrar a escolha. Confira a conexão e tente novamente.');
  }
}
