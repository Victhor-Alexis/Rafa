# Rafaela Miranga — versão 8

Aplicação React + Vite, com sessão **global** no Supabase, formulário no Formspree e painel de acompanhamento `/admin`.

## 1. Configurar o Supabase

1. No Supabase, abra **SQL Editor → New Query**, cole todo o conteúdo de `supabase/setup.sql` e clique **Run**.
2. Abra **Project Settings → API** (ou **Connect**) e copie **Project URL** e a **anon/publishable key**. **Nunca utilize a service_role/secret key no navegador.**
3. Abra **Authentication → Users**, crie seu usuário administrador (ou convide seu próprio e-mail) com uma senha forte e obtenha o **UUID** desse usuário.
4. No SQL Editor, execute, substituindo pelo seu UUID:
   ```sql
   insert into public.rafa_admins (user_id)
   values ('UUID_DA_CONTA_ADMIN');
   ```
5. Se o projeto tiver a opção de cadastro público habilitada em Authentication, desabilite-a se não for necessária. O painel utiliza e-mail e senha do Supabase Auth.

## 2. Variáveis de ambiente

Crie `.env.local` na raiz (não envie esse arquivo para o GitHub):

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-publica
VITE_FORMSPREE_FORM_ID=seu-form-id
```

Na **Vercel → Settings → Environment Variables**, cadastre as mesmas 3 variáveis para `Production` (e `Preview`, se desejar), depois faça **Redeploy**. `VITE_` é uma variável pública incorporada no JavaScript: NÃO coloque credenciais secretas nela.

## 3. Executar e publicar

```bash
npm install
npm run dev
npm run build
```

Envie as alterações para o GitHub e a Vercel fará um novo deploy. `vercel.json` garante o funcionamento do endereço `/admin` ao acessar diretamente.

## 4. Funcionamento

- Todos que acessam o link compartilham uma única sessão global.
- O prazo configurável (inicialmente 3 dias) é salvo no Supabase: fechar o navegador ou trocar de celular não pausa o relógio.
- Esgotar prazo na charada leva ao encerramento; acertar antes do prazo leva à espera e depois ao desafio musical.
- No desafio musical, há 3 tentativas globais. A resposta correta leva à agenda.
- A escolha é enviada primeiro ao Formspree e registrada no Supabase após o envio bem-sucedido.
- O painel privado está em `/admin`, com atualização a cada 2,5 segundos, autenticação por Supabase Auth e reinício administrativo.

**Atenção**: todas as pessoas com o link da página pública podem alterar o progresso, porque a sessão é compartilhada e não há identificação de visitante. Não compartilhe o link publicamente. A senha inicial e as charadas não são barreiras de segurança. O painel tem proteção de reset por UUID autorizado no banco.

**Limitação conhecida**: se o Formspree confirmar um envio e, logo depois, a gravação no Supabase falhar, o e-mail pode ter sido enviado mesmo que o site mostre erro. Nesse caso, confira o Formspree antes de reenviar. Uma solução rigorosa de envio idempotente exigiria uma função de servidor.

**Testes**: faça o percurso completo em dois dispositivos e teste `/admin` antes de compartilhar o link definitivo.

## 5. Ajustar o tempo pelo painel administrativo (v8)

**Se já executou o SQL da v7**, abra **SQL Editor → New Query** e execute
`supabase/upgrade_v8_timer.sql` **uma única vez**. Ele preserva o progresso
atual e adiciona a configuração sem apagar dados. Em uma instalação nova,
use diretamente `supabase/setup.sql` atualizado.

No endereço `/admin`, entre com sua conta autorizada em `rafa_admins`.
Escolha **dias, horas e minutos**, de **1 minuto até 30 dias** e clique em
**Salvar duração**. O valor fica salvo no Supabase e é usado na próxima vez
que a pessoa iniciar a charada. A configuração padrão é **3 dias**.

A opção **Aplicar também ao cronômetro ativo** redefine o prazo a partir
**do instante em que salvar** — isto é, substitui o tempo restante pelo total
informado, somente se a tela atual for `riddle` ou `waiting`. Deixe desmarcada
para conservar o prazo de uma rodada já iniciada.

Não é necessário mexer nas variáveis de ambiente da Vercel. Atualize o
GitHub e aguarde o deploy após executar a migração SQL no Supabase.
