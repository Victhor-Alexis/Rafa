import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';

const require = createRequire(import.meta.url);
const compiledModules = new Map();

async function loadTypeScript(relativePath, imports = {}) {
  if (!compiledModules.has(relativePath)) {
    const source = await readFile(new URL(relativePath, import.meta.url), 'utf8');
    compiledModules.set(relativePath, ts.transpileModule(source, {
      compilerOptions: {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText);
  }
  const module = { exports: {} };
  const resolveImport = (name) => Object.hasOwn(imports, name) ? imports[name] : require(name);
  new Function('require', 'module', 'exports', compiledModules.get(relativePath))(resolveImport, module, module.exports);
  return module.exports;
}

const gameConfig = await loadTypeScript('../src/config/game.ts');
const noteContent = await loadTypeScript('../src/content/noteOne.ts');
const { EndingScreen } = await loadTypeScript('../src/screens/EndingScreen.tsx', {
  '../components/NoteBook': {
    NoteBook: () => React.createElement('div', { role: 'dialog' }, 'NOTE_BOOK'),
  },
  '../content/noteOne': noteContent,
});

function savedSession(stage) {
  return {
    stage, deadline: Date.parse('2030-01-01T12:00:00Z'), finalAttempts: 0,
    selectedDate: null, selectedTime: null, bookingSent: false, timerDurationSeconds: 259200,
  };
}

async function renderApp({ pathname = '/', configured = true, freeze, session = null } = {}) {
  const deadlines = [];
  const adminProps = [];
  let appStateIndex = 0;
  const imports = {
    // Injeta apenas a sessão inicial para cobrir também um progresso já carregado.
    // Os demais hooks e o renderer são os reais; efeitos são cobertos no browser.
    react: {
      ...React,
      useState: (initial) => React.useState(appStateIndex++ === 0 ? session : initial),
    },
    './components/Blossoms': { Blossoms: () => null },
    './config/game': freeze === undefined ? gameConfig : { ...gameConfig, FREEZE_PUBLIC_GAME: freeze },
    './hooks/useChallengeTimer': {
      useChallengeTimer: (deadline) => { deadlines.push(deadline); return 1234; },
    },
    './screens/EndingScreen': { EndingScreen },
    './screens/AdminScreen': {
      AdminScreen: (props) => {
        adminProps.push(props);
        return React.createElement('div', { 'data-screen': 'AdminScreen' }, 'AdminScreen');
      },
    },
    './services/supabase': {
      isSupabaseConfigured: configured,
      fetchGameSession: async () => { throw new Error('Backend não faz parte deste teste de renderização.'); },
      advanceGame: async () => { throw new Error('Backend não faz parte deste teste de renderização.'); },
    },
  };
  for (const name of ['FinalChallengeScreen', 'LoginScreen', 'RiddleScreen', 'SuccessScreen', 'WaitingScreen', 'WarningScreen']) {
    imports[`./screens/${name}`] = {
      [name]: () => React.createElement('div', { 'data-screen': name }, name),
    };
  }
  const { default: App } = await loadTypeScript('../src/App.tsx', imports);
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { location: { pathname } } });
  try {
    return { html: renderToStaticMarkup(React.createElement(App)), deadlines, adminProps };
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else delete globalThis.window;
  }
}

function assertOnlyPublicEnding(html) {
  assert.match(html, /terra prometida/);
  assert.match(html, /Como Moisés, você pode contemplá-la de longe/);
  assert.doesNotMatch(html, /data-screen=|Carregando o desafio|Configuração pendente/);
  assert.ok(!html.includes(noteContent.NOTE_ONE_TITLE));
  assert.doesNotMatch(html, /NOTE_BOOK|role="dialog"|ending-note-trigger/);
}

test('público recebe o encerramento no primeiro render, inclusive sem configuração Supabase', async () => {
  for (const configured of [false, true]) {
    const { html, deadlines } = await renderApp({ configured });
    assertOnlyPublicEnding(html);
    assert.deepEqual(deadlines, [null]);
  }
});

test('congelamento prevalece sobre a sessão ativa e desativa o prazo da charada e da espera', async () => {
  for (const stage of ['riddle', 'waiting']) {
    const { html, deadlines } = await renderApp({ session: savedSession(stage) });
    assertOnlyPublicEnding(html);
    assert.deepEqual(deadlines, [null]);
  }
});

test('/admin e /admin/ continuam exibindo o painel com a sessão existente', async () => {
  for (const pathname of ['/admin', '/admin/']) {
    const session = savedSession('riddle');
    const { html, deadlines, adminProps } = await renderApp({ pathname, session });
    assert.match(html, /data-screen="AdminScreen"/);
    assert.doesNotMatch(html, /Como Moisés|Carregando o desafio/);
    assert.equal(adminProps.length, 1);
    assert.equal(adminProps[0].session, session);
    assert.equal(typeof adminProps[0].onRefresh, 'function');
    assert.equal(typeof adminProps[0].onReset, 'function');
    assert.deepEqual(deadlines, [session.deadline]);
  }
});

test('desativar a flag restaura o carregamento e a tela da sessão salva', async () => {
  const loading = await renderApp({ freeze: false });
  assert.match(loading.html, /Carregando o desafio/);
  assert.doesNotMatch(loading.html, /Como Moisés/);

  const session = savedSession('riddle');
  const resumed = await renderApp({ freeze: false, session });
  assert.match(resumed.html, /data-screen="RiddleScreen"/);
  assert.doesNotMatch(resumed.html, /Como Moisés/);
  assert.deepEqual(resumed.deadlines, [session.deadline]);
});

test('desativar a flag restaura o aviso normal quando o Supabase não está configurado', async () => {
  const { html } = await renderApp({ freeze: false, configured: false });
  assert.match(html, /Configuração pendente/);
  assert.match(html, /VITE_SUPABASE_URL/);
  assert.doesNotMatch(html, /Como Moisés|Carregando o desafio/);
});
