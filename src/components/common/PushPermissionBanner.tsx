import { useState } from 'react';
import { Bell, X } from 'lucide-react';
import { usePushNotifications } from '../../hooks/usePushNotifications';

const DISMISSED_KEY = 'lashhub_push_banner_dismissed';

export default function PushPermissionBanner() {
  const { permission, loading, isSupported, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem(DISMISSED_KEY) === 'true'
  );
  const [subscribed, setSubscribed] = useState(false);

  // Não exibe se: não suporta, já concedeu, negou, dismissou, ou já subscreveu agora
  if (!isSupported || permission === 'granted' || permission === 'denied' || dismissed || subscribed) {
    return null;
  }

  const handleActivate = async () => {
    const ok = await subscribe();
    if (ok) setSubscribed(true);
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  };

  return (
    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 shadow-sm">
      <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Bell className="w-4 h-4 text-rose-600" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">Ative as notificações</p>
        <p className="text-xs text-text-secondary mt-0.5">
          Seja avisada no celular quando uma cliente agendar pelo portal.
        </p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={handleActivate}
            disabled={loading}
            className="px-4 py-1.5 bg-rose-600 hover:bg-rose-800 disabled:bg-rose-400 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            {loading ? 'Ativando...' : 'Ativar notificações'}
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-1.5 text-text-muted hover:text-text-secondary text-xs font-medium transition-colors cursor-pointer"
          >
            Agora não
          </button>
        </div>
      </div>
      <button onClick={handleDismiss} className="text-text-muted hover:text-text-secondary cursor-pointer flex-shrink-0">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
