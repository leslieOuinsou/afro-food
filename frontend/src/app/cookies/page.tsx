'use client';

import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function CookiesPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12 text-gray-900">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* En-tête */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Politique de Cookies</h1>
              <p className="text-gray-600">Dernière mise à jour : 15 Janvier 2025</p>
            </div>

            {/* Contenu */}
            <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">1. Qu'est-ce qu'un cookie ?</h2>
                <p className="text-gray-700 leading-relaxed">
                  Un cookie est un petit fichier texte stocké sur votre appareil (ordinateur, tablette, 
                  smartphone) lorsque vous visitez un site web. Les cookies permettent au site de reconnaître 
                  votre appareil et de mémoriser certaines informations sur vos préférences ou actions passées.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">2. Types de cookies utilisés</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">2.1 Cookies strictement nécessaires</h3>
                    <p className="text-gray-700 leading-relaxed mb-2">
                      Ces cookies sont essentiels au fonctionnement du site. Ils permettent de :
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Mémoriser vos préférences de langue</li>
                      <li>Maintenir votre session de connexion</li>
                      <li>Gérer votre panier d'achat</li>
                      <li>Assurer la sécurité du site</li>
                    </ul>
                    <p className="text-gray-700 leading-relaxed mt-4">
                      <strong>Durée :</strong> Session ou jusqu'à 1 an
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">2.2 Cookies de performance</h3>
                    <p className="text-gray-700 leading-relaxed mb-2">
                      Ces cookies nous aident à comprendre comment les visiteurs utilisent notre site en collectant 
                      des informations anonymes. Ils permettent de :
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Analyser le trafic et l'utilisation du site</li>
                      <li>Identifier les pages les plus visitées</li>
                      <li>Améliorer les performances du site</li>
                    </ul>
                    <p className="text-gray-700 leading-relaxed mt-4">
                      <strong>Durée :</strong> Jusqu'à 2 ans
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">2.3 Cookies de fonctionnalité</h3>
                    <p className="text-gray-700 leading-relaxed mb-2">
                      Ces cookies permettent d'améliorer votre expérience en mémorisant :
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Vos préférences (langue, région)</li>
                      <li>Vos choix de personnalisation</li>
                      <li>Vos informations de connexion (si vous choisissez "Se souvenir de moi")</li>
                    </ul>
                    <p className="text-gray-700 leading-relaxed mt-4">
                      <strong>Durée :</strong> Jusqu'à 1 an
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-3">2.4 Cookies de ciblage/publicité</h3>
                    <p className="text-gray-700 leading-relaxed mb-2">
                      Ces cookies sont utilisés pour vous proposer des publicités pertinentes et mesurer 
                      l'efficacité de nos campagnes publicitaires. Ils permettent de :
                    </p>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                      <li>Personnaliser les publicités selon vos intérêts</li>
                      <li>Limiter le nombre de fois qu'une publicité vous est affichée</li>
                      <li>Mesurer l'efficacité des campagnes</li>
                    </ul>
                    <p className="text-gray-700 leading-relaxed mt-4">
                      <strong>Durée :</strong> Jusqu'à 1 an
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">3. Cookies tiers</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Nous utilisons également des cookies provenant de services tiers pour améliorer notre site :
                </p>
                <div className="space-y-4 text-gray-700">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Google Analytics</h4>
                    <p>
                      Service d'analyse de trafic web pour comprendre comment les visiteurs utilisent notre site.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Services de paiement</h4>
                    <p>
                      Cookies utilisés par nos prestataires de paiement pour sécuriser les transactions.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">4. Gestion des cookies</h2>
                <div className="space-y-4 text-gray-700">
                  <p>
                    <strong className="text-gray-800">4.1 Paramètres du navigateur :</strong> Vous pouvez 
                    configurer votre navigateur pour accepter ou refuser les cookies. Cependant, le refus 
                    de certains cookies peut affecter le fonctionnement du site.
                  </p>
                  <p>
                    <strong className="text-gray-800">4.2 Bandeau de consentement :</strong> Lors de votre 
                    première visite, un bandeau vous permet de choisir quels types de cookies accepter.
                  </p>
                  <p>
                    <strong className="text-gray-800">4.3 Modification de vos préférences :</strong> Vous 
                    pouvez modifier vos préférences de cookies à tout moment en cliquant sur le lien en bas 
                    de chaque page.
                  </p>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">5. Instructions par navigateur</h2>
                <div className="space-y-4 text-gray-700">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Google Chrome</h4>
                    <p>Paramètres → Confidentialité et sécurité → Cookies et autres données de sites</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Mozilla Firefox</h4>
                    <p>Options → Vie privée et sécurité → Cookies et données de sites</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Safari</h4>
                    <p>Préférences → Confidentialité → Cookies et données de sites web</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-2">Microsoft Edge</h4>
                    <p>Paramètres → Cookies et autorisations de site → Cookies et données de sites</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">6. Conséquences du refus des cookies</h2>
                <p className="text-gray-700 leading-relaxed mb-4">
                  Si vous choisissez de désactiver les cookies, certaines fonctionnalités du site peuvent 
                  ne pas fonctionner correctement :
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-700 ml-4">
                  <li>Impossibilité de vous connecter à votre compte</li>
                  <li>Perte des articles dans votre panier</li>
                  <li>Impossibilité de mémoriser vos préférences</li>
                  <li>Expérience utilisateur dégradée</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">7. Cookies et données personnelles</h2>
                <p className="text-gray-700 leading-relaxed">
                  Certains cookies peuvent collecter des données personnelles. Pour plus d'informations 
                  sur le traitement de vos données, consultez notre{' '}
                  <Link href="/privacy" className="text-orange-500 hover:underline">
                    Politique de Confidentialité
                  </Link>.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">8. Modifications</h2>
                <p className="text-gray-700 leading-relaxed">
                  Nous pouvons modifier cette politique de cookies à tout moment. Les modifications seront 
                  publiées sur cette page avec une date de mise à jour révisée.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">9. Contact</h2>
                <p className="text-gray-700 leading-relaxed">
                  Pour toute question concernant notre utilisation des cookies, contactez-nous à : 
                  privacy@afroeats.com ou via notre{' '}
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
