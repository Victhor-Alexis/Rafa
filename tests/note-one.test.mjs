import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/content/noteOne.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
}).outputText;
const { NOTE_ONE_PAGES } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

const normalize = (text) => text.normalize('NFC').replace(/\s+/gu, ' ').trim();

test('a nota conserva integralmente a revisão autorizada e a ordem do texto', () => {
  const fullText = NOTE_ONE_PAGES.flatMap((page) => page.paragraphs).join('\n\n');
  // SHA-256 da base 1e37c73 sem o "Mas" de "Mas eu sentia", normalizando Unicode e espaços.
  const approvedChecksum = '30211bd97cf52194e5547132e218ac8543f5a93751ec3d6a98566cceb07a7718';
  const checksum = createHash('sha256').update(normalize(fullText), 'utf8').digest('hex');
  assert.equal(checksum, approvedChecksum);
});

test('a revisão não deixa páginas vazias nem imagens na nota', () => {
  assert.ok(NOTE_ONE_PAGES.length > 0);
  for (const page of NOTE_ONE_PAGES) {
    assert.equal(page.image, undefined);
    assert.ok(page.paragraphs.length > 0);
    assert.ok(page.paragraphs.every((paragraph) => normalize(paragraph).length > 0));
  }
});

test('a foto removida não permanece nos recursos públicos usados pelo build', async () => {
  await assert.rejects(readFile(new URL('../public/assets/Coelha.jpg', import.meta.url)), { code: 'ENOENT' });
});
