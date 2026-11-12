import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

// Usa o TypeScript já instalado para executar o cálculo real sem build em disco.
const source = await readFile(new URL('../src/utils/riddleHints.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
}).outputText;
const { getRiddleHintCount, isLastRiddleHintAvailable } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

const DAY = 24 * 60 * 60 * 1000;
const start = Date.parse('2026-11-08T15:00:00Z');
const duration = 3 * DAY / 1000;
const deadline = start + 3 * DAY;

test('nenhuma dica antes de completar 24 horas da rodada', () => {
  for (const now of [start - 1, start, start + DAY - 1]) {
    assert.equal(getRiddleHintCount(deadline, duration, now), 0);
  }
});

test('primeira dica disponível exatamente em 24 horas; segunda continua escondida', () => {
  assert.equal(getRiddleHintCount(deadline, duration, start + DAY), 1);
  assert.equal(getRiddleHintCount(deadline, duration, start + 2 * DAY - 1), 1);
});

test('ambas disponíveis exatamente em 48 horas e até o vencimento', () => {
  assert.equal(getRiddleHintCount(deadline, duration, start + 2 * DAY), 2);
  assert.equal(getRiddleHintCount(deadline, duration, deadline - 1), 2);
});

test('reabrir depois dos marcos usa o prazo salvo, sem contar a partir do acesso', () => {
  assert.equal(getRiddleHintCount(deadline, duration, start + 30 * 60 * 60 * 1000), 1);
  assert.equal(getRiddleHintCount(deadline, duration, start + 60 * 60 * 60 * 1000), 2);
});

test('prazo inválido, ausente ou vencido não libera dicas', () => {
  for (const invalid of [null, NaN, Infinity, -Infinity]) {
    assert.equal(getRiddleHintCount(invalid, duration, start + DAY), 0);
  }
  assert.equal(getRiddleHintCount(deadline, duration, deadline), 0);
  assert.equal(getRiddleHintCount(deadline, duration, deadline + DAY), 0);
  assert.equal(getRiddleHintCount(deadline, duration, NaN), 0);
});

test('duração inválida ou rodada curta não libera dicas prematuramente', () => {
  for (const invalid of [0, -1, NaN, Infinity, undefined]) {
    assert.equal(getRiddleHintCount(deadline, invalid, start + 2 * DAY), 0);
  }
  assert.equal(getRiddleHintCount(start + 60_000, 60, start + 59_999), 0);
  assert.equal(getRiddleHintCount(start + DAY, DAY / 1000, start + DAY - 1), 0);
});

test('marcos são 24 e 48 horas decorridas, inclusive em durações maiores e fusos diferentes', () => {
  const longDeadline = start + 30 * DAY;
  assert.equal(getRiddleHintCount(longDeadline, 30 * DAY / 1000, start + DAY), 1);
  assert.equal(getRiddleHintCount(longDeadline, 30 * DAY / 1000, start + 2 * DAY), 2);
  assert.equal(Date.parse('2026-11-09T12:00:00-03:00'), start + DAY);
});

test('terceira dica escondida antes das últimas 12 horas e disponível no limite exato', () => {
  const twelveHours = 12 * 60 * 60 * 1000;
  assert.equal(isLastRiddleHintAvailable(deadline, deadline - twelveHours - 1), false);
  assert.equal(isLastRiddleHintAvailable(deadline, deadline - twelveHours), true);
  assert.equal(isLastRiddleHintAvailable(deadline, deadline - twelveHours + 1), true);
});

test('terceira dica já disponível ao carregar com menos de 12 horas restantes', () => {
  assert.equal(isLastRiddleHintAvailable(deadline, deadline - 11 * 60 * 60 * 1000), true);
  assert.equal(isLastRiddleHintAvailable(deadline, deadline - 60_000), true);
  assert.equal(isLastRiddleHintAvailable(deadline, deadline - 1), true);
});

test('terceira dica não aparece após o vencimento ou com prazo inválido', () => {
  assert.equal(isLastRiddleHintAvailable(deadline, deadline), false);
  assert.equal(isLastRiddleHintAvailable(deadline, deadline + 1), false);
  for (const invalid of [null, NaN, Infinity, -Infinity]) {
    assert.equal(isLastRiddleHintAvailable(invalid, deadline - 60_000), false);
  }
  for (const invalidNow of [NaN, Infinity, -Infinity]) {
    assert.equal(isLastRiddleHintAvailable(deadline, invalidNow), false);
  }
});

test('janela final independe da duração configurada e não libera dicas de dias antes da hora', () => {
  const now = start + 30 * 60 * 1000;
  const shortDeadline = start + 60 * 60 * 1000;
  assert.equal(getRiddleHintCount(shortDeadline, 3600, now), 0);
  assert.equal(isLastRiddleHintAvailable(shortDeadline, now), true);
  assert.equal(getRiddleHintCount(deadline, undefined, deadline - 60_000), 0);
  assert.equal(isLastRiddleHintAvailable(deadline, deadline - 60_000), true);
});
