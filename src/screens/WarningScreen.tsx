import { HeartDivider } from '../components/HeartDivider';

interface WarningScreenProps {
  onYes: () => void;
  onNo: () => void;
}

export function WarningScreen({ onYes, onNo }: WarningScreenProps) {
  return (
    <section className="panel warning-panel">
      <div className="seal">✉</div>
      <div className="eyebrow">ANTES DE CONTINUAR</div>
      <h2>Um pequeno<br /><em>aviso...</em></h2>
      <HeartDivider />
      <p className="warning-quote">
        “A curiosidade às vezes pode nos levar por caminhos que não tem volta.
        Pense bem antes de prosseguir...”
      </p>
      <p className="question">Deseja continuar?</p>
      <div className="choices">
        <button className="secondary" onClick={onNo}>Não, voltar</button>
        <button className="primary" onClick={onYes}>Sim, continuar →</button>
      </div>
    </section>
  );
}
