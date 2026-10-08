'use client';

import { useState } from 'react';
import { GUIDE_TEXTE, promptInstall, useCanInstall, useInstallGuide, useIsInstalled } from '@/lib/install';

export default function InstallButton() {
  const peutInstaller = useCanInstall();
  const installee = useIsInstalled();
  const guide = useInstallGuide();
  const [aide, setAide] = useState(false);

  if (installee) {
    return <p className="text-sm text-[var(--wood)]/70">Application installée : retrouvez-la sur votre écran d’accueil.</p>;
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => (peutInstaller ? promptInstall() : setAide((v) => !v))}
        className="rounded-full bg-[var(--ochre)] px-6 py-3 text-sm font-semibold text-white hover:bg-[#a6500c]"
      >
        Installer l’application
      </button>
      {(aide || !peutInstaller) && guide && (
        <p className="text-sm text-[var(--wood)]/80">{GUIDE_TEXTE[guide]}</p>
      )}
    </div>
  );
}
