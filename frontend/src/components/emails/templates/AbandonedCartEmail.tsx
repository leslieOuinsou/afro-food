import Link from "next/link";
import { emailTheme } from "@/lib/emails/theme";
import { EmailFooter } from "@/components/emails/EmailFooter";
import { WoodHeader } from "@/components/emails/WoodHeader";

export type CartLine = {
  nom: string;
  image?: string;
  prix: number;
  quantite?: number;
  stockRestant?: number;
  stockMessage?: string;
};

type AbandonedCartEmailProps = {
  patternId: string;
  prenom: string;
  articles: CartLine[];
  cartUrl: string;
};

function formatMoneyEUR(n: number) {
  return `${n.toFixed(2).replace(".", ",")}\u00A0€`;
}

function stockHintFr(stockRestant?: number, custom?: string) {
  if (custom?.trim()) return custom;
  if (stockRestant == null || Number.isNaN(Number(stockRestant))) {
    return "Encore disponible — parfait pour reprendre tranquillement.";
  }
  const s = Number(stockRestant);
  if (s <= 0) return "Revenez vite : ce produit part parfois vite des étals.";
  if (s <= 3) {
    return "Il reste peu de portions aujourd’hui — sans vous presser, juste pour info.";
  }
  if (s <= 12) {
    return "Stock limité : d’autres curieux regardent aussi ce plat.";
  }
  return "Stock confortable — vous pouvez prendre votre temps.";
}

