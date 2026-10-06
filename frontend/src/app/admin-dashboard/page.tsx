'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/admin/AdminLayout';
import { getPublicStats, getAdminCommandesStats, telechargerExportCommandes } from '@/services/adminStats';
import { getCommandes } from '@/services/adminCommandes';

interface StatCard {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  color: string;
}

const statLabels: StatCard[] = [
  { title: 'Commandes (mois)', value: '—', change: 'Depuis le serveur', color: 'bg-blue-500', icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg> },
  { title: 'Revenus (mois)', value: '—', change: 'Depuis le serveur', color: 'bg-green-500', icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
  { title: 'Plats Disponibles', value: '—', change: 'Depuis le serveur', color: 'bg-orange-500', icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg> },
  { title: 'Clients Actifs', value: '—', change: 'Depuis le serveur', color: 'bg-purple-500', icon: <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
];

function formatTimeAgo(dateStr: string): string {
  const d = new Date(dateStr);
  const diffM = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffM < 60) return `Il y a ${diffM} min`;
  const diffH = Math.floor(diffM / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  return `Il y a ${Math.floor(diffH / 24)}j`;
}

const statusLabel: Record<string, string> = {
  livree: 'Livrée', en_preparation: 'En préparation', en_attente: 'Nouvelle',
  confirmee: 'Confirmée', en_livraison: 'En livraison', annulee: 'Annulée', prete: 'Prête', remboursee: 'Remboursée'
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<StatCard[]>(statLabels);
  const [recentOrders, setRecentOrders] = useState<Array<{ id: string; client: string; montant: string; status: string; time: string }>>([]);
  const [topPlats, setTopPlats] = useState<Array<{ nom: string; commandes: number; revenu: string }>>([]);
  const [evolutionRevenus, setEvolutionRevenus] = useState<Array<{ label: string; valeur: number }>>([]);
  const [exportErreur, setExportErreur] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [publicStats, adminStats, commandesRes] = await Promise.all([
        getPublicStats(),
        getAdminCommandesStats(),
        getCommandes({ limite: 5 })
      ]);
      if (cancelled) return;
      if (publicStats) {
        setStats(prev => [
          { ...prev[0], value: adminStats?.statistiques ? String(adminStats.statistiques.totalCommandes) : '—', change: prev[0].change },
          { ...prev[1], value: adminStats?.statistiques ? `${Number(adminStats.statistiques.totalRevenu || 0).toFixed(0)} €` : '—', change: prev[1].change },
          { ...prev[2], value: String(publicStats.nombrePlats), change: `${publicStats.nombreCategories} catégories` },
          { ...prev[3], value: String(publicStats.nombreUtilisateursActifs), change: 'Clients inscrits' },
        ]);
      }
      const parJour = new Map(
        (adminStats?.evolutionQuotidienne ?? []).map((e) => [
          `${e._id.annee}-${e._id.mois}-${e._id.jour}`,
          e.revenus ?? 0,
        ])
      );
      setEvolutionRevenus(
        Array.from({ length: 7 }, (_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - (6 - i));
          return {
            label: d.toLocaleDateString('fr-FR', { weekday: 'short' }),
            valeur: parJour.get(`${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`) ?? 0,
          };
        })
      );
      setTopPlats(
        (adminStats?.topPlats ?? []).map((t) => ({
          nom: t.nom,
          commandes: t.quantite,
          revenu: `${t.chiffreAffaires.toFixed(2)} €`,
        }))
      );
      if (commandesRes.commandes?.length) {
        setRecentOrders(commandesRes.commandes.slice(0, 5).map(c => ({
          id: c.numeroCommande,
          client: c.client.nom,
          montant: `${c.montantTotal.toFixed(2)} €`,
          status: statusLabel[c.statut] || c.statut,
          time: formatTimeAgo(c.dateCommande)
        })));
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const getStatusColor = (status: string) => {
    if (status === 'Livrée' || status === 'livree') return 'bg-green-100 text-green-800';
    if (status === 'En cours' || status === 'En préparation' || status === 'en_preparation' || status === 'en_livraison') return 'bg-orange-100 text-orange-800';
    if (status === 'Nouvelle' || status === 'en_attente' || status === 'Confirmée' || status === 'confirmee') return 'bg-blue-100 text-blue-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <AdminLayout>
      <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Tableau de Bord</h1>
            <p className="text-gray-600">Vue d'ensemble de votre activité</p>
            <button
              type="button"
              onClick={async () => setExportErreur((await telechargerExportCommandes()) ?? '')}
              className="mt-3 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Exporter les commandes (CSV)
            </button>
            {exportErreur && <p className="mt-2 text-sm text-red-600">{exportErreur}</p>}
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-8">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${stat.color} p-3 rounded-lg text-white`}>
                    {stat.icon}
                  </div>
                  <span className="text-sm text-green-600 font-medium">{stat.change}</span>
                </div>
                <h3 className="text-sm text-gray-600 mb-1">{stat.title}</h3>
                <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Commandes Récentes */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Commandes Récentes</h2>
                <Link
                  href="/commande-admin"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Voir tout →
                </Link>
              </div>
              <div className="space-y-4">
                {!loading && recentOrders.length === 0 && (
                  <p className="text-sm text-gray-500">Aucune commande.</p>
                )}
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold text-gray-800">#{order.id}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{order.client}</p>
                      <p className="text-xs text-gray-500 mt-1">{order.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">{order.montant}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Plats */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-800">Plats les Plus Populaires</h2>
                <Link
                  href="/admin-plats"
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Voir tout →
                </Link>
              </div>
              <div className="space-y-4">
                {!loading && topPlats.length === 0 && (
                  <p className="text-sm text-gray-500">Aucune vente sur la période.</p>
                )}
                {topPlats.map((plat, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                        <span className="text-orange-600 font-bold">#{index + 1}</span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800">{plat.nom}</p>
                        <p className="text-sm text-gray-600">{plat.commandes} commandes</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">{plat.revenu}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Graphique de Revenus */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">Revenus des 7 derniers jours</h2>
            <div className="h-64 flex items-end justify-between gap-2">
              {evolutionRevenus.map((jour, index) => {
                const maxVal = Math.max(...evolutionRevenus.map((j) => j.valeur), 1);
                return (
                  <div key={index} className="flex-1 flex flex-col items-center justify-end h-full">
                    <span className="text-[10px] text-gray-500 mb-1">{jour.valeur > 0 ? `${jour.valeur.toFixed(0)} €` : ''}</span>
                    <div
                      className="w-full bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-lg mb-2 transition-all hover:opacity-80"
                      style={{ height: `${(jour.valeur / maxVal) * 85}%`, minHeight: jour.valeur > 0 ? 4 : 0 }}
                    ></div>
                    <span className="text-xs text-gray-600">{jour.label}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded"></div>
                <span>Revenus (€)</span>
              </div>
            </div>
          </div>
    </AdminLayout>
  );
}
