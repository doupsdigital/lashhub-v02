import { useState, useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { useInstallPrompt } from '../../contexts/InstallPromptContext';

const STORAGE_KEY = 'lashhub-install-banner-dismissed';

type DeviceType = 'ios-safari' | 'ios-chrome' | 'android-chrome' | 'android' | null;

function detectDevice(): 'ios-safari' | 'ios-chrome' | 'android-chrome' | 'android' | 'other' {
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios|edgios/i.test(ua);
  const isChromeIOS = /crios/i.test(ua);
  const isAndroid = /android/i.test(ua);
  const isChrome = /chrome/i.test(ua) && !/edge|opr|samsung/i.test(ua);

  if (isIOS && isSafari) return 'ios-safari';
  if (isIOS && isChromeIOS) return 'ios-chrome';
  if (isAndroid && isChrome) return 'android-chrome';
  if (isAndroid) return 'android';
  return 'other';
}

function isAlreadyInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

interface InstallBannerProps {
  inline?: boolean;
}

export default function InstallBanner({ inline = false }: InstallBannerProps) {
  const { deferredPrompt, triggerInstall } = useInstallPrompt();
  const [visible, setVisible] = useState(false);
  const [device, setDevice] = useState<DeviceType>(null);

  useEffect(() => {
    if (isAlreadyInstalled()) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const detected = detectDevice();

    if (detected !== 'other') {
      setDevice(detected);
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  const handleAndroidInstall = async () => {
    await triggerInstall();
    setVisible(false);
  };

  if (!visible || !device) return null;

  const card = (
    <div className={`bg-white border border-border rounded-2xl p-4 flex items-start gap-3 ${inline ? '' : 'shadow-xl max-w-md mx-auto'}`}>
      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-rose-600 to-rose-400 flex items-center justify-center flex-shrink-0 border border-border overflow-hidden">
        <img
          src="/logo-login.png"
          alt="Lash Hub"
          className="w-full h-full object-contain"
        />
      </div>

      <div className="flex-1 min-w-0">
        {device === 'android-chrome' ? (
          deferredPrompt ? (
            <>
              <p className="text-sm font-semibold text-text-primary leading-snug">
                Instale o Lash Hub no seu celular
              </p>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Adicione à tela de início para acesso rápido, sem precisar abrir o navegador.
              </p>
              <button
                onClick={handleAndroidInstall}
                className="mt-2 flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-800 text-white text-xs font-semibold rounded-lg transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Instalar agora
              </button>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-text-primary leading-snug">
                Instale o Lash Hub no seu celular
              </p>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                Toque no menu{' '}
                <span className="font-semibold text-text-primary">⋮</span>
                {' '}do Chrome e depois em{' '}
                <span className="font-semibold text-text-primary">"Adicionar à tela inicial"</span>.
              </p>
            </>
          )
        ) : device === 'android' ? (
          <>
            <p className="text-sm font-semibold text-text-primary leading-snug">
              Instale o Lash Hub no seu celular
            </p>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              Procure a opção{' '}
              <span className="font-semibold text-text-primary">"Adicionar à tela inicial"</span>
              {' '}no menu do seu navegador.
            </p>
          </>
        ) : device === 'ios-safari' ? (
          <>
            <p className="text-sm font-semibold text-text-primary leading-snug">
              Instale o Lash Hub no seu iPhone
            </p>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              Toque em{' '}
              <span className="inline-flex items-center gap-0.5 font-semibold text-text-primary">
                <svg className="w-3.5 h-3.5 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                  <polyline points="16 6 12 2 8 6"/>
                  <line x1="12" y1="2" x2="12" y2="15"/>
                </svg>{' '}
                Compartilhar
              </span>
              {' '}e depois em{' '}
              <span className="font-semibold text-text-primary">"Adicionar à Tela de Início"</span>.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-text-primary leading-snug">
              Instale como app no seu iPhone
            </p>
            <p className="text-xs text-text-secondary mt-1 leading-relaxed">
              Para instalar, abra este link no{' '}
              <span className="font-semibold text-text-primary">Safari</span>{' '}
              e toque em{' '}
              <span className="font-semibold text-text-primary">"Adicionar à Tela de Início"</span>.
            </p>
          </>
        )}
      </div>

      <button
        onClick={dismiss}
        className="text-text-muted hover:text-text-primary flex-shrink-0 p-0.5 cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );

  if (inline) return card;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-3 animate-slide-up">
      {card}
    </div>
  );
}
