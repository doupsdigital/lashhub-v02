import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface InstallPromptContextType {
  deferredPrompt: BeforeInstallPromptEvent | null;
  triggerInstall: () => Promise<void>;
}

const InstallPromptContext = createContext<InstallPromptContextType>({
  deferredPrompt: null,
  triggerInstall: async () => {},
});

export function InstallPromptProvider({ children }: { children: ReactNode }) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const onAppInstalled = () => setDeferredPrompt(null);

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const triggerInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <InstallPromptContext.Provider value={{ deferredPrompt, triggerInstall }}>
      {children}
    </InstallPromptContext.Provider>
  );
}

export const useInstallPrompt = () => useContext(InstallPromptContext);
