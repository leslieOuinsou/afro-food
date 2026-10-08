'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { trackAdminOrderStatus } from '@/lib/analytics';
import { confirmerVirement, getCommandes, updateStatut, type CommandeAdmin } from '@/services/adminCommandes';

const statutsCommande = [
  { value: 'en_attente', label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'confirmee', label: 'Confirmée', color: 'bg-blue-100 text-blue-800' },
  { value: 'en_preparation', label: 'En préparation', color: 'bg-orange-100 text-orange-800' },
  { value: 'prete', label: 'Prête', color: 'bg-indigo-100 text-indigo-800' },
  { value: 'en_livraison', label: 'En livraison', color: 'bg-purple-100 text-purple-800' },
  { value: 'livree', label: 'Livrée', color: 'bg-green-100 text-green-800' },
  { value: 'annulee', label: 'Annulée', color: 'bg-red-100 text-red-800' },
  { value: 'remboursee', label: 'Remboursée', color: 'bg-gray-100 text-gray-800' }
];

// Mêmes transitions que le backend : on ne propose que les étapes autorisées
const TRANSITIONS: Record<string, string[]> = {
  en_attente: ['confirmee', 'annulee'],
  confirmee: ['en_preparation', 'annulee'],
  en_preparation: ['prete', 'annulee'],
  prete: ['en_livraison', 'annulee'],
  en_livraison: ['livree', 'annulee'],
  livree: ['remboursee'],
  annulee: [],
  remboursee: [],
};

