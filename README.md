# Rafaela Miranga — versão 9

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

## 6. Histórico das palavras-chave da charada (v9)

O `/admin` mostra o total de tentativas registradas na charada bíblica e as
palavras enviadas, com data e horário de São Paulo, em páginas de 50 registros.
As tentativas do desafio musical continuam no indicador separado de 3 tentativas.
O histórico só pode ser consultado por uma conta autorizada em `rafa_admins`.

### Atualizar com uma rodada já iniciada

1. No Supabase, execute **somente** `supabase/upgrade_v9_riddle_attempts.sql`.
   Essa migração adiciona uma tabela e duas funções novas. Não modifica
   `rafa_state`, `rafa_get_state`, `rafa_advance`, o prazo ou a configuração
   do temporizador. Pode ser executada novamente sem apagar o histórico.
2. Publique o código atualizado na Vercel pelo fluxo normal do GitHub.
   Não é necessário mudar variáveis de ambiente, reiniciar o jogo ou salvar
   uma nova duração no painel. Não execute os scripts de instalação ou
   migração de versões anteriores para instalar esta funcionalidade.
3. Uma aba do jogo já aberta precisa carregar a versão nova para começar a
   registrar as tentativas. Recarregar a página mantém a etapa e a mesma data
   de vencimento salva no Supabase; o tempo continua passando normalmente.

Para conferir a rodada antes e depois da migração, faça a consulta abaixo no
SQL Editor. Ela apenas lê os dados; não use `rafa_get_state()` para essa
comparação, pois essa função faz as transições normais quando o prazo acaba.

```sql
select * from public.rafa_state where id = 1;
```

Cada confirmação válida do formulário da charada tenta registrar o texto
enviado, preservando maiúsculas e minúsculas. Digitação e respostas incompletas
não contam. O registro acontece em paralelo: uma falha de rede ou a ausência da
migração não bloqueia a resposta, o acerto nem a contagem regressiva. Por isso,
o painel contabiliza os envios que o servidor recebeu, e não garante registro
de envios feitos sem conexão. O prazo continua vencendo na data original.

Respostas erradas anteriores à atualização **não podem ser recuperadas**:
eram verificadas apenas no navegador. O histórico começa após a atualização,
é acumulado desde então e permanece salvo mesmo após o reinício de uma rodada.

### Verificar a preservação do progresso

```bash
npm test
npx tsc --noEmit
npm run build
```

Os testes SQL usam um PostgreSQL isolado em memória (PGlite), sem conectar ao
Supabase de produção, para comparar a sessão completa antes e depois da
migração, do registro e da leitura do histórico.

## 7. Dicas progressivas na charada

Na `RiddleScreen`, abaixo das referências e antes do campo da palavra-chave:

- Após **24 horas**: “Pois é, já se passou um dia...” e o botão
  “Preciso de uma diquinha 🐔”. Ao clicar, aparece “Pegue o início de cada
  versículo e forme uma frase”.
- Após **48 horas**: “Dois dias...” e o botão “Diquinha 2💅”. Ao clicar,
  aparece “A frase formada pela charada dos versos foi digitada por você,
  quando mencionou o que gostava. Ao que se referia?”.
- Nas **últimas 12 horas do prazo**: “Últimas 12 horas. Desistiu? kkkk” e
  o botão “dica 3”. Ao clicar, aparece “É o cheiro de algo”.

As dicas anteriores permanecem disponíveis quando uma nova dica é liberada.
Cada texto fica escondido até o respectivo clique. Abrir as dicas só muda a
interface local, sem novas requisições, registros de tentativas ou alterações
na sessão.

Essa atualização **não exige SQL nem novas variáveis de ambiente**. Basta
publicar o código pelo fluxo normal da Vercel. Uma aba já aberta precisa
carregar a versão nova. O prazo absoluto continua o mesmo: a publicação e
a recarga não reiniciam nem prolongam a rodada. As dicas já vencidas ficam
disponíveis imediatamente, sem esperar mais 24 ou 48 horas desde a atualização.

Para as duas primeiras dicas, o início é calculado como
`deadline - timer_duration_seconds`. Isso corresponde
ao início da rodada atual, cuja duração foi mantida desde o começo. O banco
antigo não guarda uma data de início separada: alterar apenas a duração no
admin durante uma rodada também muda os horários calculados das dicas, mesmo
se o prazo ativo não for alterado. Para reconstrução independente de futuras
edições, seria necessário guardar o início original no banco.

A terceira dica depende somente do prazo absoluto: aparece quando faltam
12 horas ou menos, enquanto ainda há tempo restante. Mesmo se a atualização
for publicada quando faltarem menos de 12 horas, o botão já ficará disponível
na primeira carga da versão nova, sem reiniciar nem estender o prazo. Em uma
rodada mais curta, ela pode aparecer antes das duas primeiras; não as libera
antecipadamente. O texto “É o cheiro de algo” continua escondido até o clique.

As dicas só são exibidas enquanto a charada tem prazo válido e não venceu.
O temporizador existente atualiza sua liberação sem recarregar a página.
Os testes de cálculo cobrem os limites exatos de 24 e 48 horas, as últimas
12 horas, recarga e prazos ausentes, inválidos ou vencidos.

## 8. Dicas por erro no desafio musical

Na tela do último desafio, as dicas aparecem automaticamente entre o contador
de tentativas e o campo da resposta, conforme os erros já salvos no Supabase:

- **Nenhum erro**: nenhuma dica.
- **Um erro**: aparece a primeira dica.
- **Dois erros**: aparecem as duas dicas, com uma tentativa restante.

A primeira permanece visível ao liberar a segunda. Uma rodada que já tem dois
erros recebe ambas ao carregar a versão nova, sem exigir outro envio. Recarregar
a página não apaga as dicas liberadas, pois a exibição deriva de `finalAttempts`,
e não de um contador local ou do momento de instalação da atualização.

Exibir ou ler as dicas não faz requisições adicionais, não registra respostas,
não gasta tentativas e não altera a sessão. O limite continua sendo de três
erros: o terceiro encerra o desafio pelo fluxo existente; acertar leva à tela
de sucesso. As dicas do desafio musical são exibidas diretamente, sem botão.

Para ativar, publique o código normalmente na Vercel e carregue a versão nova
na aba do jogo. Não é necessário executar SQL, reiniciar a rodada ou alterar
variáveis de ambiente. O histórico e o número atual de tentativas são mantidos.

Os testes de renderização cobrem zero, um e dois erros, tentativas esgotadas
e contagens inválidas, usando o componente e o limite reais do aplicativo.
