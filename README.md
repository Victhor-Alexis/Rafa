# Rafaela Miranga — React + TypeScript + Vite

## Rodar localmente

```bash
npm install
cp .env.example .env.local
npm run dev
```

No Windows, copie manualmente `.env.example` para `.env.local`.

## Configurar recebimento por e-mail (Formspree)

1. Acesse [Formspree](https://formspree.io/) e crie um **New Form**.
2. Escolha o e-mail que receberá as submissões e conclua a confirmação exigida pelo Formspree.
3. Copie o ID que aparece na URL de envio, por exemplo, `https://formspree.io/f/abcdefgh` → `abcdefgh`.
4. Crie `.env.local` na raiz do projeto com:

   ```env
   VITE_FORMSPREE_FORM_ID=abcdefgh
   ```

5. Reinicie `npm run dev`, complete o desafio e teste a escolha de um horário. Confira tanto a aba **Submissions** no Formspree quanto sua caixa de e-mail (inclusive spam).

O formulário envia data ISO, dia da semana, horário e fuso de Brasília. A mensagem de sucesso só aparece após o serviço confirmar o recebimento. Se a rede falhar, a escolha pode ser reenviada. Envios consecutivos em diferentes dispositivos podem gerar duplicatas.

**Não use tokens privados no VITE_**: as variáveis `VITE_` ficam acessíveis no navegador. O ID público do formulário é suficiente para a integração.

## Publicar na Vercel

- Conecte o repositório ao projeto na Vercel, com `npm run build` e diretório de saída `dist`.
- Em *Project Settings → Environment Variables*, adicione `VITE_FORMSPREE_FORM_ID` com o mesmo ID.
- Faça um novo deploy e envie uma submissão de teste.

## Observações

- Apenas quem conhece a senha avança no fluxo normal da interface; as senhas são verificadas no cliente e não protegem informações sensíveis.
- A agenda apresenta opções, mas não sincroniza disponibilidade real nem impede duas escolhas do mesmo horário.
- O botão de reinício aparece apenas no modo desenvolvimento.
- O formulário **não** registra um compromisso na sua agenda; encaminha a escolha ao Formspree.

## Comportamento atualizado (v6)

- A charada bíblica usa cinco linhas fixas de 3 / 1 / 2 / 5 / 2 referências, em ordem.
- Se os 3 minutos terminarem **sem acertar `gasolina`**, o usuário vai para a tela de encerramento (inclusive ao recarregar com prazo vencido).
- Se acertar antes do prazo, a tela de espera mantém o tempo restante; quando zerar, abre o desafio musical (`allofme`, 3 tentativas).
- Layout adaptado para iPhones, inclusive safe areas, teclado móvel e rolagem de conteúdo longo.
