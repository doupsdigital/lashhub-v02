import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Registra o service worker para habilitar instalação como PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

// iOS Safari: força repaint após resize/rotação para corrigir padding-top
// que não é renderizado corretamente na primeira pintura visual.
if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
  const repaint = () => {
    requestAnimationFrame(() => {
      window.scrollTo(0, 1);
      requestAnimationFrame(() => window.scrollTo(0, 0));
    });
  };

  // Primeiro load
  window.addEventListener('load', repaint);

  // Após rotação de tela (aguarda o browser concluir o resize)
  window.addEventListener('orientationchange', () => setTimeout(repaint, 300));

  // Ao voltar ao app (após sair para outra janela)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) repaint();
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
