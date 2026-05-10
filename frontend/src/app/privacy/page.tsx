'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12 text-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* En-tête */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Politique de Confidentialité</h1>
              <p className="text-gray-600">Dernière mise à jour : 15 Janvier 2025</p>
            </div>

            {/* Contenu */}
            <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">1. Introduction</h2>
                <p className="text-gray-700 leading-relaxed">
                  Afro-food s'engage à protéger votre vie privée. Cette politique de confidentialité 
                  explique comment nous collectons, utilisons et protégeons vos données personnelles 
                  conformément au Règlement Général sur la Protection des Données (RGPD).
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">2. Données collectées</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong className="text-gray-800">2.1 Données d'identification :</strong> Nom, prénom, 
                    adresse email, numéro de téléphone, adresse de livraison.
                  </p>
                  <p>
                    <strong className="text-gray-800">2.2 Données de commande :</strong> Historique des 
                    commandes, préférences alimentaires, informations de paiement (cryptées).
                  </p>
                  <p>
                    <strong className="text-gray-800">2.3 Données techniques :</strong> Adresse IP, 
                    type de navigateur, cookies, données de navigation.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">3. Utilisation des données</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Nous utilisons vos données personnelles pour :
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Traiter et livrer vos commandes</li>
                  <li>Gérer votre compte client</li>
                  <li>Vous envoyer des communications relatives à votre commande</li>
                  <li>Améliorer nos services et votre expérience</li>
                  <li>Vous envoyer des offres promotionnelles (avec votre consentement)</li>
                  <li>Respecter nos obligations légales</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">4. Base légale du traitement</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong className="text-gray-800">4.1 Exécution d'un contrat :</strong> Pour traiter 
                    vos commandes et livrer vos plats.
                  </p>
                  <p>
                    <strong className="text-gray-800">4.2 Consentement :</strong> Pour l'envoi de 
                    newsletters et communications marketing.
                  </p>
                  <p>
                    <strong className="text-gray-800">4.3 Intérêt légitime :</strong> Pour améliorer 
                    nos services et analyser l'utilisation du site.
                  </p>
                  <p>
                    <strong className="text-gray-800">4.4 Obligation légale :</strong> Pour respecter 
                    nos obligations comptables et fiscales.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">5. Partage des données</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Nous ne vendons jamais vos données personnelles. Nous pouvons partager vos données avec :
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li><strong>Prestataires de services :</strong> Services de livraison, processeurs de paiement</li>
                  <li><strong>Partenaires techniques :</strong> Hébergement, analytics (données anonymisées)</li>
                  <li><strong>Autorités légales :</strong> Si requis par la loi</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">6. Conservation des données</h2>
                <p className="text-gray-700 leading-relaxed">
                  Nous conservons vos données personnelles aussi longtemps que nécessaire pour les finalités 
                  pour lesquelles elles ont été collectées, ou conformément aux obligations légales. Les 
                  données de commande sont conservées pendant 10 ans (obligation comptable).
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">7. Vos droits</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Conformément au RGPD, vous disposez des droits suivants :
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li><strong>Droit d'accès :</strong> Obtenir une copie de vos données personnelles</li>
                  <li><strong>Droit de rectification :</strong> Corriger vos données inexactes</li>
                  <li><strong>Droit à l'effacement :</strong> Demander la suppression de vos données</li>
                  <li><strong>Droit à la portabilité :</strong> Récupérer vos données dans un format structuré</li>
                  <li><strong>Droit d'opposition :</strong> Vous opposer au traitement de vos données</li>
                  <li><strong>Droit de limitation :</strong> Limiter le traitement de vos données</li>
                  <li><strong>Droit de retirer votre consentement :</strong> À tout moment</li>
                </ul>
                <p className="text-gray-700 leading-relaxed mt-4">
                  Pour exercer ces droits, contactez-nous à : privacy@afroeats.com
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">8. Cookies</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Notre site utilise des cookies pour améliorer votre expérience. Pour plus d'informations, 
                  consultez notre{' '}
                  <Link href="/cookies" className="text-orange-500 hover:underline">
                    Politique de Cookies
                  </Link>.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">9. Sécurité</h2>
                <p className="text-gray-700 leading-relaxed">
                  Nous mettons en œuvre des mesures techniques et organisationnelles appropriées pour 
                  protéger vos données personnelles contre tout accès non autorisé, perte ou destruction. 
                  Toutes les transactions sont sécurisées par cryptage SSL.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">10. Modifications</h2>
                <p className="text-gray-700 leading-relaxed">
                  Nous pouvons modifier cette politique de confidentialité à tout moment. Les modifications 
                  seront publiées sur cette page avec une date de mise à jour révisée.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">11. Contact</h2>
                <p className="text-gray-700 leading-relaxed">
                  Pour toute question concernant cette politique de confidentialité, contactez notre 
                  délégué à la protection des données à : privacy@afroeats.com ou via notre{' '}
                  <Link href="/contact" className="text-orange-500 hover:underline">
                    page de contact
                  </Link>.
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
