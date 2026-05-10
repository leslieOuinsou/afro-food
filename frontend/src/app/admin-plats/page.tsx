'use client';

import { useState, useRef, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  fetchPlatsAdmin,
  createPlat,
  updatePlat,
  deletePlat,
  slugToCategorie,
  categorieToSlug,
  type PlatFormData
} from '@/services/adminPlats';
import type { Plat } from '@/services/plats';

const categories = [
  'Plats Principaux',
  'Accompagnements',
  'Boissons',
  'Desserts',
  'Spécialités Africaines',
  'Végétarien'
];

const paysOptions = [
  { value: 'cameroun', label: 'Cameroun' },
  { value: 'benin', label: 'Bénin' },
  { value: 'senegal', label: 'Sénégal' },
  { value: 'cote-ivoire', label: "Côte d'Ivoire" },
  { value: 'multiple', label: 'Multiple' }
];

type PlatAdmin = {
  id: string;
  nom: string;
  description: string;
  prix: string;
  categorie: string;
  image: string;
  pays?: string;
};

function platApiToAdmin(p: Plat): PlatAdmin {
  const cat = p.categorie || 'plats-principaux';
  const prix = typeof p.prix === 'number'
    ? new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(p.prix)
    : String(p.prix);
  return {
    id: p._id,
    nom: p.nom,
    description: p.description,
    prix,
    categorie: slugToCategorie[cat] || cat,
    image: p.images?.principale || '',
    pays: p.origineAfricaine?.pays
  };
}

