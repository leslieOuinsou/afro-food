import { notFound } from "next/navigation";
import { EmailShell } from "@/components/emails/EmailShell";
import {
  AbandonedCartEmail,
  AuthEmail,
  ExpeditionEmail,
  OrderConfirmationEmail,
  OrderStatusEmail,
  ProductReviewEmail,
  PromotionalEmail,
  WelcomeEmail,
} from "@/components/emails/templates";
import {
  mockAbandonedCart,
  mockAuth,
  mockExpedition,
  mockOrder,
  mockOrderStatus,
  mockPromo,
  mockReview,
  mockWelcome,
} from "@/components/emails/mockData";

const SLUGS = [
  "bienvenue",
  "demande-avis",
  "relance-panier",
  "commande",
  "expedition",
  "statut-commande",
  "reset-mot-de-passe",
  "verification-email",
  "promotion",
] as const;

type Slug = (typeof SLUGS)[number];

export function generateStaticParams() {
  return SLUGS.map((slug) => ({ slug }));
}

type PageProps = { params: Promise<{ slug: string }> };

export default async function EmailTemplatePreviewPage({ params }: PageProps) {
  const { slug } = await params;
  if (!SLUGS.includes(slug as Slug)) notFound();

  const patternId = `email-pattern-${slug}`;

  const body = (() => {
    switch (slug as Slug) {
      case "bienvenue":
        return (
          <WelcomeEmail
            patternId={patternId}
            prenom={mockWelcome.prenom}
            nom={mockWelcome.nom}
            codePromo={mockWelcome.codePromo}
          />
        );
      case "demande-avis":
        return (
          <ProductReviewEmail
            patternId={patternId}
            prenom={mockReview.prenom}
            nomProduit={mockReview.nomProduit}
            imageProduit={mockReview.imageProduit}
            reviewPageUrl={mockReview.reviewPageUrl}
            remerciMessage={mockReview.remerciMessage}
          />
        );
      case "relance-panier":
        return (
          <AbandonedCartEmail
            patternId={patternId}
            prenom={mockAbandonedCart.prenom}
            articles={mockAbandonedCart.articles}
            cartUrl={mockAbandonedCart.cartUrl}
          />
        );
      case "commande":
        return (
          <OrderConfirmationEmail
            patternId={patternId}
            prenom={mockOrder.prenom}
            numero={mockOrder.numero}
            dateCmd={mockOrder.dateCmd}
            articles={mockOrder.articles}
            adresseHtml={mockOrder.adresse}
            sousTotal={mockOrder.sousTotal}
            livraison={mockOrder.livraison}
            total={mockOrder.total}
            suiviHref="/commandes/demo"
          />
        );
      case "expedition":
        return (
          <ExpeditionEmail
            patternId={patternId}
            prenom={mockExpedition.prenom}
            numero={mockExpedition.numero}
            numeroSuivi={mockExpedition.numeroSuivi}
            transporteur={mockExpedition.transporteur}
            dateEst={mockExpedition.dateEst}
            recapLines={mockExpedition.recap}
            ctaSuiviHref="/commandes/demo"
          />
        );
      case "statut-commande":
        return (
          <OrderStatusEmail
            patternId={patternId}
            prenom={mockOrderStatus.prenom}
            numero={mockOrderStatus.numero}
            statut={mockOrderStatus.statut}
            commandeHref="/commandes/demo"
          />
        );
      case "reset-mot-de-passe":
        return (
          <AuthEmail
            variant="reset-password"
            prenom={mockAuth.prenom}
            nom={mockAuth.nom}
            actionHref={mockAuth.actionUrl}
          />
        );
      case "verification-email":
        return (
          <AuthEmail
            variant="verify-email"
            prenom={mockAuth.prenom}
            nom={mockAuth.nom}
            actionHref="/verify-email?token=demo"
          />
        );
      case "promotion":
        return (
          <PromotionalEmail
            prenom={mockPromo.prenom}
            titre={mockPromo.titre}
            contenu={mockPromo.contenu}
            codePromo={mockPromo.codePromo}
          />
        );
      default:
        return null;
    }
  })();

  const preheaders: Partial<Record<Slug, string>> = {
    bienvenue: "Bienvenue sur Afro-food — offre et catalogue.",
    "demande-avis": "Une minute pour noter votre plat.",
    "relance-panier": "Votre panier vous attend, sans pression.",
    commande: `Commande ${mockOrder.numero} confirmée.`,
    expedition: `Colis en route — suivi ${mockExpedition.numeroSuivi}.`,
    "statut-commande": "Votre commande a évolué.",
    "reset-mot-de-passe": "Réinitialisez votre mot de passe.",
    "verification-email": "Confirmez votre adresse e-mail.",
    promotion: mockPromo.titre,
  };

  return (
    <EmailShell preheader={preheaders[slug as Slug]}>
      {body}
    </EmailShell>
  );
}
