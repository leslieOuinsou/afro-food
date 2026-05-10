import Link from "next/link";
import { Fragment } from "react";
import { emailTheme } from "@/lib/emails/theme";
import { WoodHeader } from "@/components/emails/WoodHeader";

type ArticleRow = { nom: string; image: string; qty: number; ligne: string };

type OrderConfirmationEmailProps = {
  patternId: string;
  prenom: string;
  numero: string;
  dateCmd: string;
  articles: ArticleRow[];
  adresseHtml: string;
  sousTotal: string;
  livraison: string;
  remise?: string;
  total: string;
  suiviHref: string;
};

export function OrderConfirmationEmail({
  patternId,
  prenom,
  numero,
  dateCmd,
  articles,
  adresseHtml,
  sousTotal,
  livraison,
  remise,
  total,
  suiviHref,
}: OrderConfirmationEmailProps) {
  return (
    <div
      style={{
        borderRadius: 12,
        overflow: "hidden",
        border: `1px solid ${emailTheme.border}`,
      }}
    >
      <WoodHeader
        patternId={patternId}
        titleInWood="Votre commande est confirmée"
        subtitleInWood="Merci pour votre confiance — vos saveurs arrivent bientôt."
      />
      <div
        style={{
          backgroundColor: emailTheme.ivory,
          padding: "28px 24px 8px",
        }}
      >
        <p
          style={{
            margin: "0 0 8px",
            fontFamily: emailTheme.fontSans,
            fontSize: 16,
            lineHeight: 1.6,
            color: emailTheme.wood,
          }}
        >
          Bonjour <strong>{prenom}</strong>,
        </p>
        <p
          style={{
            margin: "0 0 20px",
            fontFamily: emailTheme.fontSans,
            fontSize: 15,
            lineHeight: 1.6,
            color: emailTheme.wood,
          }}
        >
          Nous avons bien enregistré votre commande. Voici le récapitulatif.
        </p>
        <div
          style={{
            backgroundColor: emailTheme.white,
            borderRadius: 10,
            border: `1px solid ${emailTheme.border}`,
            padding: "16px 18px",
          }}
        >
          <p
            style={{
              margin: "0 0 6px",
              fontFamily: emailTheme.fontSans,
              fontSize: 13,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: emailTheme.ocre,
            }}
          >
            Commande
          </p>
          <p
            style={{
              margin: "0 0 4px",
              fontFamily: emailTheme.fontSerif,
              fontSize: 22,
              fontWeight: 700,
              color: emailTheme.wood,
            }}
          >
            #{numero}
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: emailTheme.fontSans,
              fontSize: 14,
              color: emailTheme.wood,
              opacity: 0.75,
            }}
          >
            Passée le {dateCmd}
          </p>
        </div>
      </div>

      <div style={{ backgroundColor: emailTheme.ivory, padding: "8px 24px" }}>
        <div
          style={{
            backgroundColor: emailTheme.white,
            borderRadius: 10,
            border: `1px solid ${emailTheme.border}`,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "14px 16px",
              backgroundColor: emailTheme.wood,
              fontFamily: emailTheme.fontSans,
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: emailTheme.ivory,
            }}
          >
            Récapitulatif des produits
          </div>
          <table
            role="presentation"
            style={{ width: "100%", borderCollapse: "collapse" }}
          >
            <tbody>
              {articles.map((a, index) => (
                <Fragment key={`${a.nom}-${index}`}>
                  {index > 0 ? (
                    <tr>
                      <td colSpan={4} style={{ borderTop: "1px solid #efe6d4" }} />
                    </tr>
                  ) : null}
                  <tr>
                    <td style={{ padding: "14px 0 14px 14px", width: 72, verticalAlign: "top" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={a.image}
                        width={64}
                        height={64}
                        alt=""
                        style={{
                          display: "block",
                          borderRadius: 8,
                          border: `1px solid ${emailTheme.border}`,
                          objectFit: "cover",
                        }}
                      />
                    </td>
                    <td
                      style={{
                        padding: "14px 8px",
                        fontFamily: emailTheme.fontSans,
                        fontSize: 15,
                        fontWeight: 700,
                        color: emailTheme.wood,
                        verticalAlign: "middle",
                      }}
                    >
                      {a.nom}
                    </td>
                    <td
                      style={{
                        padding: "14px 6px",
                        textAlign: "center",
                        fontFamily: emailTheme.fontSans,
                        fontSize: 14,
                        color: emailTheme.wood,
                        verticalAlign: "middle",
                        width: 44,
                      }}
                    >
                      ×&nbsp;{a.qty}
                    </td>
                    <td
                      style={{
                        padding: "14px 14px 14px 6px",
                        textAlign: "right",
                        fontFamily: emailTheme.fontSans,
                        fontSize: 15,
                        fontWeight: 700,
                        color: emailTheme.ocre,
                        verticalAlign: "middle",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {a.ligne}
                    </td>
                  </tr>
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ backgroundColor: emailTheme.ivory, padding: "8px 24px 20px" }}>
        <div
          style={{
            backgroundColor: emailTheme.white,
            borderRadius: 10,
            border: `1px solid ${emailTheme.border}`,
          }}
        >
          <div style={{ padding: "16px 18px" }}>
            <p
              style={{
                margin: "0 0 8px",
                fontFamily: emailTheme.fontSans,
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                color: emailTheme.ocre,
              }}
            >
              Adresse de livraison
            </p>
            <p
              style={{
                margin: 0,
                fontFamily: emailTheme.fontSans,
                fontSize: 14,
                lineHeight: 1.55,
                color: emailTheme.wood,
              }}
              dangerouslySetInnerHTML={{ __html: adresseHtml }}
            />
          </div>
          <div style={{ borderTop: `1px solid #efe6d4`, padding: "14px 18px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                <tr>
                  <td style={{ fontFamily: emailTheme.fontSans, fontSize: 14, color: emailTheme.wood, padding: "4px 0" }}>
                    Sous-total TTC
                  </td>
                  <td style={{ textAlign: "right", fontFamily: emailTheme.fontSans, fontSize: 14, color: emailTheme.wood, padding: "4px 0" }}>
                    {sousTotal}
                  </td>
                </tr>
                <tr>
                  <td style={{ fontFamily: emailTheme.fontSans, fontSize: 14, color: emailTheme.wood, padding: "4px 0" }}>
                    Livraison
                  </td>
                  <td style={{ textAlign: "right", fontFamily: emailTheme.fontSans, fontSize: 14, color: emailTheme.wood, padding: "4px 0" }}>
                    {livraison}
                  </td>
                </tr>
                {remise ? (
                  <tr>
                    <td style={{ fontFamily: emailTheme.fontSans, fontSize: 14, color: emailTheme.wood, padding: "4px 0" }}>
                      Remise
                    </td>
                    <td style={{ textAlign: "right", fontFamily: emailTheme.fontSans, fontSize: 14, color: "#1a7f37", padding: "4px 0" }}>
                      {remise}
                    </td>
                  </tr>
                ) : null}
                <tr>
                  <td colSpan={2} style={{ paddingTop: 10, borderTop: `2px solid ${emailTheme.ocre}` }}>
                    <table style={{ width: "100%" }}>
                      <tbody>
                        <tr>
                          <td style={{ fontFamily: emailTheme.fontSerif, fontSize: 18, fontWeight: 700, color: emailTheme.wood, paddingTop: 8 }}>
                            Total TTC
                          </td>
                          <td style={{ textAlign: "right", fontFamily: emailTheme.fontSerif, fontSize: 20, fontWeight: 700, color: emailTheme.ocre, paddingTop: 8 }}>
                            {total}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          backgroundColor: emailTheme.ivory,
          padding: "8px 24px 28px",
          borderRadius: "0 0 12px 12px",
        }}
      >
        <Link
          href={suiviHref}
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
          Suivre ma commande
        </Link>
        <p
          style={{
            margin: "16px 0 0",
            fontFamily: emailTheme.fontSans,
            fontSize: 12,
            lineHeight: 1.5,
            color: emailTheme.wood,
            opacity: 0.65,
          }}
        >
          Une question ? Répondez à cet e-mail ou visitez notre centre d’aide.
        </p>
      </div>

      <div style={{ textAlign: "center", padding: "20px 16px 32px" }}>
        <p style={{ margin: "0 0 10px", fontFamily: emailTheme.fontSans, fontSize: 12, lineHeight: 1.6, opacity: 0.7 }}>
          <Link href="/help" style={{ color: emailTheme.ocre }}>
            Centre d’aide
          </Link>
          <span style={{ color: "#c4b8a8" }}> · </span>
          <Link href="/terms" style={{ color: emailTheme.ocre }}>
            Conditions générales
          </Link>
          <span style={{ color: "#c4b8a8" }}> · </span>
          <Link href="/compte/notifications" style={{ color: emailTheme.ocre }}>
            Se désabonner
          </Link>
        </p>
        <p style={{ margin: 0, fontFamily: emailTheme.fontSans, fontSize: 11, opacity: 0.5 }}>
          © {new Date().getFullYear()} Afro-food — Marketplace de nourriture africaine
        </p>
      </div>
    </div>
  );
}
