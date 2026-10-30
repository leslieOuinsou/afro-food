'use client';

import { useCallback, useEffect, useState } from 'react';
import { getChat, postChat, ouvrirFlux } from '@/services/features';

type Msg = { id: string; corps: string; createdAt: string; auteur: { prenom: string; role: string } };

export default function ChatCommande({ commandeId }: { commandeId: string }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [texte, setTexte] = useState('');
  const [ouvert, setOuvert] = useState(false);

  const charger = useCallback(async () => {
    const res = await getChat(commandeId);
    if (res.success && res.data?.messages) setMessages(res.data.messages);
  }, [commandeId]);

  useEffect(() => {
    if (!ouvert) return;
    void charger();
    const off = ouvrirFlux(`chat:${commandeId}`, () => {
      void charger();
    });
    const t = setInterval(() => void charger(), 10000);
    return () => {
      off();
      clearInterval(t);
    };
  }, [ouvert, commandeId, charger]);

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!texte.trim()) return;
    const res = await postChat(commandeId, texte.trim());
    if (res.success) {
      setTexte('');
      await charger();
    }
  };

  return (
    <div className="mt-6 rounded-[24px] border border-[var(--wood)]/12 bg-white/80">
      <button type="button" onClick={() => setOuvert((o) => !o)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-semibold">
        Messagerie commande
        <span className="opacity-50">{ouvert ? '−' : '+'}</span>
      </button>
      {ouvert && (
        <div className="border-t border-[var(--wood)]/10 px-4 pb-4">
          <div className="max-h-48 space-y-2 overflow-y-auto py-3 text-sm">
            {messages.map((m) => (
              <div key={m.id} className="rounded-xl bg-[var(--ivory)] px-3 py-2">
                <p className="text-[10px] uppercase opacity-50">
                  {m.auteur.prenom} · {m.auteur.role}
                </p>
                <p>{m.corps}</p>
              </div>
            ))}
            {messages.length === 0 && <p className="opacity-50">Aucun message. Posez une question à l’équipe.</p>}
          </div>
          <form onSubmit={(e) => void envoyer(e)} className="flex gap-2">
            <input
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              placeholder="Votre message…"
              className="flex-1 rounded-xl border border-[var(--wood)]/15 px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-xl bg-[var(--ochre)] px-4 py-2 text-sm font-semibold text-white">
              Envoyer
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