export default function AdminPlatsPage() {
  const [plats, setPlats] = useState<PlatAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [formData, setFormData] = useState<PlatFormData>({
    nom: '',
    description: '',
    prix: '',
    categorie: 'Plats Principaux',
    image: '',
    pays: 'cameroun'
  });
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPlats = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPlatsAdmin();
      if (res.success && res.data) {
        const list = (res.data as { plats?: Plat[] }).plats;
        if (Array.isArray(list) && list.length > 0) {
          setPlats(list.map(platApiToAdmin));
        } else {
          setPlats([]);
        }
      } else {
        setPlats([]);
        setError(res.message || 'Erreur chargement plats. Vérifiez que le backend est démarré (port 5000).');
      }
    } catch (err) {
      setPlats([]);
      setError('Impossible de charger les plats. Vérifiez que le backend est démarré (dossier backend → npm run dev, port 5000).');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlats();
  }, []);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Veuillez sélectionner une image valide');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 5MB");
      return;
    }
    setImageFile(file);
    setUploading(true);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);

    try {
      const form = new FormData();
      form.append('file', file);
      const response = await fetch('/api/upload-image', { method: 'POST', body: form });
      const data = await response.json();
      if (response.ok && data.success) {
        setFormData((prev) => ({ ...prev, image: data.url }));
        setImagePreview(data.url);
      } else {
        setError(data?.error || "Upload impossible. Utilisez une URL d'image publique.");
      }
    } catch {
      setError("Upload impossible. Utilisez une URL d'image publique.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom || !formData.description || !formData.prix) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    if (!isEditing && !formData.image) {
      alert('Veuillez sélectionner une image');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEditing && editingId) {
        const res = await updatePlat(editingId, formData);
        if (res.success) {
          await loadPlats();
          alert(`Le plat "${formData.nom}" a été modifié avec succès. Il apparaîtra sur la page Menu.`);
          resetForm();
        } else {
          setError(res.message || 'Erreur modification');
        }
      } else {
        const res = await createPlat(formData);
        if (res.success) {
          await loadPlats();
          alert(`Le plat "${formData.nom}" a été ajouté avec succès. Il apparaîtra sur la page Menu.`);
          resetForm();
        } else {
          setError(res.message || 'Erreur création');
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (plat: PlatAdmin) => {
    setFormData({
      nom: plat.nom,
      description: plat.description,
      prix: plat.prix,
      categorie: plat.categorie,
      image: plat.image,
      pays: plat.pays || 'cameroun'
    });
    setImagePreview(plat.image);
    setIsEditing(true);
    setEditingId(plat.id);
    setImageFile(null);
    setError(null);
    // Afficher le formulaire (au cas où il aurait été masqué)
    document.getElementById('form-section')?.classList.remove('hidden');
    setTimeout(() => {
      document.querySelector('form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const handleDelete = async (id: string) => {
    const plat = plats.find((p) => p.id === id);
    if (!confirm(`Supprimer "${plat?.nom || 'ce plat'}" ? Cette action est irréversible.`)) return;
    setSaving(true);
    setError(null);
    try {
      const res = await deletePlat(id);
      if (res.success) {
        await loadPlats();
        if (editingId === id) resetForm();
      } else {
        setError(res.message || 'Erreur suppression');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur réseau');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      description: '',
      prix: '',
      categorie: 'Plats Principaux',
      image: '',
      pays: 'cameroun'
    });
    setImagePreview('');
    setImageFile(null);
    setIsEditing(false);
    setEditingId(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredPlats = plats.filter((plat) => {
    const matchSearch =
      !searchTerm ||
      plat.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plat.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = !filterCategory || plat.categorie === filterCategory;
    return matchSearch && matchCat;
  });

  return (
    <AdminLayout>
      <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Gestion des Plats</h1>
            <p className="text-gray-600">
              Les plats que vous modifiez ici sont <strong>ceux affichés sur la page Menu</strong> du site.
              Ajoutez, modifiez ou supprimez des plats : les changements sont enregistrés sur le serveur.
              Rafraîchir la page Menu pour voir les mises à jour.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Liste des plats existants — CRUD : modifier / supprimer depuis ici */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Liste des plats existants</h2>
                <p className="text-gray-600 mt-1">{plats.length} plat(s) — modifiez ou supprimez ci-dessous, ou ajoutez-en un nouveau</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => loadPlats()}
                  disabled={loading}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Rafraîchir la liste
                </button>
                <button
                  type="button"
                  onClick={() => {
                    document.getElementById('form-section')?.classList.remove('hidden');
                    resetForm();
                    document.querySelector('form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Ajouter un plat
                </button>
              </div>
            </div>

            <div className="mb-6 flex gap-4">
              <div className="flex-1 relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Rechercher par nom ou description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white placeholder:text-gray-500"
                />
              </div>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
              >
                <option value="">Toutes les catégories</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <div className="text-center py-12 text-gray-500">Chargement des plats...</div>
            ) : (
              <div className="space-y-4 max-h-[calc(100vh-420px)] overflow-y-auto">
                {filteredPlats.map((plat) => (
                  <div
                    key={plat.id}
                    className={`border rounded-lg p-4 hover:shadow-md transition-shadow ${
                      isEditing && editingId === plat.id ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                        <img src={plat.image || '/images/plats/placeholder.svg'} alt={plat.nom} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-800 mb-1">{plat.nom}</h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{plat.description}</p>
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div>
                            <span className="text-sm text-gray-500">{plat.categorie}</span>
                            <span className="ml-2 font-semibold text-orange-500">{plat.prix}</span>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleEdit(plat)}
                              disabled={isEditing && editingId === plat.id}
                              className="px-4 py-2 text-sm rounded-lg bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 flex items-center gap-1"
                            >
                              Modifier
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(plat.id)}
                              disabled={isEditing && editingId === plat.id}
                              className="px-4 py-2 text-sm rounded-lg bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 flex items-center gap-1"
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredPlats.length === 0 && (
                  <div className="text-center py-12 text-gray-600 max-w-md mx-auto">
                    {plats.length === 0 ? (
                      <>
                        <p className="text-lg font-medium mb-2">Aucun plat pour le moment</p>
                        <p className="text-sm mb-4">La liste des plats s&apos;affiche ici une fois que vous en avez créé ou que le backend en contient.</p>
                        <p className="text-sm font-medium mb-1">Pour voir des plats dans la liste :</p>
                        <ol className="text-sm text-left list-decimal list-inside space-y-1 mb-4">
                          <li>Démarrez le backend (dossier <code className="bg-gray-100 px-1 rounded">backend</code> → <code className="bg-gray-100 px-1 rounded">npm run dev</code>, port 5000)</li>
                          <li>Optionnel : exécutez <code className="bg-gray-100 px-1 rounded">npm run seed</code> dans le dossier backend pour insérer des plats de démo</li>
                          <li>Cliquez sur &quot;Rafraîchir la liste&quot; ou sur &quot;Ajouter un plat&quot; pour créer le premier</li>
                        </ol>
                        <p className="text-sm">Les plats que vous ajoutez apparaîtront ici avec les boutons Modifier et Supprimer.</p>
                      </>
                    ) : (
                      <p className="text-lg font-medium">Aucun résultat pour cette recherche.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Formulaire : ajouter ou modifier un plat */}
          <div className="mb-6">
            <button
              type="button"
              onClick={() => {
                document.getElementById('form-section')?.classList.toggle('hidden');
                if (!isEditing) resetForm();
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
                {isEditing ? 'Modifier le plat' : 'Ajouter un plat'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Nom du plat *</label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                    placeholder="Ex: Ndolé aux Crevettes"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                    rows={4}
                    placeholder="Décrivez le plat..."
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Prix *</label>
                    <input
                      type="text"
                      value={formData.prix}
                      onChange={(e) => setFormData({ ...formData, prix: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                      placeholder="Ex: 18,50 ou 18.50"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-900 mb-2">Catégorie *</label>
                    <select
                      value={formData.categorie}
                      onChange={(e) => setFormData({ ...formData, categorie: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                      required
                    >
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Pays d&apos;origine</label>
                  <select
                    value={formData.pays || 'cameroun'}
                    onChange={(e) => setFormData({ ...formData, pays: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 text-gray-900 bg-white"
                  >
                    {paysOptions.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Image du plat {!isEditing && '*'}
                    {isEditing && <span className="text-gray-600 text-xs ml-2">(vide = garder l&apos;image actuelle)</span>}
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={uploading}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 text-gray-900 bg-white"
                    required={!isEditing}
                  />
                  <p className="text-xs text-gray-700 mt-1">JPG, PNG, WebP — max 5MB</p>
                  {uploading && <p className="text-sm text-blue-600 mt-1">Upload en cours...</p>}
                  {imagePreview && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-900 mb-2">Aperçu</p>
                      <div className="relative w-full h-48 border border-gray-300 rounded-lg overflow-hidden">
                        <img src={imagePreview} alt="Aperçu" className="w-full h-full object-cover" />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                  >
                    {saving ? 'Enregistrement...' : isEditing ? 'Modifier le plat' : 'Ajouter le plat'}
                  </button>
                  {isEditing && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
    </AdminLayout>
  );
}
