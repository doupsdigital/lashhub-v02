import { useState, useEffect } from 'react';

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

export default function SplashScreen() {
  const [visible, setVisible] = useState(() => isStandalone());
  const [fading, setFading] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const fadeTimer = setTimeout(() => setFading(true), 1800);
    const hideTimer = setTimeout(() => setVisible(false), 2400);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] flex flex-col items-center justify-center"
      style={{
        backgroundColor: '#F7F3EE',
        opacity: fading ? 0 : 1,
        transition: 'opacity 0.6s ease-out',
      }}
    >
      {/* Sem logo — evita o salto de tamanho/posição da OS splash */}
      <div
        className="flex flex-col items-center gap-2"
        style={{
          opacity: fading ? 0 : 1,
          transform: fading ? 'translateY(4px)' : 'translateY(0)',
          transition: 'opacity 0.5s ease-out, transform 0.5s ease-out',
        }}
      >
        <h1
          className="font-title font-semibold text-text-primary"
          style={{ fontSize: '2.2rem', letterSpacing: '0.14em' }}
        >
          Lash Hub
        </h1>
        <p
          className="uppercase text-text-muted font-sans"
          style={{ fontSize: '0.58rem', letterSpacing: '0.3em' }}
        >
          Gestão & Agendamentos
        </p>
      </div>

      <div className="absolute bottom-14 flex items-center gap-2 opacity-25">
        <div className="w-8 h-px bg-text-secondary" />
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#A85560' }} />
        <div className="w-8 h-px bg-text-secondary" />
      </div>
    </div>
  );
}
