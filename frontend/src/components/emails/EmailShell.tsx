import { emailTheme } from "@/lib/emails/theme";

type EmailShellProps = {
  children: React.ReactNode;
  /** Texte préheader (aperçu boîte mail). */
  preheader?: string;
};

export function EmailShell({ children, preheader }: EmailShellProps) {
  return (
    <div
      style={{
        margin: 0,
        padding: "24px 12px",
        minHeight: "100vh",
        backgroundColor: emailTheme.ivory,
        WebkitTextSizeAdjust: "100%",
      }}
    >
      {preheader ? (
        <div
          style={{
            display: "none",
            maxHeight: 0,
            overflow: "hidden",
          }}
        >
          {preheader}
        </div>
      ) : null}
      <div
        style={{
          maxWidth: 600,
          margin: "0 auto",
          backgroundColor: emailTheme.ivory,
        }}
      >
        {children}
      </div>
    </div>
  );
}
