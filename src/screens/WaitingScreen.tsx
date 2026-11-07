import { Countdown } from '../components/Countdown';

interface WaitingScreenProps {
  remaining: number;
}

export function WaitingScreen({ remaining }: WaitingScreenProps) {
  return (
    <section className="panel game-panel waiting-panel">
      <div className="game-head">
        <div>
          <div className="eyebrow">VOCÊ DESCOBRIU!</div>
          <h2>Gasolina!<br /><em>Boa, Rafa.</em></h2>
        </div>
        <Countdown remaining={remaining} />
      </div>

      <p className="game-intro">
        Gasolina! Pior que precisamos de combustível para essa relação mesmo.
        Brincadeira, maus hábitos kkkkk
      </p>
      <p className="game-intro">
        Precisaremos de combustível, mas não é o suficiente 🫠
      </p>
      <p className="game-intro waiting-emphasis">
        Você terminou antes, mas vai ter que esperar o prazo de qualquer jeito kkkk
      </p>

      <blockquote className="verse-card">
        <div className="riddle-label">FILIPENSES 4:6–7</div>
        <p>
          Não deixem que as preocupações dominem vocês. Em todas as situações,
          apresentem a Deus seus pedidos em oração, com gratidão. A paz de Deus,
          maior do que nossa compreensão, guardará o coração e os pensamentos
          de vocês em Cristo Jesus.
        </p>
        <small>Paráfrase em português · <a href="https://www.bibliaonline.com.br/acf/fp/4/6%2C7" target="_blank" rel="noreferrer">Ler o texto integral na ACF</a></small>
      </blockquote>
    </section>
  );
}
