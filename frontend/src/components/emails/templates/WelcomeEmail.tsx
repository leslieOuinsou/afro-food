import Link from "next/link";
import { emailTheme } from "@/lib/emails/theme";
import { EmailFooter } from "@/components/emails/EmailFooter";
import { WoodHeader } from "@/components/emails/WoodHeader";

type WelcomeEmailProps = {
  patternId: string;
  prenom: string;
  nom?: string;
  codePromo?: string;
};

export function WelcomeEmail({
  patternId,
  prenom,
  nom,
  codePromo = "BIENVENUE5",
}: WelcomeEmailProps) {
  return (
    <>
      <WoodHeader patternId={patternId} />
      <section style={{ padding: "26px 24px 8px", textAlign: "center" }}>
        <h1
          style={{
            margin: 0,
            fontFamily: emailTheme.fontSerif,
            fontSize: 28,
            lineHeight: 1.2,
            fontWeight: 700,
            color: emailTheme.wood,
          }}
        >
          Bienvenue dans notre communauté
        </h1>
      </section>
      <section
        style={{
          padding: "12px 24px 20px",
          fontFamily: emailTheme.fontSans,
          fontSize: 16,
          lineHeight: 1.65,
          color: emailTheme.wood,
        }}
      >
        <p style={{ margin: "0 0 12px" }}>
          Bonjour <strong>{prenom}</strong>
          {nom ? ` ${nom}` : ""},
        </p>
        <p style={{ margin: 0 }}>
          Nous sommes ravis de vous accueillir sur{" "}
          <strong style={{ color: emailTheme.ocre }}>Afro-food</strong>. Ici, les
          terroirs se rencontrent : épices, plats du marché, boissons artisanales
          et une sélection passionnée — tout près de vous.
        </p>
      </section>

      <section style={{ padding: "8px 16px 8px" }}>
        <table
          role="presentation"
          cellPadding={0}
          cellSpacing={0}
          style={{ width: "100%", borderCollapse: "collapse" }}
        >
          <tbody>
            <tr>
              {[
                { icon: "🛒", t: "Catalogue", d: "Parcourez plats, épices et produits frais." },
                { icon: "📦", t: "Livraison", d: "Suivi simple et créneaux clairs." },
                { icon: "📖", t: "Blog", d: "Recettes, portraits et actus gourmandes." },
              ].map((c) => (
                <td key={c.t} style={{ width: "33%", verticalAlign: "top", padding: 8 }}>
                  <div
                    style={{
                      backgroundColor: emailTheme.white,
                      border: `1px solid ${emailTheme.border}`,
                      borderRadius: 12,
                      textAlign: "center",
                      padding: "16px 8px",
                    }}
                  >
                    <span style={{ fontSize: 28 }} aria-hidden>
                      {c.icon}
                    </span>
                    <p
                      style={{
                        margin: "8px 0 4px",
                        fontFamily: emailTheme.fontSerif,
                        fontSize: 15,
                        fontWeight: 700,
                        color: emailTheme.wood,
                      }}
                    >
                      {c.t}
                    </p>
                    <p
                      style={{
                        margin: 0,
                        fontFamily: emailTheme.fontSans,
                        fontSize: 12,
                        lineHeight: 1.45,
                        color: emailTheme.wood,
                        opacity: 0.82,
                      }}
                    >
                      {c.d}
                    </p>
                  </div>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </section>

      <p
        style={{
          textAlign: "center",
          padding: "0 24px 20px",
          fontFamily: emailTheme.fontSans,
          fontSize: 13,
        }}
      >
        <Link href="/catalogue" style={{ color: emailTheme.ocre, fontWeight: 700 }}>
          Découvrir le catalogue
        </Link>
        <span style={{ color: "#c4b8a8" }}> · </span>
        <Link href="/help" style={{ color: emailTheme.ocre, fontWeight: 700 }}>
          Centre d’aide
        </Link>
        <span style={{ color: "#c4b8a8" }}> · </span>
        <Link href="/blog" style={{ color: emailTheme.ocre, fontWeight: 700 }}>
          Lire le blog
        </Link>
      </p>

      <div style={{ padding: "8px 24px 24px" }}>
        <div
          style={{
            backgroundColor: "#fdebd5",
            border: `2px solid ${emailTheme.ocre}`,
            borderRadius: 14,
            padding: "20px 22px",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: "0 0 8px",
              fontFamily: emailTheme.fontSans,
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: emailTheme.brickDeep,
            }}
          >
            Offre première commande
          </p>
          <p
            style={{
              margin: "0 0 14px",
              fontFamily: emailTheme.fontSerif,
              fontSize: 18,
              fontWeight: 700,
              color: emailTheme.wood,
            }}
          >
            −5&nbsp;% sur votre premier panier
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: emailTheme.fontSans,
              fontSize: 14,
              color: emailTheme.wood,
              opacity: 0.88,
            }}
          >
            Code promo :{" "}
            <span
              style={{
                display: "inline-block",
                marginTop: 8,
                padding: "10px 20px",
                fontSize: 20,
                fontWeight: 800,
                letterSpacing: "0.08em",
                color: emailTheme.ivory,
                backgroundColor: emailTheme.ocre,
                borderRadius: 8,
              }}
            >
              {codePromo}
            </span>
          </p>
          <p
            style={{
              margin: "12px 0 0",
              fontFamily: emailTheme.fontSans,
              fontSize: 12,
              color: emailTheme.wood,
              opacity: 0.65,
            }}
          >
            Valable une fois, dès 35&nbsp;€ d’achat.
          </p>
        </div>
      </div>

      <div style={{ textAlign: "center", padding: "8px 24px 32px" }}>
        <Link
          href="/catalogue"
          style={{
            display: "inline-block",
            fontFamily: emailTheme.fontSans,
            fontSize: 15,
            fontWeight: 700,
            color: emailTheme.white,
            textDecoration: "none",
            padding: "15px 36px",
            borderRadius: 999,
            backgroundColor: emailTheme.ocre,
          }}
        >
          Commencer à explorer
        </Link>
      </div>

      <EmailFooter />
    </>
  );
}
