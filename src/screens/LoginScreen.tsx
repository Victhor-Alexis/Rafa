import { FormEvent, useState } from 'react';
import { FIRST_PASSWORD } from '../constants';
import { HeartDivider } from '../components/HeartDivider';
import { normalizeAnswer } from '../utils/normalizeAnswer';

interface LoginScreenProps {
  onSuccess: (answer: string) => void;
}

export function LoginScreen({ onSuccess }: LoginScreenProps) {
  const [password, setPassword] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [error, setError] = useState('');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (normalizeAnswer(password) === FIRST_PASSWORD) {
      onSuccess(password);
      return;
    }

    setError('Essa não é a senha. Tente outra vez.');
  }

  return (
    <section className="panel login-panel" aria-label="Acesso">
      <div className="eyebrow">UM CONVITE ESPECIAL</div>
      <h1>Rafaela<br /><em>Miranga</em></h1>
      <HeartDivider />
      <p className="subheading">Algumas surpresas começam com uma senha.</p>

      <form onSubmit={handleSubmit}>
        <label className="field-label" htmlFor="password">SUA SENHA</label>
        <div className="input-wrap">
          <span aria-hidden="true">♡</span>
          <input
            id="password"
            type={isVisible ? 'text' : 'password'}
            autoComplete="off"
            placeholder="Digite a senha"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError('');
            }}
          />
          <button
            type="button"
            className="eye"
            onClick={() => setIsVisible(!isVisible)}
            aria-label={isVisible ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {isVisible ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="primary" type="submit">Acessar <span>→</span></button>
      </form>
      <div className="footer-note">Feito com um pouquinho de mistério ✧</div>
    </section>
  );
}
