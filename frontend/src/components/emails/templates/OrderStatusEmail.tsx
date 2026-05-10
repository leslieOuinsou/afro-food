import Link from "next/link";
import { emailTheme } from "@/lib/emails/theme";
import { EmailFooter } from "@/components/emails/EmailFooter";
import { WoodHeader } from "@/components/emails/WoodHeader";

const STATUTS: Record<string, string> = {
  confirmee: "Votre commande a été confirmée et est en cours de préparation.",
  en_preparation: "Nos chefs préparent votre commande avec soin.",
  prete: "Votre commande est prête — le livreur arrive bientôt.",
  en_livraison: "Votre commande est en route. Encore un petit moment !",
  livree: "Votre commande a été livrée. Bon appétit !",
};

type OrderStatusEmailProps = {
  patternId: string;
  prenom: string;
  numero: string;
  statut: string;
  commandeHref: string;
};

export function OrderStatusEmail({
  patternId,
  prenom,
  numero,
  statut,
  commandeHref,
}: OrderStatusEmailProps) {
  const message = STATUTS[statut] || "Votre commande a été mise à jour.";
  const isLivree = statut === "livree";

  return (
    <>
      <WoodHeader
        patternId={patternId}
        titleInWood="Mise à jour de commande"
        subtitleInWood={`Commande #${numero}`}
      />
      <section
        style={{
          padding: "24px 24px 8px",
          fontFamily: emailTheme.fontSans,
          fontSize: 16,
          lineHeight: 1.65,
          color: emailTheme.wood,
        }}
      >
        <p style={{ margin: "0 0 12px" }}>
          Bonjour <strong>{prenom}</strong>,
        </p>
        <p style={{ margin: 0 }}>{message}</p>
      </section>
      <div style={{ padding: "16px 24px 24px", textAlign: "center" }}>
        <Link
          href={commandeHref}
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
          Voir ma commande
        </Link>
      </div>
      {isLivree ? (
        <div
          style={{
            margin: "0 20px 24px",
            padding: 16,
            backgroundColor: "#e8f5e8",
            borderRadius: 10,
            fontFamily: emailTheme.fontSans,
            fontSize: 14,
            lineHeight: 1.55,
            color: emailTheme.wood,
          }}
        >
          <strong>Votre avis nous intéresse</strong>
          <br />
          Un petit retour sur le plat ou la livraison aide toute la communauté — quand vous avez un moment.
        </div>
      ) : null}
      <EmailFooter />
    </>
  );
}
