'use client';

import { useState, useRef, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { plats as initialPlats, Plat } from '@/data/plats';

const categories = [
  'Plats Principaux',
  'Accompagnements',
  'Boissons',
  'Desserts',
  'Spécialités Africaines',
  'Végétarien'
];

export default function AdminPlatsPage() {
  // Charger les plats depuis le fichier partagé
  const [plats, setPlats] = useState<Plat[]>(initialPlats);

  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    prix: '',
    categorie: 'Plats Principaux',
    image: ''
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        alert('Veuillez sélectionner une image valide');
        return;
      }

      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('L\'image ne doit pas dépasser 5MB');
        return;
      }

      setImageFile(file);
      setUploading(true);

      // Créer une prévisualisation immédiate
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Uploader l'image au serveur
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload-image', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Utiliser l'URL retournée par le serveur
          setFormData({ ...formData, image: data.url });
          setImagePreview(data.url);
        } else {
          alert(data.error || 'Erreur lors de l\'upload de l\'image');
          // En cas d'erreur, utiliser la prévisualisation en base64
          setFormData({ ...formData, image: reader.result as string });
        }
      } catch (error) {
        console.error('Erreur upload:', error);
        alert('Erreur lors de l\'upload de l\'image');
        // En cas d'erreur, utiliser la prévisualisation en base64
        const reader2 = new FileReader();
        reader2.onloadend = () => {
          setFormData({ ...formData, image: reader2.result as string });
        };
        reader2.readAsDataURL(file);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.nom || !formData.description || !formData.prix) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }

    // Pour la modification, l'image n'est pas obligatoire si on garde l'ancienne
    if (!isEditing && !formData.image) {
      alert('Veuillez sélectionner une image');
      return;
    }

    if (isEditing && editingId !== null) {
      // Modifier un plat existant
      // Si aucune nouvelle image n'a été uploadée, garder l'ancienne
      const updatedPlat: Plat = {
        id: editingId,
        nom: formData.nom,
        description: formData.description,
        prix: formData.prix,
        categorie: formData.categorie,
        image: formData.image || plats.find(p => p.id === editingId)?.image || ''
      };
      
      const updatedPlats = plats.map(plat => 
        plat.id === editingId ? updatedPlat : plat
      );
      setPlats(updatedPlats);
      
      // Sauvegarder dans localStorage pour persister les modifications
      localStorage.setItem('plats', JSON.stringify(updatedPlats));
      
      alert(`Le plat "${formData.nom}" a été modifié avec succès !`);
    } else {
      // Ajouter un nouveau plat
      const newPlat: Plat = {
        id: plats.length > 0 ? Math.max(...plats.map(p => p.id)) + 1 : 1,
        ...formData
      };
      const updatedPlats = [...plats, newPlat];
      setPlats(updatedPlats);
      
      // Sauvegarder dans localStorage
      localStorage.setItem('plats', JSON.stringify(updatedPlats));
      
      alert(`Le plat "${formData.nom}" a été ajouté avec succès !`);
    }

    // Réinitialiser le formulaire
    resetForm();
  };

  const handleEdit = (plat: Plat) => {
    setFormData({
      nom: plat.nom,
      description: plat.description,
      prix: plat.prix,
      categorie: plat.categorie,
      image: plat.image
    });
    setImagePreview(plat.image);
    setIsEditing(true);
    setEditingId(plat.id);
    setImageFile(null);
    
    // Scroll vers le formulaire
    setTimeout(() => {
      const formElement = document.querySelector('form');
      if (formElement) {
        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const handleDelete = (id: number) => {
    const platToDelete = plats.find(p => p.id === id);
    const platName = platToDelete?.nom || 'ce plat';
    
    if (confirm(`Êtes-vous sûr de vouloir supprimer "${platName}" ?\n\nCette action est irréversible.`)) {
      const updatedPlats = plats.filter(plat => plat.id !== id);
      setPlats(updatedPlats);
      
      // Sauvegarder dans localStorage
      localStorage.setItem('plats', JSON.stringify(updatedPlats));
      
      // Si on supprime le plat en cours d'édition, réinitialiser le formulaire
      if (editingId === id) {
        resetForm();
      }
    }
  };

  // Charger les plats depuis localStorage au chargement
  useEffect(() => {
    const savedPlats = localStorage.getItem('plats');
    if (savedPlats) {
      try {
        const parsedPlats = JSON.parse(savedPlats);
        setPlats(parsedPlats);
      } catch (error) {
        console.error('Erreur lors du chargement des plats:', error);
      }
    }
  }, []);

  const resetForm = () => {
    setFormData({
      nom: '',
      description: '',
      prix: '',
      categorie: 'Plats Principaux',
      image: ''
    });
    setImagePreview('');
    setImageFile(null);
    setIsEditing(false);
    setEditingId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-64">
        {/* Header */}
        <AdminHeader />

        {/* Main Content */}
        <main className="flex-1 p-8">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestion des Plats</h1>
            <p className="text-gray-600">Ajoutez, modifiez ou supprimez les plats de votre menu</p>
          </div>

          {/* Section Formulaire - Collapsible */}
          <div className="mb-6">
            <button
              onClick={() => {
                const formSection = document.getElementById('form-section');
                if (formSection) {
                  formSection.classList.toggle('hidden');
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              {isEditing ? 'Modifier un plat' : 'Ajouter un nouveau plat'}
            </button>
          </div>

          <div id="form-section" className={`mb-8 ${!isEditing ? 'hidden' : ''}`}>
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6">
                {isEditing ? 'Modifier un plat' : 'Ajouter un nouveau plat'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nom du plat *
                  </label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ex: Ndolé aux Crevettes"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Décrivez le plat..."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Prix *
                    </label>
                    <input
                      type="text"
                      value={formData.prix}
                      onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Ex: 18,50 €"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Catégorie *
                    </label>
                    <select
                      value={formData.categorie}
                      onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image du plat {!isEditing && '*'}
                    {isEditing && <span className="text-gray-500 text-xs font-normal ml-2">(Laisser vide pour garder l'image actuelle)</span>}
                  </label>
                  <div className="space-y-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={uploading}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      required={!isEditing}
                    />
                    <p className="text-xs text-gray-500">
                      Formats acceptés: JPG, PNG, WebP (max 5MB)
                    </p>
                    {uploading && (
                      <p className="text-sm text-blue-600 flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Upload en cours...
                      </p>
                    )}
                  </div>

                  {imagePreview && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        {isEditing ? 'Image actuelle / Nouvelle image:' : 'Aperçu:'}
                      </p>
                      <div className="relative w-full h-48 border border-gray-300 rounded-lg overflow-hidden">
                        <img
                          src={imagePreview}
                          alt="Aperçu"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    {isEditing ? 'Modifier le plat' : 'Ajouter le plat'}
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Liste des plats - Vue principale */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">
                  Liste des plats
                </h2>
                <p className="text-gray-600 mt-1">{plats.length} plat{plats.length > 1 ? 's' : ''} disponible{plats.length > 1 ? 's' : ''}</p>
              </div>
              <button
                onClick={() => {
                  const formSection = document.getElementById('form-section');
                  if (formSection) {
                    formSection.classList.remove('hidden');
                    setTimeout(() => {
                      const formElement = document.querySelector('form');
                      if (formElement) {
                        formElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }, 100);
                  }
                  if (!isEditing) {
                    resetForm();
                  }
                }}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Ajouter un plat
              </button>
            </div>

            {/* Barre de recherche et filtres */}
            <div className="mb-6 flex gap-4">
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher un plat par nom ou description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <select 
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Toutes les catégories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Liste des plats */}
            <div className="space-y-4 max-h-[calc(100vh-400px)] overflow-y-auto">
                {plats
                  .filter(plat => {
                    const matchesSearch = searchTerm === '' || 
                      plat.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                      plat.description.toLowerCase().includes(searchTerm.toLowerCase());
                    const matchesCategory = filterCategory === '' || plat.categorie === filterCategory;
                    return matchesSearch && matchesCategory;
                  })
                  .map((plat) => (
                  <div
                    key={plat.id}
                    className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                      isEditing && editingId === plat.id
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    {isEditing && editingId === plat.id && (
                      <div className="mb-2 flex items-center gap-2 text-blue-600 text-sm font-medium">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        En cours de modification
                      </div>
                    )}
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={plat.image}
                          alt={plat.nom}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 mb-1">{plat.nom}</h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{plat.description}</p>
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm text-gray-500">{plat.categorie}</span>
                            <span className="ml-2 font-semibold text-orange-500">{plat.prix}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(plat)}
                              disabled={isEditing && editingId === plat.id}
                              className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                                isEditing && editingId === plat.id
                                  ? 'bg-gray-400 text-white cursor-not-allowed'
                                  : 'bg-blue-500 text-white hover:bg-blue-600'
                              }`}
                              title={isEditing && editingId === plat.id ? 'Plat en cours de modification' : 'Modifier ce plat'}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              {isEditing && editingId === plat.id ? 'En édition' : 'Modifier'}
                            </button>
                            <button
                              onClick={() => handleDelete(plat.id)}
                              disabled={isEditing && editingId === plat.id}
                              className={`px-4 py-2 text-sm rounded-lg transition-colors flex items-center gap-1 ${
                                isEditing && editingId === plat.id
                                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  : 'bg-red-500 text-white hover:bg-red-600'
                              }`}
                              title={isEditing && editingId === plat.id ? 'Annulez d\'abord la modification' : 'Supprimer ce plat'}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {plats.filter(plat => {
                  const matchesSearch = searchTerm === '' || 
                    plat.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    plat.description.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesCategory = filterCategory === '' || plat.categorie === filterCategory;
                  return matchesSearch && matchesCategory;
                }).length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    {plats.length === 0 ? (
                      <>
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                        </svg>
                        <p className="text-lg font-medium mb-2">Aucun plat pour le moment</p>
                        <p className="text-sm">Commencez par ajouter votre premier plat</p>
                      </>
                    ) : (
                      <>
                        <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <p className="text-lg font-medium mb-2">Aucun résultat trouvé</p>
                        <p className="text-sm">Essayez de modifier vos critères de recherche</p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
        </main>
      </div>
    </div>
  );
}
