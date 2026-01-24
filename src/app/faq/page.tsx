'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      category: 'Commandes',
      questions: [
        {
          q: 'Comment puis-je passer une commande ?',
          a: 'Vous pouvez passer une commande directement sur notre site web en sélectionnant les plats de votre choix dans le menu, puis en les ajoutant à votre panier. Une fois votre panier rempli, procédez au paiement.'
        },
        {
          q: 'Quels sont les délais de livraison ?',
          a: 'Les délais de livraison varient entre 30 et 60 minutes selon votre localisation. Pour les commandes express, comptez 20-30 minutes.'
        },
        {
          q: 'Puis-je modifier ou annuler ma commande ?',
          a: 'Vous pouvez modifier ou annuler votre commande dans les 10 minutes suivant la confirmation. Contactez-nous au 01 23 45 67 89 ou via notre chat en ligne.'
        },
        {
          q: 'Quels modes de paiement acceptez-vous ?',
          a: 'Nous acceptons les cartes bancaires (Visa, Mastercard), PayPal, et Mobile Money. Le paiement en espèces est également disponible à la livraison.'
        }
      ]
    },
    {
      category: 'Livraison',
      questions: [
        {
          q: 'Dans quelles zones livrez-vous ?',
          a: 'Nous livrons actuellement dans toute la région parisienne. Nous étendons progressivement notre zone de livraison. Vérifiez votre adresse lors de la commande.'
        },
        {
          q: 'Quels sont les frais de livraison ?',
          a: 'Les frais de livraison standard sont de 5€. Pour les commandes supérieures à 30€, la livraison est gratuite. Les livraisons express coûtent 8€.'
        },
        {
          q: 'Puis-je suivre ma commande en temps réel ?',
          a: 'Oui ! Une fois votre commande confirmée, vous recevrez un lien de suivi par SMS et email qui vous permettra de suivre votre commande en temps réel.'
        }
      ]
    },
    {
      category: 'Produits',
      questions: [
        {
          q: 'Vos plats contiennent-ils des allergènes ?',
          a: 'Tous nos plats sont préparés avec des ingrédients frais. Les informations sur les allergènes sont disponibles sur chaque fiche produit. Contactez-nous si vous avez des allergies spécifiques.'
        },
        {
          q: 'Proposez-vous des options végétariennes ou véganes ?',
          a: 'Oui, nous proposons plusieurs plats végétariens et véganes. Ils sont clairement identifiés dans notre menu avec les icônes appropriées.'
        },
        {
          q: 'Comment sont préparés vos plats ?',
          a: 'Tous nos plats sont préparés frais quotidiennement dans notre cuisine par nos chefs expérimentés, en respectant les recettes traditionnelles africaines.'
        }
      ]
    },
    {
      category: 'Compte et Facturation',
      questions: [
        {
          q: 'Comment créer un compte ?',
          a: 'Cliquez sur "Connexion" en haut à droite, puis sur "S\'inscrire". Remplissez le formulaire avec vos informations et validez votre email.'
        },
        {
          q: 'J\'ai oublié mon mot de passe, que faire ?',
          a: 'Sur la page de connexion, cliquez sur "Mot de passe oublié" et suivez les instructions. Vous recevrez un email avec un lien pour réinitialiser votre mot de passe.'
        },
        {
          q: 'Puis-je obtenir une facture ?',
          a: 'Oui, une facture est automatiquement générée pour chaque commande et envoyée à votre adresse email. Vous pouvez également la télécharger depuis votre espace client.'
        }
      ]
    }
  ];

  const toggleQuestion = (categoryIndex: number, questionIndex: number) => {
    const index = `${categoryIndex}-${questionIndex}`;
    setOpenIndex(openIndex === questionIndex ? null : questionIndex);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow bg-gray-50 py-12">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* En-tête */}
            <div className="text-center mb-12">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Questions Fréquentes (FAQs)</h1>
              <p className="text-xl text-gray-600">
                Trouvez rapidement les réponses à vos questions
              </p>
            </div>

            {/* FAQ par catégorie */}
            <div className="space-y-8">
              {faqs.map((category, categoryIndex) => (
                <div key={categoryIndex} className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">{category.category}</h2>
                  <div className="space-y-4">
                    {category.questions.map((faq, questionIndex) => (
                      <div key={questionIndex} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
                        <button
                          onClick={() => toggleQuestion(categoryIndex, questionIndex)}
                          className="w-full text-left flex items-center justify-between py-2"
                        >
                          <span className="text-lg font-semibold text-gray-800 pr-4">
                            {faq.q}
                          </span>
                          <svg
                            className={`w-5 h-5 text-orange-500 transition-transform flex-shrink-0 ${
                              openIndex === questionIndex ? 'transform rotate-180' : ''
                            }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        {openIndex === questionIndex && (
                          <div className="mt-2 text-gray-600 leading-relaxed">
                            {faq.a}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Section Contact */}
            <section className="bg-orange-500 text-white rounded-lg shadow-md p-8 text-center mt-12">
              <h2 className="text-3xl font-bold mb-4">Vous ne trouvez pas votre réponse ?</h2>
              <p className="text-xl mb-6">
                Notre équipe est là pour vous aider. Contactez-nous !
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/contact"
                  className="bg-white text-orange-500 font-semibold px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  Nous contacter
                </a>
                <a
                  href="/help"
                  className="bg-transparent border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white hover:text-orange-500 transition-colors"
                >
                  Centre d'aide
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
