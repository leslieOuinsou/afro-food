import Link from "next/link";
import { emailTheme } from "@/lib/emails/theme";

type EmailFooterProps = {
  variant?: "default" | "cart" | "minimal";
  unsubscribeHref?: string;
};

const linkStyle: React.CSSProperties = {
  color: emailTheme.ocre,
  textDecoration: "underline",
  fontFamily: emailTheme.fontSans,
  fontSize: 12,
};

export function EmailFooter({
  variant = "default",
  unsubscribeHref = "/compte/notifications",
}: EmailFooterProps) {
  const year = new Date().getFullYear();

  if (variant === "cart") {
    return (
      <footer
        style={{
          textAlign: "center",
          padding: "18px 16px 28px",
          borderTop: `1px solid ${emailTheme.border}`,
          backgroundColor: emailTheme.ivory,
        }}
      >
        <p
          style={{
            margin: "0 0 10px",
            fontFamily: emailTheme.fontSans,
            fontSize: 12,
            lineHeight: 1.6,
            color: emailTheme.wood,
            opacity: 0.75,
          }}
        >
          <Link href={`${unsubscribeHref}?unsubscribe=cart`} style={{ ...linkStyle, color: emailTheme.brick }}>
            Ne plus recevoir ces rappels de panier
          </Link>
        </p>
        <p style={{ margin: "0 0 8px", opacity: 0.65 }}>
          <Link href="/contact" style={linkStyle}>
            Nous écrire
          </Link>
          <span style={{ color: "#c4b8a8" }}> · </span>
          <Link href="/help" style={linkStyle}>
            Aide
          </Link>
        </p>
        <p
          style={{
            margin: 0,
            fontFamily: emailTheme.fontSans,
            fontSize: 11,
            color: emailTheme.wood,
            opacity: 0.42,
          }}
        >
          © {year} Afro-food
        </p>
      </footer>
    );
  }

  if (variant === "minimal") {
    return (
      <footer
        style={{
          textAlign: "center",
          padding: "20px 16px 32px",
          fontFamily: emailTheme.fontSans,
          fontSize: 11,
          color: emailTheme.wood,
          opacity: 0.5,
        }}
      >
        © {year} Afro-food — Marketplace de nourriture africaine
      </footer>
    );
  }

  return (
    <footer
      style={{
        textAlign: "center",
        padding: "18px 16px 28px",
        borderTop: `1px solid ${emailTheme.border}`,
        backgroundColor: emailTheme.ivory,
      }}
    >
      <p style={{ margin: "0 0 8px", opacity: 0.75 }}>
        <Link href="/contact" style={linkStyle}>
          Une question ?
        </Link>
        <span style={{ color: "#c4b8a8" }}> · </span>
        <Link href="/help" style={linkStyle}>
          Aide
        </Link>
      </p>
      <p style={{ margin: "0 0 10px", opacity: 0.7 }}>
        <Link href={unsubscribeHref} style={linkStyle}>
          Gérer les e-mails de suivi
        </Link>
      </p>
      <p
        style={{
          margin: 0,
          fontFamily: emailTheme.fontSans,
          fontSize: 11,
          color: emailTheme.wood,
          opacity: 0.45,
        }}
      >
        © {year} Afro-food — Saveurs authentiques, qualité avant tout
      </p>
    </footer>
  );
}
