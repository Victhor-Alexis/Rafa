/** Ignora caixa, espaços extras e diferenças de normalização Unicode. */
export function normalizeAnswer(value: string): string {
  return value.trim().normalize('NFC').toLocaleLowerCase('pt-BR');
}
