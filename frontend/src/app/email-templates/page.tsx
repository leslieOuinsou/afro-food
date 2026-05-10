import Link from "next/link";

const LINKS = [
  { slug: "bienvenue", label: "Bienvenue" },
  { slug: "demande-avis", label: "Demande d’avis produit" },
  { slug: "relance-panier", label: "Relance panier abandonné" },
  { slug: "commande", label: "Confirmation de commande" },
  { slug: "expedition", label: "Expédition / colis" },
  { slug: "statut-commande", label: "Mise à jour statut commande" },
  { slug: "reset-mot-de-passe", label: "Réinitialisation mot de passe" },
  { slug: "verification-email", label: "Vérification e-mail" },
  { slug: "promotion", label: "E-mail promotionnel" },
] as const;

export default function EmailTemplatesIndexPage() {
  return (
    <div style={{ maxWidth: 560, margin: "48px auto", padding: "0 20px" }}>
      <h1 style={{ fontFamily: "Georgia, serif", fontSize: 28, marginBottom: 8 }}>
        Templates e-mail (aperçu Next.js)
      </h1>
      <p style={{ fontFamily: "system-ui", fontSize: 15, lineHeight: 1.6, opacity: 0.85, marginBottom: 28 }}>
        Même charte que les HTML inline du backend : ivoire, bois, ocre, brique. Les composants vivent dans{" "}
        <code>src/components/emails/</code>.
      </p>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {LINKS.map(({ slug, label }) => (
          <li key={slug} style={{ marginBottom: 12 }}>
            <Link
              href={`/email-templates/${slug}`}
              style={{
                fontFamily: "system-ui",
                fontSize: 16,
                color: "#C2610F",
                fontWeight: 600,
              }}
            >
              {label}
            </Link>
            <span style={{ fontFamily: "monospace", fontSize: 12, marginLeft: 10, opacity: 0.55 }}>
              /email-templates/{slug}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
