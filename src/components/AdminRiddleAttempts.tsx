import { useEffect, useId, useState } from 'react';
import { fetchRiddleAttempts, RiddleAttemptsPage } from '../services/supabase';

const PAGE_SIZE = 50;
const POLL_INTERVAL_MS = 2500;

interface AdminRiddleAttemptsProps {
  accessToken: string;
}

export function AdminRiddleAttempts({ accessToken }: AdminRiddleAttemptsProps) {
  const headingId = useId();
  const [offset, setOffset] = useState(0);
  const [page, setPage] = useState<RiddleAttemptsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    setPage(null);
    setLoading(true);
    setError('');

    async function refresh() {
      if (inFlight || cancelled || !accessToken) return;
      inFlight = true;
      try {
        const result = await fetchRiddleAttempts(accessToken, offset);
        if (cancelled) return;
        if (offset > 0 && offset >= result.total) {
          setOffset(Math.max(0, Math.floor((result.total - 1) / PAGE_SIZE) * PAGE_SIZE));
          return;
        }
        setPage(result);
        setError('');
      } catch {
        if (!cancelled) {
          setError('Não foi possível atualizar o histórico de tentativas. Tente novamente. Se persistir, verifique se a atualização do banco foi aplicada no Supabase.');
        }
      } finally {
        inFlight = false;
        if (!cancelled) setLoading(false);
      }
    }

    void refresh();
    const interval = window.setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [accessToken, offset, refreshKey]);

  if (!accessToken) return null;

  return (
    <section className="admin-attempts" aria-labelledby={headingId}>
      <div className="admin-attempts-heading">
        <div>
          <h3 id={headingId}>Tentativas da palavra-chave</h3>
          <p className="admin-note">Charada bíblica · mais recentes primeiro</p>
        </div>
        <div className="admin-attempts-total" aria-live="polite" aria-atomic="true">
          <strong>{page?.total ?? '—'}</strong>
          <span>{page?.total === 1 ? 'tentativa registrada' : 'tentativas registradas'}</span>
        </div>
      </div>

      {loading && <p className="admin-note" role="status">Carregando tentativas...</p>}
      {error && (
        <div className="admin-attempts-error">
          <p className="admin-error" role="alert">{error}</p>
          <button className="secondary" type="button" onClick={() => setRefreshKey((value) => value + 1)}>
            Tentar novamente
          </button>
        </div>
      )}

      {page && page.total === 0 && <p className="admin-note">Nenhuma tentativa registrada ainda.</p>}
      {page && page.attempts.length > 0 && (
        <div className="admin-attempts-table-wrap">
          <table className="admin-attempts-table">
            <thead>
              <tr>
                <th scope="col">Palavra enviada</th>
                <th scope="col">Recebida em (Brasília)</th>
              </tr>
            </thead>
            <tbody>
              {page.attempts.map((attempt) => (
                <tr key={attempt.id}>
                  <td>{attempt.answer}</td>
                  <td>
                    <time dateTime={attempt.created_at}>
                      {new Date(attempt.created_at).toLocaleString('pt-BR', {
                        timeZone: 'America/Sao_Paulo',
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
                    </time>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {(offset > 0 || (page && page.total > PAGE_SIZE)) && (
        <nav className="admin-attempts-pagination" aria-label="Páginas do histórico de tentativas">
          <button className="secondary" type="button" disabled={loading || offset === 0}
            onClick={() => setOffset((value) => Math.max(0, value - PAGE_SIZE))}>
            Anteriores
          </button>
          <span className="admin-note">
            {page ? `${offset + 1}–${offset + page.attempts.length} de ${page.total}` : `Página ${Math.floor(offset / PAGE_SIZE) + 1}`}
          </span>
          <button className="secondary" type="button" disabled={loading || !page || offset + PAGE_SIZE >= page.total}
            onClick={() => setOffset((value) => value + PAGE_SIZE)}>
            Próximas
          </button>
        </nav>
      )}

      <p className="admin-note admin-attempts-footnote">
        Só aparecem os envios recebidos após esta atualização. Tentativas anteriores não estavam registradas e não podem ser recuperadas.
      </p>
    </section>
  );
}
