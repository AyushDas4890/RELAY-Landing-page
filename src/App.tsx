import { useCallback, useState } from 'react';
import { Landing } from './components/Landing.tsx';
import { PageIntro } from './components/PageIntro.tsx';
import { openApp } from './appUrl.ts';

export default function App() {
  // The scroll-driven notebook opening plays on every page load. The page mounts only once the opening
  // starts to uncover it, so the hero's own entrance (headline, sticky notes, pen marks) plays in view
  // instead of behind the opening.
  const [showIntro, setShowIntro] = useState(true);
  const [revealed, setRevealed] = useState(false);
  const onReveal = useCallback(() => setRevealed(true), []);
  const onDone = useCallback(() => { setRevealed(true); setShowIntro(false); }, []);
  return (
    <>
      {showIntro && <PageIntro onReveal={onReveal} onDone={onDone} />}
      {revealed && <Landing onGetStarted={openApp} />}
    </>
  );
}
