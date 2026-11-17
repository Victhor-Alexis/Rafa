import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import ts from 'typescript';

const source = await readFile(new URL('../src/content/noteOne.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
}).outputText;
const { NOTE_ONE_PAGES } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

const normalize = (text) => text.normalize('NFC').replace(/\s+/gu, ' ').trim();

test('a nota conserva integralmente o texto e a ordem fornecidos, independentemente das páginas', () => {
  const fullText = NOTE_ONE_PAGES.flatMap((page) => page.paragraphs).join('\n\n');
  // SHA-256 do texto original, normalizando somente Unicode e espaços em branco.
  const originalChecksum = 'f6e303ca0797433d9fbd02caba49b0d0bd089b6d2732fd4adc8d4b16d17f4f6f';
  const checksum = createHash('sha256').update(normalize(fullText), 'utf8').digest('hex');
  assert.equal(checksum, originalChecksum);
});

test('a foto aparece entre o trecho sobre as habilidades e o parágrafo iniciado por Claro', () => {
  const content = NOTE_ONE_PAGES.flatMap((page) => [
    ...(page.image ? [{ type: 'image', value: page.image }] : []),
    ...page.paragraphs.map((paragraph) => ({ type: 'text', value: normalize(paragraph) })),
  ]);
  const images = content.filter((item) => item.type === 'image');
  assert.equal(images.length, 1, 'A nota deve conter a foto fornecida uma única vez.');
  const photoIndex = content.findIndex((item) => item.type === 'image');
  const before = content[photoIndex - 1];
  const after = content[photoIndex + 1];
  assert.equal(before?.type, 'text');
  assert.match(before.value, /Nem sempre uso minhas habilidades para o bem, Deus me perdoe 😅$/u);
  assert.equal(after?.type, 'text');
  assert.match(after.value, /^Claro, não conhecia todos os detalhes/u);
});

test('toda foto referenciada existe como arquivo de imagem JPEG, PNG ou WebP', async () => {
  for (const { image } of NOTE_ONE_PAGES.filter((page) => page.image)) {
    assert.match(image.src, /^\/assets\//, 'A foto deve apontar para um recurso local público.');
    assert.ok(image.alt.trim(), 'A foto precisa de descrição acessível.');
    assert.ok(Number.isInteger(image.width) && image.width > 0);
    assert.ok(Number.isInteger(image.height) && image.height > 0);

    const bytes = await readFile(new URL(`../public${image.src}`, import.meta.url));
    const extension = path.extname(image.src).toLowerCase();
    const isJpeg = bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
    const isPng = bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
    const isWebp = bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
    assert.ok(isJpeg || isPng || isWebp, `${image.src} precisa conter uma imagem suportada.`);
    assert.ok(
      (isJpeg && ['.jpg', '.jpeg'].includes(extension)) ||
      (isPng && extension === '.png') ||
      (isWebp && extension === '.webp'),
      'A extensão da foto deve corresponder ao formato real do arquivo.',
    );
  }
});
