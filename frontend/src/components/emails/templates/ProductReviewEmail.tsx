import Link from "next/link";
import { emailTheme } from "@/lib/emails/theme";
import { EmailFooter } from "@/components/emails/EmailFooter";
import { WoodHeader } from "@/components/emails/WoodHeader";

type ProductReviewEmailProps = {
  patternId: string;
  prenom: string;
  nomProduit: string;
  imageProduit: string;
  reviewPageUrl: string;
  /** Texte de remerciement (équipe / cuisine), sans page vendeur. */
  remerciMessage: string;
};

function ratingHref(base: string, n: number) {
  const sep = base.includes("?") ? "&" : "?";
  return `${base}${sep}note=${n}`;
}

export function ProductReviewEmail({
  patternId,
  prenom,
  nomProduit,
  imageProduit,
  reviewPageUrl,
  remerciMessage,
}: ProductReviewEmailProps) {
  return (
    <>
      <WoodHeader patternId={patternId} />
      <section style={{ padding: "26px 24px 10px", textAlign: "center" }}>
        <h1
          style={{
            margin: 0,
            fontFamily: emailTheme.fontSerif,
            fontSize: 26,
            lineHeight: 1.2,
            fontWeight: 700,
            color: emailTheme.wood,
          }}
        >
          Votre avis compte !
        </h1>
      </section>
      <section
        style={{
          padding: "8px 24px 18px",
          fontFamily: emailTheme.fontSans,
          fontSize: 16,
          lineHeight: 1.65,
          color: emailTheme.wood,
        }}
      >
        <p style={{ margin: "0 0 14px" }}>
          Bonjour <strong>{prenom}</strong>,
        </p>
        <p style={{ margin: 0 }}>
          Vous avez goûté à un plat préparé avec soin — un petit mot de votre part,
          ce serait précieux pour le cuisinier et pour les prochains curieux du
          marché. Rien d’obligatoire : juste votre sincérité.
        </p>
      </section>

      <div style={{ padding: "8px 20px 16px" }}>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            backgroundColor: emailTheme.white,
            border: `1px solid ${emailTheme.border}`,
            borderRadius: 14,
            overflow: "hidden",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageProduit}
            width={120}
            height={120}
            alt=""
            style={{
              display: "block",
              width: 120,
              height: 120,
              objectFit: "cover",
              backgroundColor: emailTheme.cream,
            }}
          />
          <div
            style={{
              flex: "1 1 200px",
              padding: "16px 18px",
              fontFamily: emailTheme.fontSerif,
              fontSize: 18,
              fontWeight: 700,
              color: emailTheme.wood,
              lineHeight: 1.35,
              alignSelf: "center",
            }}
          >
            {nomProduit}
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "6px 20px 8px" }}>
        <p
          style={{
            margin: "0 0 10px",
            fontFamily: emailTheme.fontSans,
            fontSize: 13,
            color: emailTheme.wood,
            opacity: 0.85,
          }}
        >
          En un clic, donnez une première note :
        </p>
        <div style={{ display: "flex", justifyContent: "center", gap: 4, flexWrap: "wrap" }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Link
              key={n}
              href={ratingHref(reviewPageUrl, n)}
              title={`${n} étoile${n > 1 ? "s" : ""}`}
              aria-label={`Noter ${n} sur 5`}
              style={{
                textDecoration: "none",
                color: emailTheme.ocre,
                fontSize: 34,
                lineHeight: 1,
                padding: "0 4px",
              }}
            >
              ★
            </Link>
          ))}
        </div>
        <p
          style={{
            margin: "10px 0 0",
            fontFamily: emailTheme.fontSans,
            fontSize: 11,
            color: emailTheme.wood,
            opacity: 0.55,
          }}
        >
          Chaque étoile ouvre la page avis avec cette note déjà sélectionnée.
        </p>
      </div>

      <section
        style={{
          padding: "12px 24px 8px",
          fontFamily: emailTheme.fontSans,
          fontSize: 15,
          lineHeight: 1.6,
          color: emailTheme.wood,
        }}
      >
        <p style={{ margin: 0 }}>
          Que ce soit une étoile ou cinq, ce qui compte pour nous, c’est votre vécu
          : le goût, la portion, l’emballage… Les détails font la différence entre
          une bonne adresse et une adresse qu’on garde.
        </p>
      </section>

      <div style={{ textAlign: "center", padding: "16px 24px 24px" }}>
        <Link
          href={reviewPageUrl}
          style={{
            display: "inline-block",
            fontFamily: emailTheme.fontSans,
            fontSize: 15,
            fontWeight: 700,
            color: emailTheme.white,
            textDecoration: "none",
            padding: "14px 32px",
            borderRadius: 999,
            backgroundColor: emailTheme.ocre,
          }}
        >
          Laisser un avis complet
        </Link>
      </div>

      <div style={{ padding: "0 20px 24px" }}>
        <div
          style={{
            backgroundColor: "#f0e6d4",
            borderLeft: `4px solid ${emailTheme.ocre}`,
            borderRadius: "0 12px 12px 0",
            padding: "18px 20px",
            fontFamily: emailTheme.fontSans,
            fontSize: 15,
            lineHeight: 1.65,
            color: emailTheme.wood,
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              fontFamily: emailTheme.fontSerif,
              fontSize: 16,
              fontWeight: 700,
              color: emailTheme.wood,
            }}
          >
            Un petit mot pour vous
          </p>
          <p style={{ margin: 0 }}>{remerciMessage}</p>
        </div>
      </div>

      <EmailFooter />
    </>
  );
}
