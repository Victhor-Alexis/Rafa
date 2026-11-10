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
        kkkkk combustível é importante, mas não resolve tudo!
      </p>
      <p className="game-intro">
        Mas deixa o combustível só para a aventura 😉
      </p>
      <p className="game-intro waiting-emphasis">
        Você terminou antes, mas vai ter que esperar o prazo de qualquer jeito kkkk
      </p>

      <blockquote className="verse-card">
        <div className="riddle-label">FILIPENSES 4:6–7</div>
        <p>
          Não andem ansiosos por coisa alguma, mas em tudo, por meio da oração
          e da súplica, com ação de graças, apresentem os seus pedidos a Deus.
          Então, a paz de Deus, que excede todo o entendimento, guardará o coração
          e os pensamentos de vocês em Cristo Jesus.
        </p>
      </blockquote>
    </section>
  );
}