export default function CommandeAdminPage() {
  const [commandes, setCommandes] = useState<CommandeAdmin[]>([]);
  const [filtreStatut, setFiltreStatut] = useState<string>('tous');
  const [recherche, setRecherche] = useState('');
  const [commandeSelectionnee, setCommandeSelectionnee] = useState<CommandeAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Actualisation silencieuse toutes les 8 s (les alertes « nouvelle commande » sont gérées par AdminNotifier)
  useEffect(() => {
    const tick = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const { commandes: list } = await getCommandes({ limite: 100 });
        if (list) setCommandes(list);
      } catch {
        /* on réessaie au prochain passage */
      }
    };
    const t = window.setInterval(() => void tick(), 8000);
    const auRetour = () => void tick();
    document.addEventListener('visibilitychange', auRetour);
    window.addEventListener('afro:nouvelle-commande', auRetour);
    return () => {
      window.clearInterval(t);
      document.removeEventListener('visibilitychange', auRetour);
      window.removeEventListener('afro:nouvelle-commande', auRetour);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    getCommandes({ limite: 100 }).then(({ commandes: list, error: errMsg }) => {
      if (!cancelled) {
        setCommandes(list || []);
        setError(errMsg || null);
      }
      if (!cancelled) setLoading(false);
    }).catch(() => {
      if (!cancelled) {
        setCommandes([]);
        setError('Impossible de charger les commandes. Connectez-vous en tant qu\'admin.');
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatutInfo = (statut: string) => {
    return statutsCommande.find(s => s.value === statut) || statutsCommande[0];
  };

const virementRecu = async (commande: CommandeAdmin) => {
    if (!window.confirm(`Confirmer que le virement de ${commande.montantTotal.toFixed(2)} € (${commande.numeroCommande}) est bien arrivé sur votre compte ?`)) return;
    const res = await confirmerVirement(commande.id);
    if (!res.success) {
      setError(res.error || 'Confirmation impossible.');
      return;
    }
    setError(null);
    setCommandes(prev => prev.map(c =>
      c.id === commande.id
        ? { ...c, statutPaiement: 'valide', statut: c.statut === 'en_attente' ? 'confirmee' : c.statut }
        : c
    ));
  };

const changerStatut = async (commandeId: string, nouveauStatut: string) => {
    const res = await updateStatut(commandeId, nouveauStatut);
    if (res.success) {
      trackAdminOrderStatus(nouveauStatut);
      setCommandes(prev => prev.map(commande =>
        commande.id === commandeId ? { ...commande, statut: nouveauStatut } : commande
      ));
      if (commandeSelectionnee?.id === commandeId) {
        setCommandeSelectionnee(prev => prev ? { ...prev, statut: nouveauStatut } : null);
      }
      setError(null);
    } else {
      setError(res.error || "Impossible de modifier le statut de la commande.");
    }
  };

  const commandesFiltrees = commandes.filter(commande => {
    const correspondRecherche = 
      commande.numeroCommande.toLowerCase().includes(recherche.toLowerCase()) ||
      commande.client.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      commande.client.email.toLowerCase().includes(recherche.toLowerCase());
    
    const correspondStatut = filtreStatut === 'tous' || commande.statut === filtreStatut;
    
    return correspondRecherche && correspondStatut;
  });

  const statistiques = {
    total: commandes.length,
    enAttente: commandes.filter(c => c.statut === 'en_attente').length,
    enPreparation: commandes.filter(c => c.statut === 'en_preparation').length,
    enLivraison: commandes.filter(c => c.statut === 'en_livraison').length,
    livrees: commandes.filter(c => c.statut === 'livree').length,
    revenus: commandes.filter(c => c.statut === 'livree').reduce((sum, c) => sum + c.montantTotal, 0)
  };

  const refetch = () => {
    setLoading(true);
    getCommandes({ limite: 100 }).then(({ commandes: list, error: errMsg }) => {
      setCommandes(list || []);
      setError(errMsg || null);
      setLoading(false);
    }).catch(() => {
      setCommandes([]);
      setError('Impossible de charger les commandes.');
      setLoading(false);
    });
  };

  return (
    <AdminLayout>
      <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Gestion des Commandes</h1>
            <p className="text-gray-600">Gérez et suivez toutes les commandes de votre restaurant</p>
            <p className="mt-2 text-sm text-gray-500">Actualisation automatique toutes les 8 secondes.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 flex items-center justify-between">
              <span>{error}</span>
              <button type="button" onClick={refetch} className="text-amber-700 font-medium hover:underline">Réessayer</button>
            </div>
          )}
          {loading && commandes.length === 0 && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg text-gray-600">Chargement des commandes...</div>
          )}

          {/* Statistiques */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6 mb-8">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Commandes</h3>
              <p className="text-3xl font-bold text-gray-900">{statistiques.total}</p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500 mb-2">En Attente</h3>
              <p className="text-3xl font-bold text-yellow-600">{statistiques.enAttente}</p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500 mb-2">En Préparation</h3>
              <p className="text-3xl font-bold text-orange-600">{statistiques.enPreparation}</p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500 mb-2">En Livraison</h3>
              <p className="text-3xl font-bold text-purple-600">{statistiques.enLivraison}</p>
            </div>
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Revenus Livrés</h3>
              <p className="text-3xl font-bold text-green-600">{statistiques.revenus.toFixed(2)} €</p>
            </div>
          </div>

          {/* Filtres et Recherche */}
          <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Rechercher par numéro, client ou email..."
                  value={recherche}
                  onChange={(e) => setRecherche(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <select
                  value={filtreStatut}
                  onChange={(e) => setFiltreStatut(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="tous">Tous les statuts</option>
                  {statutsCommande.map(statut => (
                    <option key={statut.value} value={statut.value}>{statut.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Liste des Commandes */}
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Commande
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Client
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Plats
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {commandesFiltrees.map((commande) => {
                    const statutInfo = getStatutInfo(commande.statut);
                    return (
                      <tr key={commande.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {commande.numeroCommande}
                            </div>
                            <div className="text-sm text-gray-500">
                              {commande.modePaiement === 'carte' ? '💳' : commande.modePaiement === 'mobile' ? '📱' : '💵'} 
                              {commande.modePaiement}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {commande.client.nom}
                            </div>
                            <div className="text-sm text-gray-500">
                              {commande.client.email}
                            </div>
                            <div className="text-sm text-gray-500">
                              {commande.client.telephone}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            {commande.plats.map((plat, index) => (
                              <div key={plat.id} className="mb-1">
                                {plat.quantite}x {plat.nom}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {commande.montantTotal.toFixed(2)} €
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statutInfo.color}`}>
                            {statutInfo.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <div>
                            <div>Commandé: {formatDate(commande.dateCommande)}</div>
                            <div className="text-xs text-gray-400">
                              Estimé: {formatDate(commande.dateEstimeeLivraison)}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-y-1">
                          <div className="flex flex-col gap-1">
                            <select
                              value={commande.statut}
                              onChange={(e) => changerStatut(commande.id, e.target.value)}
                              className="text-xs px-2 py-1 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                            >
                              {statutsCommande
                                .filter(statut => statut.value === commande.statut || (TRANSITIONS[commande.statut] ?? []).includes(statut.value))
                                .map(statut => (
                                  <option key={statut.value} value={statut.value}>
                                    {statut.label}
                                  </option>
                                ))}
                            </select>
                            {commande.modePaiement === 'virement' &&
                              (commande.statutPaiement === 'valide' ? (
                                <span className="text-xs font-semibold text-green-700">Virement reçu ✓</span>
                              ) : (
                                <>
                                  <a href="/admin-documents" className="text-xs font-semibold text-orange-700 underline">
                                    Documents
                                  </a>
                                  <button
                                    onClick={() => void virementRecu(commande)}
                                    className="rounded bg-orange-600 px-2 py-1 text-xs font-semibold text-white hover:bg-orange-700"
                                  >
                                    Virement reçu
                                  </button>
                                </>
                              ))}
                            <button
                              onClick={() => setCommandeSelectionnee(commande)}
                              className="text-xs text-blue-600 hover:text-blue-900"
                            >
                              Détails
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {commandesFiltrees.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune commande trouvée</h3>
              <p className="mt-1 text-sm text-gray-500">
                Aucune commande ne correspond à vos critères de recherche.
              </p>
            </div>
          )}

      {/* Modal Détails Commande */}
      {commandeSelectionnee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-90vh overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Détails de la commande {commandeSelectionnee.numeroCommande}
                </h2>
                <button
                  onClick={() => setCommandeSelectionnee(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Informations Client */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Informations Client</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">Nom</p>
                      <p className="text-sm text-gray-900">{commandeSelectionnee.client.nom}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Email</p>
                      <p className="text-sm text-gray-900">{commandeSelectionnee.client.email}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">Téléphone</p>
                      <p className="text-sm text-gray-900">{commandeSelectionnee.client.telephone}</p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-sm font-medium text-gray-700">Adresse de livraison</p>
                      <p className="text-sm text-gray-900">{commandeSelectionnee.client.adresse}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Détails de la commande */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Plats Commandés</h3>
                <div className="space-y-3">
                  {commandeSelectionnee.plats.map(plat => (
                    <div key={plat.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{plat.nom}</p>
                        <p className="text-sm text-gray-600">Quantité: {plat.quantite}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{(plat.prix * plat.quantite).toFixed(2)} €</p>
                        <p className="text-sm text-gray-600">{plat.prix.toFixed(2)} € / unité</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <p className="text-lg font-semibold text-gray-900">Total</p>
                    <p className="text-lg font-bold text-gray-900">{commandeSelectionnee.montantTotal.toFixed(2)} €</p>
                  </div>
                </div>
              </div>

              {/* Informations supplémentaires */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-gray-700">Date de commande</p>
                  <p className="text-sm text-gray-900">{formatDate(commandeSelectionnee.dateCommande)}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-gray-700">Livraison estimée</p>
                  <p className="text-sm text-gray-900">{formatDate(commandeSelectionnee.dateEstimeeLivraison)}</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm font-medium text-gray-700">Mode de paiement</p>
                  <p className="text-sm text-gray-900">
                    {commandeSelectionnee.modePaiement === 'carte' ? '💳 Carte bancaire' : 
                     commandeSelectionnee.modePaiement === 'mobile' ? '📱 Paiement mobile' : '💵 Espèces'}
                  </p>
                </div>
                {commandeSelectionnee.notes && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Notes</p>
                    <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{commandeSelectionnee.notes}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setCommandeSelectionnee(null)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}