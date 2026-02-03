'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function RefundPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12 text-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* En-tête */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Politique de Remboursement</h1>
              <p className="text-gray-600">Dernière mise à jour : 15 Janvier 2025</p>
            </div>

            {/* Contenu */}
            <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">1. Droit de rétractation</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Conformément à la législation en vigueur, vous disposez d'un délai de 14 jours à compter 
                  de la réception de votre commande pour exercer votre droit de rétractation, sauf pour les 
                  produits périssables (plats préparés).
                </p>
                <p className="text-gray-700 leading-relaxed">
                  <strong className="text-gray-800">Exception :</strong> Pour les plats préparés, le droit 
                  de rétractation ne s'applique pas en raison de la nature périssable des produits.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">2. Conditions de remboursement</h2>
                <div className="space-y-4 text-gray-700">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">2.1 Annulation avant préparation</h3>
                    <p>
                      Si vous annulez votre commande dans les <strong>10 minutes</strong> suivant la confirmation, 
                      vous recevrez un remboursement complet, quel que soit le mode de paiement utilisé.
                    </p>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">2.2 Problème avec la commande</h3>
                    <p>
                      En cas de problème avec votre commande (plat manquant, erreur, qualité insuffisante), 
                      contactez-nous immédiatement. Nous vous proposerons :
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4 mt-2">
                      <li>Un remboursement complet ou partiel selon le problème</li>
                      <li>Une nouvelle livraison gratuite</li>
                      <li>Un bon de réduction pour votre prochaine commande</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">2.3 Retard de livraison</h3>
                    <p>
                      Si votre commande arrive avec plus de <strong>30 minutes de retard</strong> par rapport 
                      à l'heure estimée, vous pouvez demander un remboursement partiel des frais de livraison.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">3. Procédure de remboursement</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong className="text-gray-800">Étape 1 :</strong> Contactez notre service client 
                    dans les <strong>48 heures</strong> suivant la réception de votre commande via :
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Email : support@afroeats.com</li>
                    <li>Téléphone : 01 23 45 67 89</li>
                    <li>Chat en ligne sur notre site</li>
                    <li>Formulaire de contact sur notre site</li>
                  </ul>
                  <p>
                    <strong className="text-gray-800">Étape 2 :</strong> Fournissez les informations suivantes :
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Numéro de commande</li>
                    <li>Date et heure de livraison</li>
                    <li>Description du problème</li>
                    <li>Photos si applicable (qualité, erreur, etc.)</li>
                  </ul>
                  <p>
                    <strong className="text-gray-800">Étape 3 :</strong> Nous traiterons votre demande dans 
                    un délai de <strong>5 jours ouvrables</strong> et vous informerons de la décision.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">4. Délais de remboursement</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong className="text-gray-800">Paiement par carte bancaire :</strong> Le remboursement 
                    apparaîtra sur votre compte dans un délai de <strong>5 à 10 jours ouvrables</strong> suivant 
                    l'approbation de votre demande.
                  </p>
                  <p>
                    <strong className="text-gray-800">Paiement par PayPal :</strong> Le remboursement sera 
                    effectué dans un délai de <strong>3 à 5 jours ouvrables</strong>.
                  </p>
                  <p>
                    <strong className="text-gray-800">Paiement en espèces :</strong> Un remboursement par 
                    virement bancaire sera effectué dans un délai de <strong>7 à 14 jours ouvrables</strong>.
                  </p>
                  <p>
                    <strong className="text-gray-800">Mobile Money :</strong> Le remboursement sera effectué 
                    dans un délai de <strong>3 à 7 jours ouvrables</strong>.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">5. Cas non remboursables</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Les remboursements ne sont pas possibles dans les cas suivants :
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Commande annulée après le début de la préparation (après 10 minutes)</li>
                  <li>Demande de remboursement effectuée plus de 48 heures après la livraison</li>
                  <li>Problème non signalé dans les délais</li>
                  <li>Commande non récupérée à l'adresse indiquée (absence du destinataire)</li>
                  <li>Changement d'avis après réception (sauf cas exceptionnel)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">6. Remboursement partiel</h2>
                <p className="text-gray-700 leading-relaxed">
                  Dans certains cas, un remboursement partiel peut être accordé :
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4 mt-4">
                  <li>Un seul plat problématique dans une commande de plusieurs plats</li>
                  <li>Retard de livraison (remboursement des frais de livraison uniquement)</li>
                  <li>Erreur partielle dans la commande</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">7. Bon de réduction</h2>
                <p className="text-gray-700 leading-relaxed">
                  En alternative au remboursement, nous pouvons vous proposer un bon de réduction valable 
                  sur votre prochaine commande. Ce bon est valable pendant <strong>3 mois</strong> à compter 
                  de sa date d'émission.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">8. Contact</h2>
                <p className="text-gray-700 leading-relaxed">
                  Pour toute question concernant cette politique de remboursement ou pour faire une demande 
                  de remboursement, contactez-nous :
                </p>
                <div className="bg-gray-50 rounded-lg p-6 mt-4">
                  <p className="text-gray-700 mb-2">
                    <strong>Email :</strong> support@afroeats.com
                  </p>
                  <p className="text-gray-700 mb-2">
                    <strong>Téléphone :</strong> 01 23 45 67 89
                  </p>
                  <p className="text-gray-700">
                    <strong>Horaires :</strong> Du lundi au dimanche, de 10h à 22h
                  </p>
                </div>
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
