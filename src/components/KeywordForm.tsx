import { FormEvent, useId, useRef, useState } from 'react';

interface KeywordFormProps {
  length: number;
  onSubmit: (value: string) => void;
  disabled?: boolean;
  error?: string;
  label?: string;
}

/** Um único input acessível controla os espaços visuais da palavra. */
export function KeywordForm({
  length,
  onSubmit,
  disabled = false,
  error,
  label = 'Palavra-chave',
}: KeywordFormProps) {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();

  function handleChange(nextValue: string) {
    // Impede espaços, números e símbolos, além de limitar ao número de traços.
    const sanitized = nextValue.replace(/[^\p{L}]/gu, '').slice(0, length);
    setValue(sanitized);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (disabled || value.length !== length) return;
    onSubmit(value);
  }

  return (
    <form className="keyword-form" onSubmit={handleSubmit}>
      <label className="keyword-label" htmlFor={inputId}>
        {label} <span className="keyword-count">({value.length}/{length} letras)</span>
      </label>

      <div className="keyword-entry" onClick={() => inputRef.current?.focus()}>
        <input
          ref={inputRef}
          id={inputId}
          className="keyword-native-input"
          type="text"
          inputMode="text"
          aria-label={`${label}, ${length} letras`}
          autoCapitalize="none"
          autoCorrect="off"
          autoComplete="off"
          spellCheck={false}
          maxLength={length}
          value={value}
          onChange={(event) => handleChange(event.target.value)}
          disabled={disabled}
        />
        <div className="keyword-slots" aria-hidden="true">
          {Array.from({ length }, (_, index) => (
            <span
              key={index}
              className={`keyword-slot${index === value.length && !disabled ? ' keyword-slot--next' : ''}`}
            >
              <span className="keyword-letter">{value[index] || '\u00a0'}</span>
              <span className="keyword-underline" />
            </span>
          ))}
        </div>
      </div>

      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary submit-keyword" type="submit" disabled={disabled || value.length !== length}>
        Confirmar resposta →
      </button>
    </form>
  );
}
