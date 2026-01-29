'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';

interface Plat {
  id: number;
  nom: string;
  quantite: number;
  prix: number;
}

interface Commande {
  id: number;
  numeroCommande: string;
  client: {
    nom: string;
    email: string;
    telephone: string;
    adresse: string;
  };
  plats: Plat[];
  statut: 'en_attente' | 'confirmee' | 'en_preparation' | 'en_livraison' | 'livree' | 'annulee';
  montantTotal: number;
  dateCommande: string;
  dateEstimeeLivraison: string;
  modePaiement: 'carte' | 'especes' | 'mobile';
  notes?: string;
}

const statutsCommande = [
  { value: 'en_attente', label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'confirmee', label: 'Confirmée', color: 'bg-blue-100 text-blue-800' },
  { value: 'en_preparation', label: 'En préparation', color: 'bg-orange-100 text-orange-800' },
  { value: 'en_livraison', label: 'En livraison', color: 'bg-purple-100 text-purple-800' },
  { value: 'livree', label: 'Livrée', color: 'bg-green-100 text-green-800' },
  { value: 'annulee', label: 'Annulée', color: 'bg-red-100 text-red-800' }
];

const commandesInitiales: Commande[] = [
  {
    id: 1,
    numeroCommande: 'CMD-2025-001',
    client: {
      nom: 'Fatoumata Diallo',
      email: 'fatoumata.diallo@email.com',
      telephone: '+33 6 12 34 56 78',
      adresse: '12 Rue de la Paix, 75001 Paris'
    },
    plats: [
      { id: 1, nom: 'Ndolé aux Crevettes', quantite: 2, prix: 18.50 },
      { id: 2, nom: 'Attieké Poisson', quantite: 1, prix: 16.00 }
    ],
    statut: 'en_preparation',
    montantTotal: 53.00,
    dateCommande: '2025-01-24T14:30:00',
    dateEstimeeLivraison: '2025-01-24T15:45:00',
    modePaiement: 'carte',
    notes: 'Pas de piment dans le ndolé s\'il vous plaît'
  },
  {
    id: 2,
    numeroCommande: 'CMD-2025-002',
    client: {
      nom: 'Amadou Traoré',
      email: 'amadou.traore@email.com',
      telephone: '+33 6 98 76 54 32',
      adresse: '45 Avenue des Champs, 75008 Paris'
    },
    plats: [
      { id: 3, nom: 'Poulet DG', quantite: 1, prix: 17.00 },
      { id: 4, nom: 'Plantain Frit', quantite: 2, prix: 7.50 }
    ],
    statut: 'en_attente',
    montantTotal: 32.00,
    dateCommande: '2025-01-24T15:15:00',
    dateEstimeeLivraison: '2025-01-24T16:30:00',
    modePaiement: 'mobile'
  },
  {
    id: 3,
    numeroCommande: 'CMD-2025-003',
    client: {
      nom: 'Aissatou Ba',
      email: 'aissatou.ba@email.com',
      telephone: '+33 7 11 22 33 44',
      adresse: '78 Boulevard Saint-Michel, 75006 Paris'
    },
    plats: [
      { id: 5, nom: 'Eru', quantite: 1, prix: 16.50 },
      { id: 6, nom: 'Jus de Bissap', quantite: 2, prix: 6.00 }
    ],
    statut: 'livree',
    montantTotal: 28.50,
    dateCommande: '2025-01-24T12:00:00',
    dateEstimeeLivraison: '2025-01-24T13:15:00',
    modePaiement: 'carte'
  },
  {
    id: 4,
    numeroCommande: 'CMD-2025-004',
    client: {
      nom: 'Ibrahima Sarr',
      email: 'ibrahima.sarr@email.com',
      telephone: '+33 6 55 44 33 22',
      adresse: '23 Rue du Commerce, 75015 Paris'
    },
    plats: [
      { id: 7, nom: 'Poisson Braisé', quantite: 2, prix: 19.00 },
      { id: 8, nom: 'Riz Jollof', quantite: 1, prix: 13.25 }
    ],
    statut: 'en_livraison',
    montantTotal: 51.25,
    dateCommande: '2025-01-24T13:45:00',
    dateEstimeeLivraison: '2025-01-24T15:00:00',
    modePaiement: 'especes'
  },
  {
    id: 5,
    numeroCommande: 'CMD-2025-005',
    client: {
      nom: 'Mariam Diallo',
      email: 'mariam.diallo@email.com',
      telephone: '+33 6 77 88 99 00',
      adresse: '67 Rue de Rivoli, 75001 Paris'
    },
    plats: [
      { id: 9, nom: 'Sauce Arachide', quantite: 1, prix: 14.50 },
      { id: 10, nom: 'Beignet Haricot', quantite: 3, prix: 7.83 }
    ],
    statut: 'confirmee',
    montantTotal: 38.00,
    dateCommande: '2025-01-24T11:20:00',
    dateEstimeeLivraison: '2025-01-24T12:35:00',
    modePaiement: 'carte',
    notes: 'Merci de sonner à l\'interphone'
  }
];

export default function CommandeAdminPage() {
  const [commandes, setCommandes] = useState<Commande[]>(commandesInitiales);
  const [filtreStatut, setFiltreStatut] = useState<string>('tous');
  const [recherche, setRecherche] = useState('');
  const [commandeSelectionnee, setCommandeSelectionnee] = useState<Commande | null>(null);

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

  const changerStatut = (commandeId: number, nouveauStatut: string) => {
    setCommandes(prev => prev.map(commande => 
      commande.id === commandeId 
        ? { ...commande, statut: nouveauStatut as Commande['statut'] }
        : commande
    ));
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

  return (
    <AdminLayout>
      <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Gestion des Commandes</h1>
            <p className="text-gray-600">Gérez et suivez toutes les commandes de votre restaurant</p>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Total Commandes</h3>
              <p className="text-3xl font-bold text-gray-900">{statistiques.total}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500 mb-2">En Attente</h3>
              <p className="text-3xl font-bold text-yellow-600">{statistiques.enAttente}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500 mb-2">En Préparation</h3>
              <p className="text-3xl font-bold text-orange-600">{statistiques.enPreparation}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm font-medium text-gray-500 mb-2">En Livraison</h3>
              <p className="text-3xl font-bold text-purple-600">{statistiques.enLivraison}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm border">
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
                              {statutsCommande.map(statut => (
                                <option key={statut.value} value={statut.value}>
                                  {statut.label}
                                </option>
                              ))}
                            </select>
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