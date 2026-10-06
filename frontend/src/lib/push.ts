import { apiFetch } from '@/lib/api';

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

export type PushEtat = 'non-supporte' | 'non-configure' | 'refuse' | 'inactif' | 'actif';

function base64VersUint8(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const brut = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'));
  const sortie = new Uint8Array(new ArrayBuffer(brut.length));
  for (let i = 0; i < brut.length; i += 1) sortie[i] = brut.charCodeAt(i);
  return sortie;
}

const supporte = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

async function registration() {
  return (await navigator.serviceWorker.getRegistration('/sw.js')) ?? navigator.serviceWorker.register('/sw.js');
}

export async function etatPush(): Promise<PushEtat> {
  if (!supporte()) return 'non-supporte';
  if (!PUBLIC_KEY) return 'non-configure';
  if (Notification.permission === 'denied') return 'refuse';
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    const sub = await reg?.pushManager.getSubscription();
    return sub && Notification.permission === 'granted' ? 'actif' : 'inactif';
  } catch {
    return 'inactif';
  }
}

/** Demande la permission, s'abonne et enregistre l'abonnement côté serveur. */
export async function activerPush(): Promise<PushEtat> {
  if (!supporte()) return 'non-supporte';
  if (!PUBLIC_KEY) return 'non-configure';
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission === 'denied' ? 'refuse' : 'inactif';

  const reg = await registration();
  await navigator.serviceWorker.ready;
  const sub =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: base64VersUint8(PUBLIC_KEY) }));

  const res = await apiFetch('/api/push/abonnement', {
    method: 'POST',
    body: JSON.stringify({ subscription: sub.toJSON() }),
  });
  return res.success ? 'actif' : 'inactif';
}

export async function desactiverPush(): Promise<PushEtat> {
  if (!supporte()) return 'non-supporte';
  const reg = await navigator.serviceWorker.getRegistration('/sw.js');
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await apiFetch('/api/push/abonnement', { method: 'DELETE', body: JSON.stringify({ endpoint: sub.endpoint }) });
    await sub.unsubscribe();
  }
  return 'inactif';
}
