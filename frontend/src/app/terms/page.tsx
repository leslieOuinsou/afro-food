'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12 text-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* En-tête */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Conditions Générales d'Utilisation</h1>
              <p className="text-gray-600">Dernière mise à jour : 15 Janvier 2025</p>
            </div>

            {/* Contenu */}
            <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">1. Acceptation des conditions</h2>
                <p className="text-gray-700 leading-relaxed">
                  En accédant et en utilisant le site web Afro-Eats, vous acceptez d'être lié par ces 
                  Conditions Générales d'Utilisation. Si vous n'acceptez pas ces conditions, veuillez 
                  ne pas utiliser notre service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">2. Description du service</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Afro-Eats est une plateforme de commande en ligne de plats africains authentiques. 
                  Nous proposons :
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Une sélection de plats africains traditionnels</li>
                  <li>Un service de livraison à domicile</li>
                  <li>Un système de commande en ligne sécurisé</li>
                  <li>Un service client disponible 7j/7</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">3. Commandes et paiement</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong className="text-gray-800">3.1</strong> Toutes les commandes sont soumises à 
                    acceptation de notre part. Nous nous réservons le droit de refuser toute commande 
                    à notre discrétion.
                  </p>
                  <p>
                    <strong className="text-gray-800">3.2</strong> Les prix affichés sont en euros TTC 
                    et peuvent être modifiés à tout moment sans préavis.
                  </p>
                  <p>
                    <strong className="text-gray-800">3.3</strong> Le paiement est requis au moment de 
                    la commande, sauf pour le paiement en espèces à la livraison.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">4. Livraison</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong className="text-gray-800">4.1</strong> Les délais de livraison sont indicatifs 
                    et peuvent varier selon les conditions de circulation et la charge de travail.
                  </p>
                  <p>
                    <strong className="text-gray-800">4.2</strong> Nous livrons uniquement dans les zones 
                    couvertes par notre service. Vérifiez votre adresse lors de la commande.
                  </p>
                  <p>
                    <strong className="text-gray-800">4.3</strong> En cas d'absence, le livreur tentera 
                    de vous contacter. Si aucun contact n'est établi, la commande pourra être reportée 
                    ou annulée.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">5. Annulation et remboursement</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong className="text-gray-800">5.1</strong> Vous pouvez annuler votre commande 
                    dans les 10 minutes suivant la confirmation sans frais.
                  </p>
                  <p>
                    <strong className="text-gray-800">5.2</strong> Pour plus d'informations sur les 
                    remboursements, consultez notre{' '}
                    <Link href="/refund" className="text-orange-500 hover:underline">
                      Politique de Remboursement
                    </Link>.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">6. Propriété intellectuelle</h2>
                <p className="text-gray-700 leading-relaxed">
                  Tous les contenus du site (textes, images, logos, etc.) sont la propriété d'Afro-Eats 
                  ou de ses partenaires et sont protégés par les lois sur la propriété intellectuelle. 
                  Toute reproduction non autorisée est interdite.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">7. Limitation de responsabilité</h2>
                <p className="text-gray-700 leading-relaxed">
                  Afro-Eats ne saurait être tenu responsable des dommages indirects résultant de 
                  l'utilisation ou de l'impossibilité d'utiliser notre service. Notre responsabilité 
                  est limitée au montant de votre commande.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">8. Données personnelles</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Le traitement de vos données personnelles est régi par notre{' '}
                  <Link href="/privacy" className="text-orange-500 hover:underline">
                    Politique de Confidentialité
                  </Link>.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">9. Modifications des conditions</h2>
                <p className="text-gray-700 leading-relaxed">
                  Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications 
                  entrent en vigueur dès leur publication sur le site. Il est de votre responsabilité 
                  de consulter régulièrement ces conditions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">10. Droit applicable</h2>
                <p className="text-gray-700 leading-relaxed">
                  Ces conditions sont régies par le droit français. Tout litige relatif à l'utilisation 
                  du site sera de la compétence exclusive des tribunaux français.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">11. Contact</h2>
                <p className="text-gray-700 leading-relaxed">
                  Pour toute question concernant ces conditions, vous pouvez nous contacter via notre{' '}
                  <Link href="/contact" className="text-orange-500 hover:underline">
                    page de contact
                  </Link> ou par email à contact@afroeats.com.
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
