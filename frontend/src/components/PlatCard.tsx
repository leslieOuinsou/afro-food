interface PlatCardProps {
  nom: string;
  description: string;
  prix: string;
  image: string;
  /** Pour l'intégration panier : id du plat, prix unitaire (nombre), callback au clic sur "Ajouter au panier" */
  id?: string;
  prixUnitaire?: number;
  onAddToCart?: () => void;
  /** Masquer le prix et le bouton "Ajouter au panier" (ex. page d'accueil) */
  hidePriceAndCart?: boolean;
}

export default function PlatCard({ nom, description, prix, image, onAddToCart, hidePriceAndCart }: PlatCardProps) {
  const handleAdd = () => {
    if (onAddToCart) onAddToCart();
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
      {/* Image du plat */}
      <div className="w-full h-48 bg-gray-200 relative overflow-hidden">
        <img 
          src={image} 
          alt={nom}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>
      
      {/* Contenu */}
      <div className="p-4">
        <h3 className="text-xl font-bold text-gray-800 mb-2">{nom}</h3>
        <p className={`text-gray-600 text-sm line-clamp-2 ${hidePriceAndCart ? '' : 'mb-4'}`}>{description}</p>
        {!hidePriceAndCart && (
          <div className="flex items-center justify-between mt-4">
            <span className="text-2xl font-bold text-gray-800">{prix}</span>
            <button
              type="button"
              onClick={handleAdd}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Ajouter au panier
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

