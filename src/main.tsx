// Cascade layer order first, before any module (App, AstryxRoot) pulls in Astryx CSS that would declare its own order.
import './layers.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AstryxRoot } from './astryxRoot.tsx';
import '@astryxdesign/core/reset.css';
import '@astryxdesign/core/astryx.css';
import './styles.css';
import './apple-shell.css';
import './apple-public.css';
import './apple-app.css';
import './site.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AstryxRoot>
      <App />
    </AstryxRoot>
  </StrictMode>,
);
