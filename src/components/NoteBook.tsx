import { KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useId, useRef, useState } from 'react';
import { NOTE_ONE_PAGES, NOTE_ONE_TITLE } from '../content/noteOne';
import './NoteBook.css';

interface NoteBookProps {
  onClose: () => void;
}

type TurnDirection = 'next' | 'previous';
interface PageTurn { direction: TurnDirection; phase: 'out' | 'in'; }

const HALF_TURN_MS = 200;
const TURN_MS = HALF_TURN_MS * 2;

export function NoteBook({ onClose }: NoteBookProps) {
  const titleId = useId();
  const instructionsId = useId();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const previousNavRef = useRef<HTMLButtonElement>(null);
  const nextNavRef = useRef<HTMLButtonElement>(null);
  const pageScrollRef = useRef<HTMLElement>(null);
  const onCloseRef = useRef(onClose);
  const restoreModalRef = useRef<(() => void) | null>(null);
  const closingRef = useRef(false);
  const currentPageRef = useRef(0);
  const targetPageRef = useRef<number | null>(null);
  const flippingRef = useRef(false);
  const timersRef = useRef<number[]>([]);
  const [pageIndex, setPageIndex] = useState(0);
  const [turn, setTurn] = useState<PageTurn | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  onCloseRef.current = onClose;

  const clearTurnTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  const finishTurn = useCallback(() => {
    clearTurnTimers();
    const target = targetPageRef.current;
    if (target !== null) {
      currentPageRef.current = target;
      setPageIndex(target);
      if (pageScrollRef.current) pageScrollRef.current.scrollTop = 0;
    }
    targetPageRef.current = null;
    flippingRef.current = false;
    setTurn(null);
  }, [clearTurnTimers]);

  const closeBook = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    clearTurnTimers();
    restoreModalRef.current?.();
    onCloseRef.current();
  }, [clearTurnTimers]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let restored = false;
    closingRef.current = false;

    const onMotionChange = () => {
      if (motionPreference.matches && flippingRef.current) finishTurn();
    };
    motionPreference.addEventListener('change', onMotionChange);

    const restore = () => {
      if (restored) return;
      restored = true;
      clearTurnTimers();
      motionPreference.removeEventListener('change', onMotionChange);
      if (dialog.open) dialog.close();
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
    restoreModalRef.current = restore;
    document.body.style.overflow = 'hidden';
    if (!dialog.open) dialog.showModal();
    closeRef.current?.focus({ preventScroll: true });

    return () => {
      restore();
      if (restoreModalRef.current === restore) restoreModalRef.current = null;
    };
  }, [clearTurnTimers, finishTurn]);

  const turnPage = useCallback((direction: TurnDirection) => {
    if (flippingRef.current || closingRef.current) return;
    const target = currentPageRef.current + (direction === 'next' ? 1 : -1);
    if (target < 0 || target >= NOTE_ONE_PAGES.length) return;
    targetPageRef.current = target;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const focusedElement = document.activeElement;
    const navigationHasFocus = focusedElement === previousNavRef.current || focusedElement === nextNavRef.current;
    const focusedNavigationWillDisable = navigationHasFocus && (!reducedMotion ||
      (focusedElement === previousNavRef.current && target === 0) ||
      (focusedElement === nextNavRef.current && target === NOTE_ONE_PAGES.length - 1));
    if (focusedNavigationWillDisable) pageScrollRef.current?.focus({ preventScroll: true });

    if (reducedMotion) {
      finishTurn();
      return;
    }

    flippingRef.current = true;
    setTurn({ direction, phase: 'out' });
    timersRef.current = [
      window.setTimeout(() => {
        currentPageRef.current = target;
        setPageIndex(target);
        if (pageScrollRef.current) pageScrollRef.current.scrollTop = 0;
        setTurn({ direction, phase: 'in' });
      }, HALF_TURN_MS),
      window.setTimeout(finishTurn, TURN_MS),
    ];
  }, [finishTurn]);

  function onKeyDown(event: ReactKeyboardEvent<HTMLDialogElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey || event.defaultPrevented) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      turnPage(event.key === 'ArrowRight' ? 'next' : 'previous');
    }
  }

  const page = NOTE_ONE_PAGES[pageIndex];
  const pageClassName = `note-book-page${turn ? ` note-book-page--${turn.direction} note-book-page--${turn.phase}` : ''}`;

  return (
    <dialog
      ref={dialogRef}
      className="note-book-dialog"
      aria-labelledby={titleId}
      aria-describedby={instructionsId}
      onCancel={(event) => { event.preventDefault(); closeBook(); }}
      onKeyDown={onKeyDown}
    >
      <div className="note-book-shell">
        <header className="note-book-header">
          <h2 className="note-book-title" id={titleId}>{NOTE_ONE_TITLE}</h2>
          <button className="note-book-close" ref={closeRef} type="button" aria-label="Fechar nota" onClick={closeBook}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </button>
        </header>
        <p className="note-book-sr-only" id={instructionsId}>
          Use os botões ou as setas para a esquerda e para a direita para virar as páginas. Pressione Escape para fechar.
        </p>

        <div className="note-book-volume" role="group" aria-label="Livro da nota">
          <div className="note-book-spread">
            <div className="note-book-flyleaf" aria-hidden="true">
              <div className="note-book-flyleaf-frame">
                <span className="note-book-ornament">✦</span>
                <span className="note-book-flyleaf-title">{NOTE_ONE_TITLE}</span>
                <span className="note-book-ornament note-book-ornament--small">❦</span>
              </div>
            </div>
            <div className="note-book-page-stack">
              <div className={pageClassName} aria-busy={Boolean(turn)}>
                <article className="note-book-page-scroll" ref={pageScrollRef} tabIndex={0}
                  aria-label={`Página ${pageIndex + 1} de ${NOTE_ONE_PAGES.length}`}>
                  <div className="note-book-running-title" aria-hidden="true"><span>NOTA #1</span><span>✦</span></div>
                  {page.image && !failedImages[page.image.src] && (
                    <figure className="note-book-image">
                      <img src={page.image.src} alt={page.image.alt} width={page.image.width} height={page.image.height}
                        decoding="async" onError={() => {
                          const src = page.image?.src;
                          if (src) setFailedImages((current) => ({ ...current, [src]: true }));
                        }} />
                    </figure>
                  )}
                  <div className="note-book-copy">
                    {page.paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
                  </div>
                  <div className="note-book-page-end" aria-hidden="true">{String(pageIndex + 1).padStart(2, '0')}</div>
                </article>
              </div>
            </div>
          </div>
          <div className="note-book-ribbon" aria-hidden="true" />
        </div>

        <footer className="note-book-footer">
          <button className="note-book-nav" ref={previousNavRef} type="button" aria-label="Página anterior" disabled={Boolean(turn) || pageIndex === 0}
            onClick={() => turnPage('previous')}><span aria-hidden="true">←</span><span>Anterior</span></button>
          <p className="note-book-counter" role="status" aria-live="polite" aria-atomic="true">
            Página <strong>{pageIndex + 1}</strong> de {NOTE_ONE_PAGES.length}
          </p>
          <button className="note-book-nav" ref={nextNavRef} type="button" aria-label="Próxima página"
            disabled={Boolean(turn) || pageIndex === NOTE_ONE_PAGES.length - 1}
            onClick={() => turnPage('next')}><span>Próxima</span><span aria-hidden="true">→</span></button>
        </footer>
      </div>
    </dialog>
  );
}
