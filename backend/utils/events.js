/**
 * Bus d'événements en mémoire pour SSE (suivi commande, KDS).
 * Sur Vercel serverless, chaque instance a son propre bus : le polling client reste le fallback.
 */
import { EventEmitter } from 'events';

const bus = new EventEmitter();
bus.setMaxListeners(200);

export function publier(canal, payload) {
  bus.emit(canal, { ...payload, at: new Date().toISOString() });
  bus.emit('*', { canal, ...payload, at: new Date().toISOString() });
}

export function souscrire(canal, listener) {
  bus.on(canal, listener);
  return () => bus.off(canal, listener);
}

export function canalCommande(id) {
  return `commande:${id}`;
}

export function canalCuisine() {
  return 'cuisine';
}

export function canalChat(commandeId) {
  return `chat:${commandeId}`;
}
