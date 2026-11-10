import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { PGlite } from '@electric-sql/pglite';

const setup = await readFile(new URL('../supabase/setup.sql', import.meta.url), 'utf8');
const migration = await readFile(new URL('../supabase/upgrade_v9_riddle_attempts.sql', import.meta.url), 'utf8');
const adminId = '11111111-1111-4111-8111-111111111111';
const visitorId = '22222222-2222-4222-8222-222222222222';

test('histórico de palavras-chave preserva a rodada existente', async (t) => {
  const db = new PGlite();

  async function state() {
    return (await db.query('select to_jsonb(s) as value from public.rafa_state s where id = 1')).rows[0].value;
  }

  async function activeRiddle(overdue = false) {
    await db.exec(`
      update public.rafa_state set
        stage = 'riddle',
        deadline = now() + interval '${overdue ? '-1 minute' : '2 days'}',
        final_attempts = 0, selected_date = null, selected_time = null,
        booking_sent = false, timer_duration_seconds = 259200,
        updated_at = '2026-11-09 10:30:00+00'
      where id = 1;
    `);
  }

  async function asRole(role, userId, operation) {
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [userId || '']);
    await db.exec(`set role ${role}`);
    try {
      return await operation();
    } finally {
      await db.exec('reset role');
      await db.query("select set_config('request.jwt.claim.sub', '', false)");
    }
  }

  async function record(answer) {
    await asRole('anon', null, () => db.query('select public.rafa_record_riddle_attempt($1)', [answer]));
  }

  async function list(offset = 0) {
    return asRole('authenticated', adminId, async () => (
      await db.query('select public.rafa_admin_riddle_attempts($1) as value', [offset])
    ).rows[0].value);
  }

  try {
    // Supabase Auth mínimo, apenas neste banco PostgreSQL isolado de testes.
    await db.exec(`
      create role anon;
      create role authenticated;
      create schema auth;
      create table auth.users (id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$
        select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
      $$;
    `);
    await db.exec(setup);
    await db.query('insert into auth.users (id) values ($1), ($2)', [adminId, visitorId]);
    await db.query('insert into public.rafa_admins (user_id) values ($1)', [adminId]);
    await activeRiddle();

    await t.test('migração não muda nenhum campo nem as funções existentes do jogo', async () => {
      const before = await state();
      const existingFunctions = async () => (await db.query(`
        select proname, pg_get_functiondef(oid) as definition from pg_proc
        where pronamespace = 'public'::regnamespace
          and proname in ('rafa_get_state', 'rafa_advance', 'rafa_admin_reset', 'rafa_admin_set_timer')
        order by proname
      `)).rows;
      const functionsBefore = await existingFunctions();
      await db.exec(migration);
      assert.deepEqual(await state(), before);
      assert.deepEqual(await existingFunctions(), functionsBefore);
      assert.deepEqual(await list(), { total: 0, attempts: [] });
      assert.deepEqual(await state(), before);
    });

    await t.test('registra erros e acertos com o texto original sem tocar no prazo ou progresso', async () => {
      const before = await state();
      await record('Abacaxis');
      await record('GaSoLiNa');
      const history = await list();
      assert.equal(history.total, 2);
      assert.deepEqual(history.attempts.map((attempt) => attempt.answer), ['GaSoLiNa', 'Abacaxis']);
      assert.ok(history.attempts.every((attempt) => Number.isFinite(Date.parse(attempt.created_at))));
      assert.deepEqual(await state(), before);
    });

    await t.test('somente administrador autorizado consegue ler palavras e contagem', async () => {
      const before = await state();
      await assert.rejects(asRole('anon', null, () => db.query('select public.rafa_admin_riddle_attempts()')), /permission denied/i);
      await assert.rejects(asRole('authenticated', visitorId, () => db.query('select public.rafa_admin_riddle_attempts()')), /Acesso não autorizado/);
      await assert.rejects(asRole('anon', null, () => db.query('select * from public.rafa_riddle_attempts')), /permission denied/i);
      await assert.rejects(asRole('authenticated', adminId, () => db.query('select * from public.rafa_riddle_attempts')), /permission denied/i);
      assert.equal((await list()).total, 2);
      assert.deepEqual(await state(), before);
    });

    await t.test('paginação permite consultar todas as tentativas sem modificar a sessão', async () => {
      await db.exec('truncate public.rafa_riddle_attempts restart identity');
      const before = await state();
      await asRole('anon', null, () => db.query(`
        select public.rafa_record_riddle_attempt('palavra' || lpad(i::text, 2, '0'))
        from generate_series(1, 53) i
      `));
      const first = await list();
      const second = await list(50);
      assert.equal(first.total, 53);
      assert.equal(second.total, 53);
      assert.equal(first.attempts.length, 50);
      assert.equal(second.attempts.length, 3);
      assert.equal(first.attempts[0].answer, 'palavra53');
      assert.deepEqual(second.attempts.map((attempt) => attempt.answer), ['palavra03', 'palavra02', 'palavra01']);
      assert.equal(new Set([...first.attempts, ...second.attempts].map((attempt) => attempt.id)).size, 53);
      assert.deepEqual(await list(100), { total: 53, attempts: [] });
      assert.deepEqual(await state(), before);
    });

    await t.test('reaplicar migração conserva o histórico e todos os campos da rodada', async () => {
      const before = await state();
      const historyBefore = await list();
      await db.exec(migration);
      assert.deepEqual(await state(), before);
      assert.deepEqual(await list(), historyBefore);
    });

    await t.test('resposta correta avança normalmente e conserva o prazo em qualquer ordem de registro', async () => {
      for (const recordFirst of [true, false]) {
        await activeRiddle();
        const before = await state();
        if (recordFirst) await record('GaSoLiNa');
        await asRole('anon', null, () => db.query("select public.rafa_advance('solve_riddle', 'GaSoLiNa')"));
        const advanced = await state();
        assert.equal(advanced.stage, 'waiting');
        assert.equal(advanced.deadline, before.deadline);
        assert.deepEqual({ ...advanced, stage: before.stage, updated_at: before.updated_at }, before);
        if (!recordFirst) await record('GaSoLiNa');
        assert.deepEqual(await state(), advanced);
        assert.equal((await list()).attempts[0].answer, 'GaSoLiNa');
        assert.deepEqual(await state(), advanced);
      }
    });

    await t.test('histórico não dispara encerramento nem limpa o prazo de uma charada vencida', async () => {
      await activeRiddle(true);
      const before = await state();
      await record('Abacaxis');
      await list();
      assert.deepEqual(await state(), before);
      assert.equal((await state()).stage, 'riddle');
      assert.ok((await state()).deadline);
    });
  } finally {
    await db.close();
  }
});
