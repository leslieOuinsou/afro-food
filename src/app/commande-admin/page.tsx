'use client';

import { useState } from 'react';

interface Order {
  id: string;
  customerName: string;
  items: string;
  total: string;
  address: string;
  status: 'Nouvelle' | 'En cours' | 'Livrée';
}

const orders: Order[] = [
  {
    id: 'AM001',
    customerName: 'Fatoumata Diallo',
    items: '1x Poulet Yassa, 1x Riz Jollof',
    total: '8000.00 FCFA',
    address: 'Adresse: Rue 12, Quartier Plateau, Abidjan',
    status: 'Nouvelle'
  },
  {
    id: 'AM002',
    customerName: 'Amadou Traoré',
    items: '2x Thiéboudienne, 1x Alloco',
    total: '12000.00 FCFA',
    address: 'Adresse: Avenue 05, Cocody, Abidjan',
    status: 'En cours'
  },
  {
    id: 'AM003',
    customerName: 'Aissatou Ba',
    items: '1x Mafé Boeuf, 1x Attiéké Poisson',
    total: '9500.00 FCFA',
    address: 'Adresse: Boulevard de la République, Yopougon',
    status: 'Livrée'
  },
  {
    id: 'AM004',
    customerName: 'Ibrahima Sarr',
    items: '1x Poulet Yassa, 2x Riz Jollof',
    total: '11000.00 FCFA',
    address: 'Adresse: Rue 15, Marcory, Abidjan',
    status: 'Nouvelle'
  }
];

export default function CommandeAdminPage() {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Nouvelle':
        return 'bg-blue-100 text-blue-800';
      case 'En cours':
        return 'bg-orange-100 text-orange-800';
      case 'Livrée':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-blue-900 h-12 flex items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <span className="text-white font-bold text-lg">AfriMiam</span>
        </div>
        <div className="relative">
          <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white"></div>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="w-64 bg-blue-900 text-white">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <span className="font-bold text-xl">AfriMiam</span>
            </div>

            <nav className="space-y-2">
              <a
                href="#"
                className="flex items-center gap-3 px-4 py-3 bg-gray-700 rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Commandes</span>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span>Tableau de Bord</span>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <span>Produits</span>
              </a>
            </nav>

            <div className="border-t border-gray-700 my-4"></div>

            <nav className="space-y-2">
              <a
                href="#"
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>Paramètres</span>
              </a>
              <a
                href="#"
                className="flex items-center gap-3 px-4 py-3 hover:bg-gray-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Déconnexion</span>
              </a>
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">Gestion des Commandes</h1>

          {/* Search and Filter */}
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              placeholder="Rechercher par ID ou client..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <select className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option>Tout</option>
              <option>Nouvelle</option>
              <option>En cours</option>
              <option>Livrée</option>
            </select>
          </div>

          <div className="flex gap-6">
            {/* Order Cards */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-gray-800">Commande #{order.id}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4">
                    <p className="text-gray-700">
                      <span className="font-semibold">Client:</span> {order.customerName}
                    </p>
                    <p className="text-gray-600 text-sm">{order.items}</p>
                    <p className="text-gray-700 font-semibold">Total: {order.total}</p>
                    <p className="text-gray-600 text-sm">{order.address}</p>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Voir Détails
                    </button>
                    {order.status !== 'Livrée' && (
                      <button className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors">
                        Marquer comme Livrée
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Details Panel */}
            <div className="w-96 bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
              {selectedOrder ? (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Détails de la Commande #{selectedOrder.id}
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Client</p>
                      <p className="font-semibold text-gray-800">{selectedOrder.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Articles</p>
                      <p className="text-gray-800">{selectedOrder.items}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total</p>
                      <p className="font-semibold text-gray-800">{selectedOrder.total}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Adresse</p>
                      <p className="text-gray-800">{selectedOrder.address}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Statut</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="text-center">Sélectionnez une commande pour voir les détails.</p>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 px-8 py-4">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-600">© 2025 AfriMiam. All rights reserved.</p>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Made with</span>
            <div className="w-4 h-4 bg-purple-600 rounded flex items-center justify-center">
              <span className="text-white text-xs font-bold">V</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

