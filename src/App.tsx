import { useState } from 'react';
import { Landing } from './components/Landing.tsx';
import { PageIntro } from './components/PageIntro.tsx';
import { openApp } from './appUrl.ts';

export default function App() {
  // The scroll-zoom intro plays on every page load, as it did in the app.
  const [showIntro, setShowIntro] = useState(true);
  return (
    <>
      {showIntro && <PageIntro onDone={() => setShowIntro(false)} />}
      <Landing onGetStarted={openApp} />
    </>
  );
}
