export const FIRST_PASSWORD = 'miranda';
export const SECOND_PASSWORD = 'gasolina';
export const CHALLENGE_DURATION_SECONDS = 3 * 60;
export const MAX_FINAL_ATTEMPTS = 3;

export const FINAL_ANSWER = 'allofme';

// Agrupamentos fixos para a charada; o quarto grupo forma “vício”.
// A distribuição é intencional para manter a leitura no iPhone.
export const REFERENCES = [
  [
    { label: 'João 1:1' },
    { label: 'Salmos 23:4', mark: '~' },
    { label: 'Salmos 23:1' },
  ],
  [{ label: 'João 8:32', mark: '´' }],
  [
    { label: 'Isaías 41:6' },
    { label: 'Isaías 40:31' },
  ],
  [
    { label: 'Mateus 11:28' },
    { label: 'Salmos 32:8', mark: '´' },
    { label: 'Jeremias 33:3' },
    { label: 'Isaías 55:3' },
    { label: 'Salmos 27:1' },
  ],
  [
    { label: '2 Timóteo 3:16' },
    { label: 'Mateus 5:16', mark: '´' },
  ],
] as const;
