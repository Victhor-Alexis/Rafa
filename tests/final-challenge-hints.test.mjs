import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);

// Executa o componente e a constante reais usando o TypeScript já instalado.
async function loadTypeScript(relativePath, imports = {}) {
  const source = await readFile(new URL(relativePath, import.meta.url), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  const module = { exports: {} };
  const resolveImport = (name) => Object.hasOwn(imports, name) ? imports[name] : require(name);
  new Function('require', 'module', 'exports', compiled)(resolveImport, module, module.exports);
  return module.exports;
}

const constants = await loadTypeScript('../src/constants.ts');
const { MAX_FINAL_ATTEMPTS } = constants;
const { FinalChallengeHints } = await loadTypeScript('../src/components/FinalChallengeHints.tsx', {
  '../constants': constants,
});

const renderHints = (attempts) => renderToStaticMarkup(createElement(FinalChallengeHints, { attempts }));

test('nenhuma dica aparece antes do primeiro erro', () => {
  assert.equal(renderHints(0), '');
});

test('primeiro erro mostra somente a primeira dica', () => {
  const html = renderHints(1);
  assert.match(html, /Dica após o 1º erro/);
  assert.doesNotMatch(html, /Dica após o 2º erro/);
  assert.equal((html.match(/<section\b/g) || []).length, 1);
  assert.match(html, /<p>[^<]+<\/p>/);
});

test('carregar com dois erros salvos já mostra as duas dicas, sem esperar outro envio', () => {
  const html = renderHints(2);
  assert.match(html, /Dica após o 1º erro/);
  assert.match(html, /Dica após o 2º erro/);
  assert.ok(html.indexOf('Dica após o 1º erro') < html.indexOf('Dica após o 2º erro'));
  assert.equal((html.match(/<p>[^<]+<\/p>/g) || []).length, 2);
});

test('tentativas esgotadas não mostram dicas', () => {
  for (const attempts of [MAX_FINAL_ATTEMPTS, MAX_FINAL_ATTEMPTS + 1, Number.MAX_SAFE_INTEGER]) {
    assert.equal(renderHints(attempts), '', `tentativas: ${attempts}`);
  }
});

test('contagens inválidas não liberam dicas', () => {
  for (const attempts of [-1, -10, 0.5, 1.5, 2.5, NaN, Infinity, -Infinity]) {
    assert.equal(renderHints(attempts), '', `tentativas: ${attempts}`);
  }
});
