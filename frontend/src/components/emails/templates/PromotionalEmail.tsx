import Link from "next/link";
import { emailTheme } from "@/lib/emails/theme";

type PromotionalEmailProps = {
  prenom: string;
  titre: string;
  contenu: string;
  codePromo?: string | null;
};

export function PromotionalEmail({
  prenom,
  titre,
  contenu,
  codePromo,
}: PromotionalEmailProps) {
  return (
    <div
      style={{
        maxWidth: 600,
        margin: "0 auto",
        backgroundColor: emailTheme.white,
        borderRadius: 10,
        border: `1px solid ${emailTheme.border}`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "20px 16px",
          background: `linear-gradient(135deg, ${emailTheme.ocre}, #e8944a)`,
          color: emailTheme.white,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: emailTheme.fontSerif,
            fontSize: 24,
            fontWeight: 700,
          }}
        >
          Afro-food
        </p>
      </div>
      <div style={{ padding: "28px 24px", fontFamily: emailTheme.fontSans, color: emailTheme.wood, lineHeight: 1.65 }}>
        <h2 style={{ margin: "0 0 12px", fontFamily: emailTheme.fontSerif, fontSize: 22, color: emailTheme.wood }}>
          {titre}
        </h2>
        <p style={{ margin: "0 0 16px" }}>Bonjour {prenom},</p>
        <p style={{ margin: "0 0 20px", whiteSpace: "pre-line" }}>{contenu}</p>
        {codePromo ? (
          <div
            style={{
              background: `linear-gradient(135deg, ${emailTheme.ocre}, #e8944a)`,
              color: emailTheme.white,
              padding: 20,
              borderRadius: 10,
              textAlign: "center",
              marginBottom: 20,
            }}
          >
            <h3 style={{ margin: "0 0 10px", fontFamily: emailTheme.fontSerif, fontSize: 18 }}>Offre du moment</h3>
            <p style={{ margin: "10px 0", fontSize: 18 }}>
              Code promo : <strong>{codePromo}</strong>
            </p>
            <p style={{ margin: 0, fontSize: 14, opacity: 0.95 }}>Valable selon les conditions indiquées sur le site</p>
          </div>
        ) : null}
        <p style={{ margin: 0 }}>
          <Link
            href="/catalogue"
            style={{
              display: "inline-block",
              backgroundColor: emailTheme.ocre,
              color: emailTheme.white,
              padding: "12px 28px",
              textDecoration: "none",
              borderRadius: 8,
              fontWeight: 700,
            }}
          >
            Commander maintenant
          </Link>
        </p>
      </div>
      <div
        style={{
          padding: "16px 24px 24px",
          fontFamily: emailTheme.fontSans,
          fontSize: 13,
          color: "#666",
          borderTop: "1px solid #eee",
        }}
      >
        Vous recevez cet e-mail car vous êtes abonné à notre newsletter.{" "}
        <Link href="/compte/notifications" style={{ color: emailTheme.ocre }}>
          Se désabonner
        </Link>
      </div>
    </div>
  );
}