export function AbandonedCartEmail({
  patternId,
  prenom,
  articles,
  cartUrl,
}: AbandonedCartEmailProps) {
  const MAX = 6;
  const display = articles.slice(0, MAX);
  const restCount = Math.max(0, articles.length - MAX);
  const placeholder =
    "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80";

  const rows: CartLine[][] = [];
  for (let i = 0; i < display.length; i += 2) {
    rows.push(display.slice(i, i + 2));
  }

  function Card({ a }: { a: CartLine }) {
    const qty = Number(a.quantite) > 1 ? Number(a.quantite) : 1;
    const line = formatMoneyEUR(Number(a.prix) * qty);
    const stock = stockHintFr(a.stockRestant, a.stockMessage);
    return (
      <div
        style={{
          backgroundColor: emailTheme.white,
          border: `1px solid ${emailTheme.border}`,
          borderRadius: 12,
          overflow: "hidden",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={a.image || placeholder}
          alt=""
          width={260}
          style={{
            display: "block",
            width: "100%",
            maxWidth: 260,
            height: "auto",
            aspectRatio: "4/3",
            objectFit: "cover",
            backgroundColor: emailTheme.cream,
          }}
        />
        <div style={{ padding: "12px 12px 6px" }}>
          <p
            style={{
              margin: 0,
              fontFamily: emailTheme.fontSerif,
              fontSize: 15,
              fontWeight: 700,
              color: emailTheme.wood,
              lineHeight: 1.3,
            }}
          >
            {a.nom}
            {qty > 1 ? (
              <span style={{ fontWeight: 600, opacity: 0.75 }}> × {qty}</span>
            ) : null}
          </p>
        </div>
        <p
          style={{
            margin: "0 12px 4px",
            fontFamily: emailTheme.fontSans,
            fontSize: 16,
            fontWeight: 700,
            color: emailTheme.ocre,
          }}
        >
          {line}
        </p>
        <p
          style={{
            margin: "0 12px 14px",
            fontFamily: emailTheme.fontSans,
            fontSize: 12,
            lineHeight: 1.45,
            color: emailTheme.brick,
          }}
        >
          {stock}
        </p>
      </div>
    );
  }

  return (
    <>
      <WoodHeader patternId={patternId} patternHeight={76} withBrickAccent />
      <section style={{ padding: "26px 22px 8px", textAlign: "center" }}>
        <h1
          style={{
            margin: 0,
            fontFamily: emailTheme.fontSerif,
            fontSize: 25,
            lineHeight: 1.25,
            fontWeight: 700,
            color: emailTheme.wood,
          }}
        >
          Vous avez oublié quelque chose ?
        </h1>
      </section>
      <section
        style={{
          padding: "10px 22px 18px",
          fontFamily: emailTheme.fontSans,
          fontSize: 16,
          lineHeight: 1.65,
          color: emailTheme.wood,
        }}
      >
        <p style={{ margin: "0 0 12px" }}>
          Bonjour <strong>{prenom}</strong>,
        </p>
        <p style={{ margin: 0 }}>
          Pas de stress : votre panier est resté tel quel, au chaud de notre côté.
          Si l’envie vous reprend, il suffit d’un clic — on vous laisse reprendre à
          votre rythme, sans blabla commercial.
        </p>
      </section>

      <div style={{ padding: "6px 14px" }}>
        {display.length === 0 ? (
          <p
            style={{
              textAlign: "center",
              padding: 16,
              fontFamily: emailTheme.fontSans,
              fontSize: 14,
              color: emailTheme.wood,
            }}
          >
            Reprenez depuis le catalogue : votre panier était peut-être vide ou a
            expiré.
          </p>
        ) : (
          rows.map((pair, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 8,
              }}
            >
              <Card a={pair[0]} />
              {pair[1] ? <Card a={pair[1]} /> : <div />}
            </div>
          ))
        )}
      </div>

      {restCount > 0 ? (
        <p
          style={{
            textAlign: "center",
            padding: "0 22px 14px",
            fontFamily: emailTheme.fontSans,
            fontSize: 14,
            color: emailTheme.wood,
            opacity: 0.85,
          }}
        >
          + {restCount} autre{restCount > 1 ? "s" : ""} article
          {restCount > 1 ? "s" : ""} dans votre panier
        </p>
      ) : null}

      <div style={{ textAlign: "center", padding: "12px 20px 22px" }}>
        <Link
          href={cartUrl}
          style={{
            display: "inline-block",
            fontFamily: emailTheme.fontSans,
            fontSize: 16,
            fontWeight: 700,
            color: emailTheme.white,
            textDecoration: "none",
            padding: "16px 40px",
            borderRadius: 8,
            backgroundColor: emailTheme.ocre,
            border: `2px solid ${emailTheme.brick}`,
          }}
        >
          Reprendre mon panier
        </Link>
      </div>

      <div style={{ padding: "8px 18px 22px" }}>
        <div
          style={{
            backgroundColor: emailTheme.creamBlock,
            border: `1px solid ${emailTheme.borderWarm}`,
            borderRadius: 14,
          }}
        >
          <p
            style={{
              margin: 0,
              padding: "18px 16px 8px",
              fontFamily: emailTheme.fontSerif,
              fontSize: 15,
              fontWeight: 700,
              color: emailTheme.wood,
              textAlign: "center",
            }}
          >
            On veut que vous commandiez l’esprit tranquille
          </p>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 0,
              padding: "0 8px 18px",
            }}
          >
            {[
              {
                icon: "🚚",
                t: "Livraison",
                c: emailTheme.ocre,
                d: "Suivie, créneaux clairs, partout où nous livrons.",
              },
              {
                icon: "🔄",
                t: "Retours",
                c: emailTheme.brick,
                d: "Un souci ? Notre équipe vous répond, simplement et sans jargon.",
              },
              {
                icon: "🔒",
                t: "Paiement",
                c: emailTheme.ocre,
                d: "Sécurisé : vos données sont chiffrées, comme il se doit.",
              },
            ].map((b, idx) => (
              <div
                key={b.t}
                style={{
                  padding: "10px 6px",
                  textAlign: "center",
                  fontFamily: emailTheme.fontSans,
                  fontSize: 12,
                  lineHeight: 1.5,
                  color: emailTheme.wood,
                  borderLeft: idx === 1 ? `1px solid ${emailTheme.border}` : undefined,
                  borderRight: idx === 1 ? `1px solid ${emailTheme.border}` : undefined,
                }}
              >
                <span style={{ fontSize: 22, display: "block", marginBottom: 6 }} aria-hidden>
                  {b.icon}
                </span>
                <strong style={{ color: b.c, display: "block", marginBottom: 4 }}>{b.t}</strong>
                {b.d}
              </div>
            ))}
          </div>
        </div>
      </div>

      <p
        style={{
          margin: 0,
          padding: "0 22px 24px",
          fontFamily: emailTheme.fontSans,
          fontSize: 14,
          lineHeight: 1.6,
          color: emailTheme.wood,
          opacity: 0.88,
          textAlign: "center",
        }}
      >
        Si ce n’était pas le bon moment, aucun souci — ce message est juste un
        petit rappel amical.
      </p>

      <EmailFooter variant="cart" />
    </>
  );
}
