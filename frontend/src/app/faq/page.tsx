'use client';

import { useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

type FaqItem = {
  id: string;
  question: string;
  answer: ReactNode;
  searchText: string;
};

type FaqSection = {
  id: string;
  title: string;
  items: FaqItem[];
};

function AnswerP({ children }: { children: ReactNode }) {
  return <p className="text-af-earth leading-relaxed">{children}</p>;
}

const SECTIONS: FaqSection[] = [
  {
    id: 'livraison',
    title: 'Livraison',
    items: [
      {
        id: 'liv-1',
        question: 'Quels sont les délais et frais de livraison ?',
        searchText: 'délais frais livraison 5 euros panier',
        answer: (
          <>
            <AnswerP>
              Les délais habituels sont de <strong className="text-af-wood">24 à 48 h</strong> selon votre
              zone. Les frais standards s’affichent au moment du paiement (souvent autour de{' '}
              <strong className="text-af-wood">5 €</strong> sur notre marketplace).
            </AnswerP>
            <AnswerP>
              Pour suivre votre commande, rendez-vous sur votre{' '}
              <Link href="/dashboard" className="font-semibold text-af-ocre underline decoration-af-ocre/40 underline-offset-2 hover:decoration-af-ocre">
                tableau de bord
              </Link>
              , rubrique « Mes commandes ».
            </AnswerP>
          </>
        ),
      },
      {
        id: 'liv-2',
        question: 'Livrez-vous partout en France ?',
        searchText: 'france métropole dom-tom',
        answer: (
          <AnswerP>
            Nous couvrons la métropole ; certaines zones ou îles peuvent être exclues selon les transporteurs. Saisissez
            votre adresse à l’étape livraison du{' '}
            <Link href="/panier" className="font-semibold text-af-ocre underline decoration-af-ocre/40 underline-offset-2 hover:decoration-af-ocre">
              panier
            </Link>{' '}
            pour vérifier la disponibilité en temps réel.
          </AnswerP>
        ),
      },
      {
        id: 'liv-3',
        question: 'Comment suivre mon colis ?',
        searchText: 'suivi colis email sms',
        answer: (
          <AnswerP>
            Un lien de suivi vous est envoyé par e-mail après validation du paiement. Vous pouvez aussi consulter
            le statut (en préparation, expédié, livré) depuis la page{' '}
            <Link href="/dashboard" className="font-semibold text-af-ocre underline decoration-af-ocre/40 underline-offset-2 hover:decoration-af-ocre">
              Mon espace
            </Link>
            .
          </AnswerP>
        ),
      },
    ],
  },
  {
    id: 'paiement',
    title: 'Paiement',
    items: [
      {
        id: 'pay-1',
        question: 'Quels moyens de paiement acceptez-vous ?',
        searchText: 'carte virement paypal',
        answer: (
          <>
            <AnswerP>
              Cartes bancaires (Visa, Mastercard), et{' '}
              <strong className="text-af-wood">virement bancaire</strong> lorsque la commande l’exige. Le détail
              apparaît à l’étape « Paiement » du tunnel{' '}
              <Link href="/panier" className="font-semibold text-af-ocre underline decoration-af-ocre/40 underline-offset-2 hover:decoration-af-ocre">
                commande
              </Link>
              .
            </AnswerP>
          </>
        ),
      },
      {
        id: 'pay-2',
        question: 'Puis-je utiliser un code promo ?',
        searchText: 'code promo réduction afro10',
        answer: (
          <AnswerP>
            Oui : entrez votre code dans le récapitulatif du panier avant de valider. Les codes valides (ex. offres
            promotionnelles) sont appliqués au sous-total. Consultez aussi nos{' '}
            <Link href="/blog" className="font-semibold text-af-ocre underline decoration-af-ocre/40 underline-offset-2 hover:decoration-af-ocre">
              articles
            </Link>{' '}
            pour les opérations en cours.
          </AnswerP>
        ),
      },
      {
        id: 'pay-3',
        question: 'Mon paiement est-il sécurisé ?',
        searchText: 'sécurisé ssl données',
        answer: (
          <AnswerP>
            Les transactions sont traitées via des prestataires conformes aux standards du secteur (chiffrement,
            3-D Secure selon les cas). Nous ne stockons pas votre numéro de carte en clair sur nos serveurs grand
            public.
          </AnswerP>
        ),
      },
    ],
  },
  {
    id: 'produits',
    title: 'Produits',
    items: [
      {
        id: 'prd-1',
        question: 'Comment choisir un produit ou un plat ?',
        searchText: 'catalogue fiche produit allergènes',
        answer: (
          <>
            <AnswerP>
              Parcourez le{' '}
              <Link href="/catalogue" className="font-semibold text-af-ocre underline decoration-af-ocre/40 underline-offset-2 hover:decoration-af-ocre">
                catalogue
              </Link>
              , filtrez par catégorie ou origine, puis ouvrez la fiche détaillée pour ingrédients, prix et avis.
            </AnswerP>
            <AnswerP>
              En cas d’allergie, vérifiez la description et contactez-nous via la{' '}
              <Link href="/contact" className="font-semibold text-af-ocre underline decoration-af-ocre/40 underline-offset-2 hover:decoration-af-ocre">
                page contact
              </Link>{' '}
              avant commande.
            </AnswerP>
          </>
        ),
      },
      {
        id: 'prd-2',
        question: 'Les produits sont-ils frais ?',
        searchText: 'frais artisanal date',
        answer: (
          <AnswerP>
            Les fiches indiquent l’origine et les conditions de conservation lorsque ces informations sont disponibles.
            Afro-food met en avant des producteurs et artisans sélectionnés ; les délais de préparation peuvent
            varier selon le produit.
          </AnswerP>
        ),
      },
    ],
  },
  {
    id: 'retours',
    title: 'Retours',
    items: [
      {
        id: 'ret-1',
        question: 'Puis-je retourner ou me faire rembourser un produit ?',
        searchText: 'remboursement retour délai',
        answer: (
          <>
            <AnswerP>
              Les conditions dépendent du type de produit (frais, sec). Les{' '}
              <Link href="/refund" className="font-semibold text-af-ocre underline decoration-af-ocre/40 underline-offset-2 hover:decoration-af-ocre">
                politique de remboursement
              </Link>{' '}
              décrit les cas généraux (délai, état du colis, etc.).
            </AnswerP>
            <AnswerP>
              Pour une demande précise, indiquez votre numéro de commande via la page{' '}
              <Link href="/contact" className="font-semibold text-af-ocre underline decoration-af-ocre/40 underline-offset-2 hover:decoration-af-ocre">
                Contact
              </Link>
              .
            </AnswerP>
          </>
        ),
      },
      {
        id: 'ret-2',
        question: 'Produit abîmé à la réception',
        searchText: 'cassé colis photo',
        answer: (
          <AnswerP>
            Conservez l’emballage et prenez des photos du colis et du produit dans les plus brefs délais. Déclarez
            le sinistre via votre espace commande ou le{' '}
            <Link href="/contact" className="font-semibold text-af-ocre underline decoration-af-ocre/40 underline-offset-2 hover:decoration-af-ocre">
              formulaire contact
            </Link>{' '}
            pour accélérer le traitement.
          </AnswerP>
        ),
      },
      {
        id: 'ret-3',
        question: 'Que faire en cas de litige ou de commande problématique ?',
        searchText: 'litige support médiation problème commande',
        answer: (
          <AnswerP>
            En cas de produit non conforme ou de retard important, contactez-nous avec votre numéro de commande via
            le{' '}
            <Link href="/help" className="font-semibold text-af-ocre underline decoration-af-ocre/40 underline-offset-2 hover:decoration-af-ocre">
              centre d’aide
            </Link>{' '}
            ou la page{' '}
            <Link href="/contact" className="font-semibold text-af-ocre underline decoration-af-ocre/40 underline-offset-2 hover:decoration-af-ocre">
              Contact
            </Link>
            . Notre équipe vous accompagne pour trouver une solution.
          </AnswerP>
        ),
      },
    ],
  },
];

function AccordionIcon({ open }: { open: boolean }) {
  return (
    <span
      className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-af-wood/20 bg-white text-af-wood transition-colors duration-300"
      aria-hidden
    >
      <span
        className={`absolute inset-0 flex items-center justify-center text-xl font-light transition-all duration-300 ease-out ${
          open ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100'
        }`}
      >
        +
      </span>
      <span
        className={`absolute inset-0 flex items-center justify-center text-2xl font-light transition-all duration-300 ease-out ${
          open ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'
        }`}
      >
        −
      </span>
    </span>
  );
}

export default function FAQPage() {
  const [query, setQuery] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SECTIONS;
    return SECTIONS.map((section) => ({
      ...section,
      items: section.items.filter(
        (item) =>
          item.question.toLowerCase().includes(q) ||
          item.searchText.toLowerCase().includes(q)
      ),
    })).filter((s) => s.items.length > 0);
  }, [query]);

  return (
    <div className="min-h-screen flex flex-col bg-af-ivory text-af-wood [color-scheme:light]">
      <Header />
      <main className="flex-grow">
        {/* Hero sobre + recherche */}
        <section className="border-b border-af-wood/10 bg-[#fff7ea]">
          <div className="mx-auto max-w-[720px] px-6 py-16 text-center lg:py-20">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-af-mud">Aide</p>
            <h1 className="font-title mt-3 text-4xl tracking-tight text-af-wood sm:text-5xl">Questions fréquentes</h1>
            <p className="mt-4 text-sm leading-relaxed text-af-mud">
              Recherchez un mot-clé ou parcourez les thèmes ci-dessous.
            </p>
            <div className="relative mx-auto mt-10 max-w-lg">
              <label htmlFor="faq-search" className="sr-only">
                Rechercher dans la FAQ
              </label>
              <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-af-mud/60">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35m1.35-5.15a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                id="faq-search"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex. livraison, remboursement, commande…"
                className="w-full rounded-2xl border border-af-wood/20 bg-white py-3.5 pl-12 pr-4 text-sm text-af-wood shadow-sm placeholder:text-af-mud/55 outline-none ring-0 transition focus:border-af-ocre/50 focus:ring-2 focus:ring-af-ocre/20"
              />
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-[800px] px-6 py-12 lg:py-16">
          {filteredSections.length === 0 ? (
            <p className="text-center text-sm text-af-mud">
              Aucun résultat pour « {query} ». Essayez un autre mot-clé ou{' '}
              <button type="button" onClick={() => setQuery('')} className="font-semibold text-af-ocre underline">
                réinitialiser la recherche
              </button>
              .
            </p>
          ) : (
            <div className="space-y-12">
              {filteredSections.map((section) => (
                <section key={section.id} aria-labelledby={`faq-heading-${section.id}`}>
                  <h2 id={`faq-heading-${section.id}`} className="font-title text-2xl text-af-wood lg:text-3xl">
                    {section.title}
                  </h2>
                  <div className="mt-6 divide-y divide-af-wood/12 rounded-[24px] border border-af-wood/15 bg-white shadow-sm">
                    {section.items.map((item) => {
                      const isOpen = openId === item.id;
                      return (
                        <div key={item.id} className="px-1">
                          <button
                            type="button"
                            onClick={() => setOpenId(isOpen ? null : item.id)}
                            className="flex w-full items-start gap-4 rounded-xl px-4 py-5 text-left transition hover:bg-af-ocre/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-af-ocre/35 sm:px-5"
                            aria-expanded={isOpen}
                            aria-controls={`faq-panel-${item.id}`}
                            id={`faq-trigger-${item.id}`}
                          >
                            <AccordionIcon open={isOpen} />
                            <span className="font-ui pt-1 text-base font-semibold leading-snug text-af-wood sm:text-lg">
                              {item.question}
                            </span>
                          </button>
                          <div
                            className={`grid transition-[grid-template-rows] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                              isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                            }`}
                          >
                            <div className="min-h-0 overflow-hidden">
                              <div
                                id={`faq-panel-${item.id}`}
                                role="region"
                                aria-labelledby={`faq-trigger-${item.id}`}
                                className="space-y-3 border-t border-af-wood/10 bg-af-ivory/50 px-4 pb-5 pl-[4.25rem] pr-4 pt-4 sm:px-5 sm:pb-6 sm:pl-[4.5rem] sm:pr-6"
                              >
                                <div className="font-ui space-y-3 text-sm sm:text-[0.9375rem]">{item.answer}</div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>

        {/* CTA contact */}
        <section className="border-t border-af-wood/10 bg-earth-100/90 py-14 lg:py-16">
          <div className="mx-auto max-w-[640px] px-6 text-center">
            <h2 className="font-title text-3xl text-af-wood">Une question sans réponse ?</h2>
            <p className="mt-3 text-sm text-af-earth">
              Notre équipe vous répond avec plaisir. Consultez aussi le centre d’aide pour les guides détaillés.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
              <Link
                href="/contact"
                className="inline-flex w-full justify-center rounded-full bg-af-ocre px-8 py-3.5 text-sm font-semibold text-af-ivory shadow-[0_12px_32px_rgba(212,101,26,.22)] transition hover:bg-[#b85716] sm:w-auto"
              >
                Nous contacter
              </Link>
              <Link
                href="/help"
                className="inline-flex w-full justify-center rounded-full border border-af-wood/25 bg-white px-8 py-3.5 text-sm font-semibold text-af-wood shadow-sm transition hover:bg-earth-100 sm:w-auto"
              >
                Centre d’aide
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
