/**
 * Centre de notifications (admin / livreur), stocké dans le navigateur.
 * Alimenté par AdminNotifier et la page livreur, affiché par NotificationBell.
 */

export type NotifRole = 'admin' | 'livreur' | 'client';

export type Notif = {
  id: string;
  titre: string;
  detail: string;
  href: string;
  date: string;
  lue: boolean;
};

export const NOTIFS_UPDATED_EVENT = 'afro:notifs-updated';
const MAX = 30;

const cle = (role: NotifRole) => `afro_notifs_${role}`;
const cleSon = (role: NotifRole) => `afro_notifs_son_${role}`;

export function lireNotifs(role: NotifRole): Notif[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(cle(role)) || '[]') as unknown;
    return Array.isArray(parsed) ? (parsed as Notif[]) : [];
  } catch {
    return [];
  }
}

function ecrire(role: NotifRole, liste: Notif[]) {
  try {
    localStorage.setItem(cle(role), JSON.stringify(liste.slice(0, MAX)));
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(NOTIFS_UPDATED_EVENT));
}

export function ajouterNotif(role: NotifRole, n: Omit<Notif, 'date' | 'lue'>) {
  const liste = lireNotifs(role);
  if (liste.some((x) => x.id === n.id)) return;
  ecrire(role, [{ ...n, date: new Date().toISOString(), lue: false }, ...liste]);
}

export function marquerToutesLues(role: NotifRole) {
  ecrire(role, lireNotifs(role).map((n) => ({ ...n, lue: true })));
}

export function marquerLue(role: NotifRole, id: string) {
  ecrire(role, lireNotifs(role).map((n) => (n.id === id ? { ...n, lue: true } : n)));
}

export function viderNotifs(role: NotifRole) {
  ecrire(role, []);
}

export function sonActif(role: NotifRole): boolean {
  try {
    return localStorage.getItem(cleSon(role)) !== '0';
  } catch {
    return true;
  }
}

export function definirSon(role: NotifRole, actif: boolean) {
  try {
    localStorage.setItem(cleSon(role), actif ? '1' : '0');
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event(NOTIFS_UPDATED_EVENT));
}

/** Double bip court (Web Audio) — peut être bloqué par le navigateur avant le premier clic. */
export function jouerBip() {
  try {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    [880, 1175].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.2);
      gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + i * 0.2 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.2 + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.2);
      osc.stop(ctx.currentTime + i * 0.2 + 0.2);
    });
  } catch {
    /* ignore */
  }
}
