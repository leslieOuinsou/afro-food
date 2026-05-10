import Link from "next/link";
import { emailTheme } from "@/lib/emails/theme";
import { EmailFooter } from "@/components/emails/EmailFooter";
import { WoodHeader } from "@/components/emails/WoodHeader";

function ColisIllustration() {
  return (
    <svg
      width={200}
      height={120}
      viewBox="0 0 200 120"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Colis en livraison"
      style={{ display: "block", maxWidth: "100%", height: "auto" }}
    >
      <rect width={200} height={120} fill="#FFF7EA" />
      <rect x={28} y={48} width={96} height={56} rx={6} fill={emailTheme.ocre} opacity={0.92} />
      <rect x={36} y={56} width={36} height={14} rx={2} fill={emailTheme.ivory} opacity={0.95} />
      <path d="M124 72h48l12 20v12h-60V72z" fill={emailTheme.wood} />
      <circle cx={56} cy={108} r={10} fill={emailTheme.wood} />
      <circle cx={132} cy={108} r={10} fill={emailTheme.wood} />
      <rect x={148} y={56} width={24} height={8} rx={2} fill="#8B3A2A" />
      <path d="M40 40 L100 40 L96 48 L44 48 Z" fill="#8B3A2A" opacity={0.85} />
    </svg>
  );
}

type ExpeditionEmailProps = {
  patternId: string;
  prenom: string;
  numero: string;
  numeroSuivi: string;
  transporteur: string;
  dateEst: string;
  recapLines: string;
  ctaSuiviHref: string;
};

export function ExpeditionEmail({
  patternId,
  prenom,
  numero,
  numeroSuivi,
  transporteur,
  dateEst,
  recapLines,
  ctaSuiviHref,
}: ExpeditionEmailProps) {
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
        titleInWood="Votre commande est en route !"
        subtitleInWood="Votre colis a quitté nos partenaires — suivez-le en temps réel."
      />
      <div style={{ backgroundColor: emailTheme.ivory, padding: "24px 20px 8px" }}>
        <div
          style={{
            margin: "0 auto",
            backgroundColor: emailTheme.white,
            borderRadius: 16,
            border: `1px solid ${emailTheme.border}`,
            padding: "20px 24px",
            textAlign: "center",
          }}
        >
          <ColisIllustration />
        </div>
      </div>
      <div style={{ backgroundColor: emailTheme.ivory, padding: "12px 24px 8px" }}>
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
              margin: "0 0 10px",
              fontFamily: emailTheme.fontSans,
              fontSize: 15,
              lineHeight: 1.55,
              color: emailTheme.wood,
            }}
          >
            Bonjour <strong>{prenom}</strong>,
          </p>
          <p
            style={{
              margin: 0,
              fontFamily: emailTheme.fontSans,
              fontSize: 14,
              lineHeight: 1.55,
              color: emailTheme.wood,
              opacity: 0.88,
            }}
          >
            La commande <strong style={{ color: emailTheme.ocre }}>#{numero}</strong> est en cours
            d’acheminement.
          </p>
        </div>
      </div>
      <div style={{ backgroundColor: emailTheme.ivory, padding: "8px 24px" }}>
        <div
          style={{
            backgroundColor: emailTheme.white,
            borderRadius: 10,
            border: `1px solid ${emailTheme.border}`,
            padding: "14px 18px",
          }}
        >
          <p
            style={{
              margin: "0 0 6px",
              fontFamily: emailTheme.fontSans,
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: emailTheme.ocre,
            }}
          >
            Numéro de suivi
          </p>
          <p
            style={{
              margin: "0 0 12px",
              fontFamily: emailTheme.fontSerif,
              fontSize: 20,
              fontWeight: 700,
              color: emailTheme.wood,
              wordBreak: "break-all",
            }}
          >
            {numeroSuivi}
          </p>
          <p style={{ margin: "0 0 4px", fontFamily: emailTheme.fontSans, fontSize: 13, color: emailTheme.wood }}>
            <strong>{transporteur}</strong>
          </p>
          <p style={{ margin: 0, fontFamily: emailTheme.fontSans, fontSize: 13, color: emailTheme.wood, opacity: 0.8 }}>
            Livraison estimée : {dateEst}
          </p>
        </div>
      </div>
      <div style={{ backgroundColor: emailTheme.ivory, padding: "8px 24px 20px" }}>
        <div
          style={{
            backgroundColor: "#faf6ef",
            borderRadius: 10,
            border: `1px dashed ${emailTheme.border}`,
            padding: "14px 16px",
            fontFamily: emailTheme.fontSans,
            fontSize: 13,
            lineHeight: 1.55,
            color: emailTheme.wood,
            whiteSpace: "pre-line",
          }}
        >
          {recapLines}
        </div>
      </div>
      <div style={{ textAlign: "center", backgroundColor: emailTheme.ivory, padding: "8px 24px 28px" }}>
        <Link
          href={ctaSuiviHref}
          style={{
            display: "inline-block",
            fontFamily: emailTheme.fontSans,
            fontSize: 15,
            fontWeight: 700,
            color: emailTheme.white,
            textDecoration: "none",
            padding: "14px 28px",
            borderRadius: 999,
            backgroundColor: emailTheme.ocre,
          }}
        >
          Suivre le colis
        </Link>
      </div>
      <EmailFooter variant="minimal" />
    </div>
  );
}
