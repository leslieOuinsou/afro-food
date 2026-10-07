'use client';

import { GUIDE_TEXTE, promptInstall, useCanInstall, useInstallGuide, useIsInstalled } from '@/lib/install';

export default function InstallButton() {
  const peutInstaller = useCanInstall();
  const installee = useIsInstalled();
  const guide = useInstallGuide();

  if (installee) {
    return <p className="text-sm text-[var(--wood)]/70">Application installée : retrouvez-la sur votre écran d’accueil.</p>;
  }

  return (
    <div className="space-y-2">
      {peutInstaller ? (
        <button
          type="button"
          onClick={() => promptInstall()}
          className="rounded-full bg-[var(--ochre)] px-6 py-3 text-sm font-semibold text-white hover:bg-[#a6500c]"
        >
          Installer l’application
        </button>
      ) : guide ? (
        <p className="text-sm text-[var(--wood)]/80">{GUIDE_TEXTE[guide]}</p>
      ) : null}
    </div>
  );
}
