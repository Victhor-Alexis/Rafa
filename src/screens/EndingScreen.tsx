import { useCallback, useState } from 'react';
import { NoteBook } from '../components/NoteBook';
import { NOTE_ONE_TITLE } from '../content/noteOne';

export function EndingScreen() {
  const [bookOpen, setBookOpen] = useState(false);
  const closeBook = useCallback(() => setBookOpen(false), []);

  return (
    <section className="panel locked-panel">
      <div className="mountain-illustration" aria-hidden="true">
        <div className="sun" />
        <div className="ridge ridge-far" />
        <div className="ridge ridge-near" />
        <div className="moses">♟</div>
      </div>
      <h2>À vista da<br /><em>terra prometida...</em></h2>
      <p>Como Moisés, você pode contemplá-la de longe. Mas, por enquanto, não poderá entrar.</p>
      <button className="secondary ending-note-trigger" type="button"
        aria-haspopup="dialog" aria-expanded={bookOpen} onClick={() => setBookOpen(true)}>
        {NOTE_ONE_TITLE}
      </button>
      {bookOpen && <NoteBook onClose={closeBook} />}
    </section>
  );
}
