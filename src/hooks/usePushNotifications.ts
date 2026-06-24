import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as string;

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)));
}

export type PushPermissionState = 'unsupported' | 'denied' | 'granted' | 'default';

export function usePushNotifications() {
  const { user, estabelecimentoId, role } = useAuth();
  const [permission, setPermission] = useState<PushPermissionState>('default');
  const [loading, setLoading] = useState(false);

  const isSupported =
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    !!VAPID_PUBLIC_KEY;

  useEffect(() => {
    if (!isSupported) { setPermission('unsupported'); return; }
    setPermission(Notification.permission as PushPermissionState);
  }, [isSupported]);

  const subscribe = async (): Promise<boolean> => {
    if (!isSupported || !user || !estabelecimentoId || role !== 'profissional') return false;
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm as PushPermissionState);
      if (perm !== 'granted') return false;

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY).buffer as ArrayBuffer,
      });

      const json = sub.toJSON();
      const keys = json.keys as { p256dh: string; auth: string };

      await supabase.from('push_subscriptions').upsert({
        user_id: user.id,
        estabelecimento_id: estabelecimentoId,
        endpoint: sub.endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      }, { onConflict: 'user_id,endpoint' });

      return true;
    } catch (err) {
      console.error('[usePushNotifications] erro ao subscrever:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async (): Promise<void> => {
    if (!isSupported || !user) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await supabase.from('push_subscriptions')
          .delete().eq('user_id', user.id).eq('endpoint', sub.endpoint);
        await sub.unsubscribe();
        setPermission('default');
      }
    } catch (err) {
      console.error('[usePushNotifications] erro ao dessubscrever:', err);
    }
  };

  return { permission, loading, isSupported, subscribe, unsubscribe };
}
