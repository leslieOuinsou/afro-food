import Link from "next/link";
import { emailTheme } from "@/lib/emails/theme";

type AuthVariant = "reset-password" | "verify-email";

type AuthEmailProps = {
  variant: AuthVariant;
  prenom: string;
  nom: string;
  actionHref: string;
};

const copy: Record<
  AuthVariant,
  { title: string; lead: string; button: string; validity: string; ignore: string }
> = {
  "reset-password": {
    title: "Réinitialisation du mot de passe",
    lead: "Vous avez demandé à réinitialiser votre mot de passe Afro-food.",
    button: "Réinitialiser mon mot de passe",
    validity: "Ce lien est valable pendant 1 heure.",
    ignore: "Si vous n’avez pas demandé cette réinitialisation, ignorez simplement cet e-mail.",
  },
  "verify-email": {
    title: "Vérification de votre e-mail",
    lead: "Merci de vous être inscrit sur Afro-food ! Pour finaliser votre inscription et sécuriser votre compte, confirmez votre adresse :",
    button: "Vérifier mon e-mail",
    validity: "Ce lien est valable pendant 24 heures.",
    ignore: "",
  },
};

/** Équivalent visuel du baseTemplate backend, charte Afro-food (aperçu Next.js). */
export function AuthEmail({ variant, prenom, nom, actionHref }: AuthEmailProps) {
  const c = copy[variant];
  return (
    <div
      style={{
        maxWidth: 600,
        margin: "0 auto",
        backgroundColor: emailTheme.white,
        borderRadius: 10,
        border: `1px solid ${emailTheme.border}`,
        overflow: "hidden",
        boxShadow: "0 0 12px rgba(44,26,14,0.08)",
      }}
    >
      <div
        style={{
          textAlign: "center",
          padding: "20px 16px",
          borderBottom: `2px solid ${emailTheme.ocre}`,
          backgroundColor: emailTheme.ivory,
        }}
      >
        <p
          style={{
            margin: 0,
            fontFamily: emailTheme.fontSerif,
            fontSize: 26,
            fontWeight: 700,
            color: emailTheme.ocre,
          }}
        >
          Afro-food
        </p>
        <p
          style={{
            margin: "6px 0 0",
            fontFamily: emailTheme.fontSans,
            fontSize: 13,
            color: emailTheme.wood,
            opacity: 0.85,
          }}
        >
          Saveurs authentiques d’Afrique
        </p>
      </div>
      <div style={{ padding: "28px 24px", fontFamily: emailTheme.fontSans, color: emailTheme.wood, lineHeight: 1.6 }}>
        <h2 style={{ margin: "0 0 16px", fontFamily: emailTheme.fontSerif, fontSize: 20, color: emailTheme.wood }}>
          {c.title}
        </h2>
        <p style={{ margin: "0 0 12px" }}>
          Bonjour {prenom} {nom},
        </p>
        <p style={{ margin: "0 0 20px" }}>{c.lead}</p>
        <p style={{ margin: "0 0 20px" }}>
          <Link
            href={actionHref}
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
            {c.button}
          </Link>
        </p>
        <p style={{ margin: "0 0 16px" }}>
          <strong>{c.validity}</strong>
        </p>
        {c.ignore ? <p style={{ margin: "0 0 16px" }}>{c.ignore}</p> : null}
        <p style={{ margin: 0, fontSize: 13, color: "#666" }}>
          Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :
          <br />
          <span style={{ wordBreak: "break-all", color: emailTheme.ocre }}>{actionHref}</span>
        </p>
      </div>
      <div
        style={{
          textAlign: "center",
          padding: "18px 16px",
          borderTop: "1px solid #eee",
          fontFamily: emailTheme.fontSans,
          fontSize: 13,
          color: "#666",
        }}
      >
        <p style={{ margin: "0 0 8px" }}>© {new Date().getFullYear()} Afro-food</p>
        <Link href="/contact" style={{ color: emailTheme.ocre }}>
          support@afro-food.com
        </Link>
      </div>
    </div>
  );
}
