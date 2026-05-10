import { emailTheme } from "@/lib/emails/theme";

type WoodHeaderProps = {
  /** ID unique du motif SVG (éviter les collisions si plusieurs SVG sur une page). */
  patternId: string;
  /** Titre dans le bandeau bois (texte ivoire). */
  titleInWood?: string;
  subtitleInWood?: string;
  /** Hauteur du motif SVG (px). */
  patternHeight?: number;
  /** Traits brique supplémentaires dans le motif (ex. panier abandonné). */
  withBrickAccent?: boolean;
};

export function WoodHeader({
  patternId,
  titleInWood,
  subtitleInWood,
  patternHeight = 72,
  withBrickAccent = false,
}: WoodHeaderProps) {
  return (
    <div style={{ backgroundColor: emailTheme.wood, padding: 0 }}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={600}
        height={patternHeight}
        viewBox={`0 0 600 ${patternHeight}`}
        preserveAspectRatio="xMidYMid slice"
        style={{
          display: "block",
          width: "100%",
          maxWidth: 600,
          height: "auto",
        }}
        aria-hidden
      >
        <defs>
          <pattern
            id={patternId}
            x={0}
            y={0}
            width={24}
            height={24}
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M0 12h24M12 0v24"
              stroke={emailTheme.ocre}
              strokeWidth={1.2}
              opacity={0.35}
            />
            {withBrickAccent ? (
              <path
                d="M0 0l24 24M24 0L0 24"
                stroke={emailTheme.brick}
                strokeWidth={0.7}
                opacity={0.22}
              />
            ) : null}
            <path
              d="M0 0l24 24M24 0L0 24"
              stroke={emailTheme.ivory}
              strokeWidth={0.8}
              opacity={0.12}
            />
            <rect
              x={0}
              y={0}
              width={24}
              height={24}
              fill="none"
              stroke={emailTheme.ocre}
              strokeWidth={0.5}
              opacity={0.2}
            />
          </pattern>
        </defs>
        <rect width={600} height={patternHeight} fill={emailTheme.wood} />
        <rect width={600} height={patternHeight} fill={`url(#${patternId})`} />
      </svg>
      <div style={{ textAlign: "center", padding: "8px 20px 24px" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-afro-eats.png"
          width={52}
          height={52}
          alt="Afro-food"
          style={{
            display: "block",
            margin: "0 auto",
            border: 0,
            borderRadius: 12,
            backgroundColor: emailTheme.ivory,
            padding: 4,
          }}
        />
        {titleInWood ? (
          <h1
            style={{
              margin: "16px 0 0",
              fontFamily: emailTheme.fontSerif,
              fontSize: 26,
              lineHeight: 1.25,
              fontWeight: 700,
              color: emailTheme.ivory,
              padding: "0 8px",
            }}
          >
            {titleInWood}
          </h1>
        ) : null}
        {subtitleInWood ? (
          <p
            style={{
              margin: "12px 0 0",
              fontFamily: emailTheme.fontSans,
              fontSize: 14,
              lineHeight: 1.5,
              color: emailTheme.ivory,
              opacity: 0.9,
              padding: "0 8px",
            }}
          >
            {subtitleInWood}
          </p>
        ) : null}
      </div>
    </div>
  );
}
