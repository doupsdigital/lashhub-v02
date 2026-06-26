import { useState, useEffect } from 'react';
import { Smartphone, Download, CheckCircle, Loader2 } from 'lucide-react';
import { useInstallPrompt } from '../../contexts/InstallPromptContext';

const STORAGE_KEY = 'lashhub-app-card-dismissed';

function detectDevice() {
  const ua = navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios|edgios/i.test(ua);
  const isAndroid = /android/i.test(ua);
  const isChrome = /chrome/i.test(ua) && !/edge|opr|samsung/i.test(ua);

  if (isIOS && isSafari) return 'ios-safari';
  if (isIOS) return 'ios-other';
  if (isAndroid && isChrome) return 'android-chrome';
  if (isAndroid) return 'android';
  return 'other';
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

export default function InstallAppCard() {
  const { deferredPrompt, triggerInstall } = useInstallPrompt();
  const [visible, setVisible] = useState(false);
  const [device, setDevice] = useState<string | null>(null);
  const [installState, setInstallState] = useState<'idle' | 'installing' | 'installed'>('idle');

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    const d = detectDevice();
    if (d !== 'other') {
      setDevice(d);
      setVisible(true);
    }
  }, []);

  useEffect(() => {
    const onInstalled = () => {
      setInstallState('installed');
      setTimeout(() => {
        localStorage.setItem(STORAGE_KEY, '1');
        setVisible(false);
      }, 5000);
    };
    window.addEventListener('appinstalled', onInstalled);
    return () => window.removeEventListener('appinstalled', onInstalled);
  }, []);

  const handleInstall = async () => {
    const outcome = await triggerInstall();
    if (outcome === 'accepted') setInstallState('installing');
  };

  const handleAlreadyInstalled = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible || !device) return null;

  return (
    <div className="bg-white border border-border rounded-[14px] p-6 shadow-sm">
      <h3 className="font-title font-bold text-lg text-text-primary flex items-center gap-2 border-b border-border pb-3 mb-4">
        <Smartphone className="w-5 h-5 text-rose-600" />
        Usar como App
      </h3>

      {installState === 'installed' ? (
        <div className="flex items-center gap-3 p-3.5 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-green-700">App instalado com sucesso!</p>
            <p className="text-xs text-green-600 mt-0.5">Agora você pode abrir o Lash Hub direto pela tela inicial do seu celular.</p>
          </div>
        </div>
      ) : installState === 'installing' ? (
        <div className="flex items-center gap-3 p-3.5 bg-rose-50 border border-rose-100 rounded-xl">
          <Loader2 className="w-5 h-5 text-rose-600 flex-shrink-0 animate-spin" />
          <div>
            <p className="text-sm font-semibold text-text-primary">Instalando...</p>
            <p className="text-xs text-text-secondary mt-0.5">Pode levar alguns segundos. Em breve aparecerá na sua tela inicial 📲</p>
          </div>
        </div>
      ) : (
        <>
          <p className="text-sm text-text-secondary mb-4 leading-relaxed">
            Instale o Lash Hub na tela inicial do seu celular para acessar com um toque, sem precisar abrir o navegador.
          </p>

          {device === 'android-chrome' && deferredPrompt ? (
            <button
              onClick={handleInstall}
              className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-800 text-white text-sm font-semibold rounded-xl transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Instalar agora
            </button>
          ) : device === 'ios-safari' ? (
            <div className="space-y-3">
              <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3.5 text-xs text-text-secondary leading-relaxed">
                Toque em{' '}
                <span className="inline-flex items-center gap-0.5 font-semibold text-text-primary">
                  <svg className="w-3.5 h-3.5 inline" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
                    <polyline points="16 6 12 2 8 6"/>
                    <line x1="12" y1="2" x2="12" y2="15"/>
                  </svg>{' '}
                  Compartilhar
                </span>
                {' '}na barra do Safari e depois em{' '}
                <span className="font-semibold text-text-primary">"Adicionar à Tela de Início"</span>.
              </div>
              <button onClick={handleAlreadyInstalled} className="text-xs text-text-muted hover:text-text-primary underline transition-colors cursor-pointer">
                Já instalei — não mostrar mais
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="bg-rose-50/50 border border-rose-100 rounded-xl p-3.5 text-xs text-text-secondary leading-relaxed">
                Toque no menu{' '}
                <span className="font-semibold text-text-primary">⋮</span>
                {' '}do Chrome e depois em{' '}
                <span className="font-semibold text-text-primary">"Adicionar à tela inicial"</span>.
              </div>
              <button onClick={handleAlreadyInstalled} className="text-xs text-text-muted hover:text-text-primary underline transition-colors cursor-pointer">
                Já instalei — não mostrar mais
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
