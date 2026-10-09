'use client';

import { useCallback, useEffect, useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  getMessages,
  getMessageById,
  marquerCommeLu,
  repondreMessage,
  type MessageContact,
  type ReponseMessage,
} from '@/services/adminMessages';

const statutLabel: Record<string, string> = {
  non_lu: 'Non lu',
  lu: 'Lu',
  repondu: 'Répondu'
};

const statutColor: Record<string, string> = {
  non_lu: 'bg-amber-100 text-amber-800',
  lu: 'bg-blue-100 text-blue-800',
  repondu: 'bg-green-100 text-green-800'
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function AdminMessageriePage() {
  const [messages, setMessages] = useState<MessageContact[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<MessageContact | null>(null);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sendingReply, setSendingReply] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterStatut, setFilterStatut] = useState<string>('');

  const loadMessages = useCallback(async (statut = filterStatut) => {
    setLoading(true);
    setError(null);
    try {
      const result = await getMessages({ statut: statut || undefined, limite: 100 });
      const list = result.messages || [];
      setMessages(list);
      if (result.error) {
        setError(result.error);
      }
      if (selectedId && !list.find((m) => m._id === selectedId)) {
        setSelectedId(null);
        setSelectedMessage(null);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossible de charger les messages. Vérifiez que le backend est démarré et que SKIP_MESSAGERIE_AUTH=true si vous n'êtes pas connecté admin."
      );
    } finally {
      setLoading(false);
    }
  }, [filterStatut, selectedId]);

  useEffect(() => {
    // Décale le chargement initial hors phase immédiate de l'effet.
    queueMicrotask(() => {
      void loadMessages('');
    });
  }, [loadMessages]);

  const handleSelectMessage = useCallback(async (id: string) => {
    setSelectedId(id);
    setReplyText('');
    const msg = await getMessageById(id);
    setSelectedMessage(msg || null);
    // Le GET détail marque déjà non_lu -> lu côté backend, on resynchronise la liste.
    await loadMessages();
  }, [loadMessages]);

  const [infoReponse, setInfoReponse] = useState<{ type: 'ok' | 'erreur'; texte: string } | null>(null);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId || !replyText.trim()) return;
    setSendingReply(true);
    const res = await repondreMessage(selectedId, replyText.trim());
    setSendingReply(false);
    if (res.success && res.message) {
      setSelectedMessage(res.message);
      setReplyText('');
      setInfoReponse(
        res.emailEnvoye
          ? { type: 'ok', texte: 'Réponse envoyée par e-mail au client.' }
          : { type: 'erreur', texte: `Réponse enregistrée, mais l’e-mail n’est pas parti. ${res.raisonEmail ?? ''}` }
      );
      await loadMessages();
    } else {
      setInfoReponse({ type: 'erreur', texte: res.erreur || 'Envoi impossible.' });
    }
  };

  const handleMarkAsRead = useCallback(async () => {
    if (!selectedId) return;
    const ok = await marquerCommeLu(selectedId);
    if (!ok) return;
    const msg = await getMessageById(selectedId);
    setSelectedMessage(msg || null);
    await loadMessages();
  }, [selectedId, loadMessages]);

  const nonLus = messages.filter((m) => m.statut === 'non_lu').length;

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Messagerie</h1>
        <p className="text-gray-600">
          Messages envoyés depuis la page contact. Répondez directement ici.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-center justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => void loadMessages()} className="text-amber-700 font-medium hover:underline">
            Réessayer
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Liste des messages */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow-md border overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
            {nonLus > 0 && (
              <span className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                {nonLus} non lu{nonLus > 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div className="p-2 border-b border-gray-100">
            <select
              value={filterStatut}
              onChange={(e) => {
                const next = e.target.value;
                setFilterStatut(next);
                void loadMessages(next);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 bg-white text-sm"
            >
              <option value="">Tous les statuts</option>
              <option value="non_lu">Non lu</option>
              <option value="lu">Lu</option>
              <option value="repondu">Répondu</option>
            </select>
          </div>
          <div className="overflow-y-auto max-h-[500px]">
            {loading ? (
              <div className="p-6 text-center text-gray-500">Chargement...</div>
            ) : messages.length === 0 ? (
              <div className="p-6 text-center text-gray-500">Aucun message.</div>
            ) : (
              messages.map((msg) => (
                <button
                  key={msg._id}
                  type="button"
                  onClick={() => {
                    void handleSelectMessage(msg._id);
                  }}
                  className={`w-full text-left p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                    selectedId === msg._id ? 'bg-orange-50 border-l-4 border-l-orange-500' : ''
                  } ${msg.statut === 'non_lu' ? 'font-semibold' : ''}`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-gray-900 truncate flex-1">{msg.sujet}</span>
                    <span className={`px-2 py-0.5 text-xs rounded-full shrink-0 ${statutColor[msg.statut] || 'bg-gray-100 text-gray-800'}`}>
                      {statutLabel[msg.statut] || msg.statut}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1 truncate">{msg.nom} · {msg.email}</p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(msg.createdAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Détail + réponse */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md border overflow-hidden flex flex-col">
          {!selectedMessage ? (
            <div className="flex-1 flex items-center justify-center p-12 text-gray-500">
              Sélectionnez un message pour le lire et y répondre.
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-gray-200 overflow-y-auto flex-1">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-900">{selectedMessage.sujet}</h2>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${statutColor[selectedMessage.statut] || 'bg-gray-100'}`}>
                      {statutLabel[selectedMessage.statut]}
                    </span>
                    {selectedMessage.statut === 'non_lu' && (
                      <button
                        type="button"
                        onClick={() => {
                          void handleMarkAsRead();
                        }}
                        className="px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800 hover:bg-blue-200"
                      >
                        Marquer lu
                      </button>
                    )}
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-700 mb-4">
                  <p><strong>De :</strong> {selectedMessage.nom} &lt;{selectedMessage.email}&gt;</p>
                  <p><strong>Reçu le :</strong> {formatDate(selectedMessage.createdAt)}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg text-gray-900 whitespace-pre-wrap">
                  {selectedMessage.message}
                </div>

                {/* Réponses déjà envoyées */}
                {selectedMessage.reponses && selectedMessage.reponses.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Réponses envoyées</h3>
                    <div className="space-y-3">
                      {(selectedMessage.reponses as ReponseMessage[]).map((rep, i) => (
                        <div key={rep._id || i} className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                          <p className="text-xs text-gray-600 mb-1">
                            {rep.auteur} · {rep.date ? formatDate(rep.date) : ''}
                          </p>
                          <p className="text-gray-900 whitespace-pre-wrap">{rep.corps}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Formulaire de réponse */}
                <form onSubmit={handleReply} className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Répondre</h3>
                  <p className="text-xs text-gray-600 mb-2">
                    Votre réponse est enregistrée ici et envoyée par e-mail à {selectedMessage.email}. Le client peut répondre directement à ce message.
                  </p>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows={4}
                    placeholder="Écrivez votre réponse..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-900 bg-white"
                    required
                  />
                  {infoReponse && (
                    <p className={`mt-2 rounded-lg p-2 text-sm ${infoReponse.type === 'ok' ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-800'}`}>{infoReponse.texte}</p>
                  )}
                  <button
                    type="submit"
                    disabled={sendingReply || !replyText.trim()}
                    className="mt-3 px-6 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
                  >
                    {sendingReply ? 'Envoi...' : 'Enregistrer la réponse'}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
