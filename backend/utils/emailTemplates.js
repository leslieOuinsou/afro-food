/**
 * Templates d'email pour l'application Afro-food
 */

import { coordonneesVirement, estVirementEnAttente } from './virement.js';

const FRONTEND = process.env.FRONTEND_URL || 'https://afro-eats.com';

/** Échappe les caractères HTML pour les contenus dynamiques */
function escapeHtml(str) {
  if (str == null || str === '') return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatMoneyEUR(n) {
  const v = Number(n);
  if (Number.isNaN(v)) return '0,00 €';
  return `${v.toFixed(2).replace('.', ',')}\u00A0€`;
}

// Template de base (charte ivoire / bois / ocre, mise en page en tables pour les clients mail)
const baseTemplate = (content, title = 'Afro-food') => `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <style>
    .afro-content h2 { font-family: Georgia, 'Times New Roman', serif; font-size: 26px; line-height: 1.25; color: #2C1A0E; margin: 0 0 16px; }
    .afro-content p { margin: 0 0 14px; }
    .afro-content strong { color: #2C1A0E; }
    .button { display: inline-block; background: #C2610F; color: #FFFFFF !important; padding: 14px 32px; text-decoration: none; border-radius: 999px; font-weight: 700; font-size: 15px; }
    @media only screen and (max-width: 620px) {
      .afro-card { border-radius: 0 !important; }
      .afro-pad { padding-left: 22px !important; padding-right: 22px !important; }
    }
  </style>
</head>
<body style="margin:0;padding:0;background-color:#F4EBDD;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F4EBDD;">
    <tr>
      <td align="center" style="padding:28px 12px;">
        <table role="presentation" class="afro-card" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#FFFDF8;border-radius:24px;overflow:hidden;border:1px solid #E8DCC4;">
          <tr>
            <td align="center" style="background-color:#2C1A0E;padding:28px 24px 24px;">
              <img src="${FRONTEND}/logo-afro-eats.png" width="64" height="64" alt="Afro-food" style="display:block;width:64px;height:64px;border-radius:50%;margin:0 auto 12px;" />
              <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:700;color:#FFFDF8;letter-spacing:.5px;">Afro-food</div>
              <div style="font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#E9B26B;margin-top:6px;">Saveurs authentiques d'Afrique</div>
            </td>
          </tr>
          <tr><td style="height:5px;background-color:#C2610F;font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr>
            <td class="afro-pad afro-content" style="padding:36px 40px 28px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#4A3426;">
              ${content}
            </td>
          </tr>
          <tr>
            <td class="afro-pad" align="center" style="padding:22px 40px 30px;border-top:1px solid #EFE6D4;font-family:Arial,Helvetica,sans-serif;font-size:12.5px;line-height:1.6;color:#8A7664;">
              <p style="margin:0 0 6px;">© ${new Date().getFullYear()} Afro-food · Cuisine camerounaise et béninoise</p>
              <p style="margin:0;">Une question ? Écrivez-nous à <a href="mailto:support@afro-eats.com" style="color:#C2610F;text-decoration:none;">support@afro-eats.com</a></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

/**
 * E-mail Bienvenue — HTML inline (charte ivoire / bois / ocre).
 * Aperçu statique : backend/templates/emails/bienvenue.html
 *
 * @param {string} nom
 * @param {string} prenom
 * @param {string} [codePromo=BIENVENUE10] — code première commande
 */
export const welcomeEmail = (nom, prenom, codePromo) => {
  const p = escapeHtml(prenom || '');
  const n = escapeHtml(nom || '');
  const code = escapeHtml(
    codePromo || process.env.WELCOME_PROMO_CODE || 'BIENVENUE10'
  );
  const logoUrl = `${FRONTEND}/logo-afro-eats.png`;

  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Bienvenue — Afro-food</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF3E0;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;">
    Bienvenue sur Afro-food — votre code promo et le catalogue vous attendent.
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#FAF3E0;">
    <tr>
      <td align="center" style="padding:0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;background-color:#FAF3E0;">
          <tr>
            <td style="padding:0;background-color:#2C1A0E;">
              <svg xmlns="http://www.w3.org/2000/svg" width="600" height="88" viewBox="0 0 600 88" preserveAspectRatio="xMidYMid slice" style="display:block;width:100%;max-width:600px;height:auto;">
                <defs>
                  <pattern id="welcomeKenteEmail" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M0 12h24M12 0v24" stroke="#C2610F" stroke-width="1.2" opacity="0.35"/>
                    <path d="M0 0l24 24M24 0L0 24" stroke="#FAF3E0" stroke-width="0.8" opacity="0.12"/>
                    <rect x="0" y="0" width="24" height="24" fill="none" stroke="#C2610F" stroke-width="0.5" opacity="0.2"/>
                  </pattern>
                </defs>
                <rect width="600" height="88" fill="#2C1A0E"/>
                <rect width="600" height="88" fill="url(#welcomeKenteEmail)"/>
              </svg>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding:8px 20px 28px 20px;">
                    <img src="${logoUrl}" width="56" height="56" alt="Afro-food" style="display:block;border:0;border-radius:14px;background-color:#FAF3E0;padding:5px;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 24px 8px 24px;background-color:#FAF3E0;">
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:28px;line-height:1.2;font-weight:700;color:#2C1A0E;text-align:center;">
                Bienvenue dans notre communauté
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 24px 20px 24px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.65;color:#2C1A0E;background-color:#FAF3E0;">
              <p style="margin:0 0 12px 0;">Bonjour <strong style="color:#2C1A0E;">${p}</strong>${n ? ` ${n}` : ''},</p>
              <p style="margin:0;">
                Nous sommes ravis de vous accueillir sur <strong style="color:#C2610F;">Afro-food</strong>. Ici, les terroirs se rencontrent : épices, plats du marché, boissons artisanales et une sélection passionnée — tout près de vous.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 16px 8px 16px;background-color:#FAF3E0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td width="33%" valign="top" style="padding:8px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#ffffff;border:1px solid #e8dcc4;border-radius:12px;">
                      <tr><td align="center" style="padding:16px 10px 8px 10px;font-size:28px;line-height:1;">🛒</td></tr>
                      <tr><td align="center" style="padding:0 8px 8px 8px;font-family:Georgia,serif;font-size:15px;font-weight:700;color:#2C1A0E;">Catalogue</td></tr>
                      <tr><td align="center" style="padding:0 8px 16px 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.45;color:#2C1A0E;opacity:0.82;">Parcourez plats, épices et produits frais.</td></tr>
                    </table>
                  </td>
                  <td width="33%" valign="top" style="padding:8px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#ffffff;border:1px solid #e8dcc4;border-radius:12px;">
                      <tr><td align="center" style="padding:16px 10px 8px 10px;font-size:28px;line-height:1;">📦</td></tr>
                      <tr><td align="center" style="padding:0 8px 8px 8px;font-family:Georgia,serif;font-size:15px;font-weight:700;color:#2C1A0E;">Livraison</td></tr>
                      <tr><td align="center" style="padding:0 8px 16px 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.45;color:#2C1A0E;opacity:0.82;">Suivi simple et créneaux clairs.</td></tr>
                    </table>
                  </td>
                  <td width="33%" valign="top" style="padding:8px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#ffffff;border:1px solid #e8dcc4;border-radius:12px;">
                      <tr><td align="center" style="padding:16px 10px 8px 10px;font-size:28px;line-height:1;">📖</td></tr>
                      <tr><td align="center" style="padding:0 8px 8px 8px;font-family:Georgia,serif;font-size:15px;font-weight:700;color:#2C1A0E;">Blog</td></tr>
                      <tr><td align="center" style="padding:0 8px 16px 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.45;color:#2C1A0E;opacity:0.82;">Recettes, portraits et actus gourmandes.</td></tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 24px 20px 24px;background-color:#FAF3E0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;">
                    <a href="${FRONTEND}/catalogue" style="color:#C2610F;font-weight:700;text-decoration:underline;">Découvrir le catalogue</a>
                    <span style="color:#c4b8a8;"> &nbsp;·&nbsp; </span>
                    <a href="${FRONTEND}/help" style="color:#C2610F;font-weight:700;text-decoration:underline;">Centre d’aide</a>
                    <span style="color:#c4b8a8;"> &nbsp;·&nbsp; </span>
                    <a href="${FRONTEND}/blog" style="color:#C2610F;font-weight:700;text-decoration:underline;">Lire le blog</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 24px 24px;background-color:#FAF3E0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#fdebd5;border:2px solid #C2610F;border-radius:14px;">
                <tr>
                  <td style="padding:20px 22px;text-align:center;">
                    <p style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#8B3A2A;">Offre première commande</p>
                    <p style="margin:0 0 14px 0;font-family:Georgia,serif;font-size:18px;font-weight:700;color:#2C1A0E;">−10&nbsp;% sur votre premier panier</p>
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#2C1A0E;opacity:0.88;">
                      Code promo :
                      <span style="display:inline-block;margin-top:8px;padding:10px 20px;font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:800;letter-spacing:0.08em;color:#FAF3E0;background-color:#C2610F;border-radius:8px;">${code}</span>
                    </p>
                    <p style="margin:12px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#2C1A0E;opacity:0.65;">Valable une fois, dès 35&nbsp;€ d’achat.</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:8px 24px 32px 24px;background-color:#FAF3E0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="border-radius:999px;background-color:#C2610F;">
                    <a href="${FRONTEND}/catalogue" style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;display:inline-block;padding:15px 36px;border-radius:999px;">Commencer à explorer</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 16px 28px 16px;border-top:1px solid #e8dcc4;background-color:#FAF3E0;">
              <p style="margin:0 0 12px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;color:#2C1A0E;opacity:0.75;">Suivez-nous</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td style="padding:0 8px;"><a href="https://www.facebook.com" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#C2610F;text-decoration:underline;">Facebook</a></td>
                  <td style="padding:0 8px;"><a href="https://www.instagram.com" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#C2610F;text-decoration:underline;">Instagram</a></td>
                  <td style="padding:0 8px;"><a href="https://twitter.com" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#C2610F;text-decoration:underline;">X</a></td>
                  <td style="padding:0 8px;"><a href="https://www.tiktok.com" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#C2610F;text-decoration:underline;">TikTok</a></td>
                </tr>
              </table>
              <p style="margin:16px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#2C1A0E;opacity:0.45;">© ${new Date().getFullYear()} Afro-food — Tous droits réservés.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

/**
 * Email de confirmation de commande — HTML entièrement inline (clients mail).
 * Variante statique d’aperçu : backend/templates/emails/commande-confirmation.html
 */
export const orderConfirmationEmail = (commande, client) => {
  const prenom = escapeHtml(client?.prenom || commande?.informationsClient?.prenom || '');
  const numero = escapeHtml(commande.numeroCommande || '');
  const idCmd = String(commande._id || commande.id || '');
  const suiviUrl = `${FRONTEND}/commande/${encodeURIComponent(idCmd)}`;
  const logoUrl = `${FRONTEND}/logo-afro-eats.png`;
  const dateCmd = commande.createdAt
    ? new Date(commande.createdAt).toLocaleString('fr-FR', {
        dateStyle: 'long',
        timeStyle: 'short',
      })
    : new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });

  const placeholderImg =
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=120&q=80';

  const articlesRows = (commande.articles || [])
    .map((article, index) => {
      const imgSrc = escapeHtml(article.informationsPlat?.image || placeholderImg);
      const nom = escapeHtml(article.informationsPlat?.nom || 'Produit');
      const qty = Number(article.quantite) || 0;
      const ligne = formatMoneyEUR(article.sousTotal);
      const sep =
        index > 0
          ? '<tr><td colspan="4" style="border-top:1px solid #efe6d4;"></td></tr>'
          : '';
      return `${sep}
                <tr>
                  <td width="72" valign="top" style="padding:14px 0 14px 14px;width:72px;">
                    <img src="${imgSrc}" width="64" height="64" alt="" style="display:block;width:64px;height:64px;object-fit:cover;border-radius:8px;border:1px solid #e8dcc4;" />
                  </td>
                  <td valign="middle" style="padding:14px 8px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#2C1A0E;line-height:1.35;">
                    ${nom}
                  </td>
                  <td valign="middle" align="center" width="44" style="padding:14px 6px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#2C1A0E;">
                    ×&nbsp;${qty}
                  </td>
                  <td valign="middle" align="right" width="88" style="padding:14px 14px 14px 6px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#C2610F;white-space:nowrap;">
                    ${ligne}
                  </td>
                </tr>`;
    })
    .join('');

  const addr = commande.adresseLivraison || {};
  const ligneAdresse = [
    escapeHtml(addr.nom),
    escapeHtml(addr.adresse),
    `${escapeHtml(addr.codePostal || '')} ${escapeHtml(addr.ville || '')}`.trim(),
    escapeHtml(addr.pays || 'France'),
  ]
    .filter(Boolean)
    .join('<br />');

  const m = commande.montants || {};
  const sousTotal = formatMoneyEUR(m.sousTotal);
  const livraison = formatMoneyEUR(m.fraisLivraison ?? 0);
  const remise =
    m.remise > 0
      ? `<tr>
        <td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#2C1A0E;padding:4px 0;">Remise</td>
        <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1a7f37;padding:4px 0;">−${formatMoneyEUR(m.remise)}</td>
      </tr>`
      : '';

  const vir = estVirementEnAttente(commande) ? coordonneesVirement(commande) : null;
  const ligneVir = (l, v) =>
    v
      ? `<tr><td style="padding:3px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#8A7664;width:110px;">${l}</td><td style="padding:3px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#2C1A0E;">${escapeHtml(v)}</td></tr>`
      : '';
  const virementBloc = estVirementEnAttente(commande)
    ? `<tr><td style="background-color:#FAF3E0;padding:0 24px 22px 24px;border-left:1px solid #e8dcc4;border-right:1px solid #e8dcc4;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFFFFF;border:2px solid #C2610F;border-radius:12px;">
          <tr><td style="padding:16px 18px;">
            <p style="margin:0 0 10px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700;color:#C2610F;">Paiement par virement</p>
            ${
              vir
                ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0">${ligneVir('Bénéficiaire', vir.titulaire)}${ligneVir('IBAN', vir.iban)}${ligneVir('BIC', vir.bic)}${ligneVir('Banque', vir.banque)}${ligneVir('Montant', formatMoneyEUR(m.total))}${ligneVir('Référence', vir.reference)}</table>
            <p style="margin:10px 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12.5px;color:#8A7664;">Indiquez la référence <strong>${escapeHtml(vir.reference)}</strong> dans le libellé du virement. Votre commande sera préparée dès réception.</p>`
                : `<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#2C1A0E;">Nos coordonnées bancaires vous seront communiquées très prochainement par notre équipe.</p>`
            }
          </td></tr>
        </table>
      </td></tr>`
    : '';

  const totalTtc = formatMoneyEUR(m.total);

  const emailQuery = client?.email
    ? `?unsubscribe=1&email=${encodeURIComponent(client.email)}`
    : '?unsubscribe=1';

  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Confirmation de commande — Afro-food</title>
</head>
<body style="margin:0;padding:0;width:100%;background-color:#FAF3E0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    Commande ${numero} confirmée — détail sur Afro-food.
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#FAF3E0;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;width:100%;background-color:#FAF3E0;border-radius:12px;overflow:hidden;">
          <tr>
            <td align="center" style="background-color:#2C1A0E;padding:28px 24px 24px 24px;border-radius:12px 12px 0 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom:16px;">
                    <img src="${logoUrl}" width="56" height="56" alt="Afro-food" style="display:block;border:0;width:56px;height:56px;border-radius:12px;background-color:#FAF3E0;padding:4px;" />
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.25;font-weight:700;color:#FAF3E0;padding:0 8px;">
                    Votre commande est confirmée
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#FAF3E0;padding:12px 8px 0 8px;opacity:0.9;">
                    Merci pour votre confiance — vos saveurs arrivent bientôt.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#FAF3E0;padding:28px 24px 8px 24px;border-left:1px solid #e8dcc4;border-right:1px solid #e8dcc4;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.6;color:#2C1A0E;padding-bottom:8px;">
                    Bonjour <strong style="color:#2C1A0E;">${prenom}</strong>,
                  </td>
                </tr>
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#2C1A0E;padding-bottom:20px;">
                    Nous avons bien enregistré votre commande. Voici le récapitulatif.
                  </td>
                </tr>
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#ffffff;border-radius:10px;border:1px solid #e8dcc4;">
                <tr>
                  <td style="padding:16px 18px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#C2610F;padding-bottom:6px;">Commande</td>
                      </tr>
                      <tr>
                        <td style="font-family:Georgia,'Times New Roman',serif;font-size:22px;font-weight:700;color:#2C1A0E;padding-bottom:4px;">#${numero}</td>
                      </tr>
                      <tr>
                        <td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#2C1A0E;opacity:0.75;">Passée le ${escapeHtml(dateCmd)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#FAF3E0;padding:8px 24px 8px 24px;border-left:1px solid #e8dcc4;border-right:1px solid #e8dcc4;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#ffffff;border-radius:10px;border:1px solid #e8dcc4;">
                <tr>
                  <td colspan="4" style="padding:14px 16px;background-color:#2C1A0E;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#FAF3E0;">
                    Récapitulatif des produits
                  </td>
                </tr>
                ${articlesRows}
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#FAF3E0;padding:8px 24px 20px 24px;border-left:1px solid #e8dcc4;border-right:1px solid #e8dcc4;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#ffffff;border-radius:10px;border:1px solid #e8dcc4;">
                <tr>
                  <td style="padding:16px 18px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#C2610F;padding-bottom:8px;">Adresse de livraison</td>
                      </tr>
                      <tr>
                        <td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#2C1A0E;">${ligneAdresse}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="border-top:1px solid #efe6d4;padding:14px 18px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#2C1A0E;padding:4px 0;">Sous-total TTC</td>
                        <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#2C1A0E;padding:4px 0;">${sousTotal}</td>
                      </tr>
                      <tr>
                        <td style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#2C1A0E;padding:4px 0;">Livraison</td>
                        <td align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#2C1A0E;padding:4px 0;">${livraison}</td>
                      </tr>
                      ${remise}
                      <tr>
                        <td colspan="2" style="padding-top:10px;border-top:2px solid #C2610F;">
                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                            <tr>
                              <td style="font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;color:#2C1A0E;padding-top:8px;">Total TTC</td>
                              <td align="right" style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:700;color:#C2610F;padding-top:8px;">${totalTtc}</td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
${virementBloc}
          <tr>
            <td align="center" style="background-color:#FAF3E0;padding:8px 24px 28px 24px;border-left:1px solid #e8dcc4;border-right:1px solid #e8dcc4;border-radius:0 0 12px 12px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  <td align="center" style="border-radius:999px;background-color:#C2610F;">
                    <a href="${suiviUrl}" target="_blank" style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;display:inline-block;padding:14px 32px;border-radius:999px;">Suivre ma commande</a>
                  </td>
                </tr>
              </table>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-top:16px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#2C1A0E;opacity:0.65;">
                    Une question ? Répondez à cet e-mail ou visitez notre centre d’aide.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:20px 16px 32px 16px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  <td style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#2C1A0E;opacity:0.7;">
                    <a href="${FRONTEND}/help" style="color:#C2610F;text-decoration:underline;">Centre d’aide</a>
                    <span style="color:#c4b8a8;">&nbsp;·&nbsp;</span>
                    <a href="${FRONTEND}/terms" style="color:#C2610F;text-decoration:underline;">Conditions générales</a>
                    <span style="color:#c4b8a8;">&nbsp;·&nbsp;</span>
                    <a href="${FRONTEND}/compte/notifications${emailQuery}" style="color:#C2610F;text-decoration:underline;">Se désabonner</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:14px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:1.5;color:#2C1A0E;opacity:0.5;">
                    © ${new Date().getFullYear()} Afro-food — Marketplace de nourriture africaine
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// Email de changement de statut de commande
export const orderStatusEmail = (commande, nouveauStatut, client) => {
  const statutsMessages = {
    confirmee: 'Votre commande a été confirmée et va être préparée.',
    en_preparation: 'Nos cuisiniers préparent votre commande avec soin !',
    prete: 'Votre commande est prête ! Elle part bientôt vers vous.',
    en_livraison: 'Votre commande est en route ! Livraison dans quelques instants.',
    livree: 'Votre commande a été livrée. Bon appétit !',
    annulee: 'Votre commande a été annulée. Nous nous excusons pour ce désagrément.',
    remboursee: 'Votre commande a été remboursée.',
  };
  const message = statutsMessages[nouveauStatut] || 'Le statut de votre commande a été mis à jour.';
  const libelle = escapeHtml(String(nouveauStatut).replace(/_/g, ' '));
  const prenom = escapeHtml(client?.prenom || commande?.informationsClient?.prenom || '');
  const numero = escapeHtml(commande.numeroCommande || '');
  const id = String(commande._id || commande.id || '');
  const suiviUrl = `${FRONTEND}/commande/${encodeURIComponent(id)}`;
  const note = client?.commentaire
    ? `<p style="font-style:italic;">« ${escapeHtml(client.commentaire)} »</p>`
    : '';

  const content = `
    <h2>Mise à jour de votre commande</h2>
    <p>Bonjour${prenom ? ` ${prenom}` : ''},</p>
    <p>Votre commande <strong>${numero}</strong> a changé de statut.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0;">
      <tr>
        <td style="background-color:#F4EBDD;border-left:5px solid #C2610F;border-radius:12px;padding:18px 22px;">
          <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8A7664;">Nouveau statut</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:#C2610F;text-transform:capitalize;margin:4px 0 8px;">${libelle}</div>
          <div style="color:#2C1A0E;">${message}</div>
        </td>
      </tr>
    </table>
    ${note}
    <p style="text-align:center;margin:28px 0 8px;"><a href="${suiviUrl}" class="button" style="display:inline-block;background-color:#C2610F;color:#FFFFFF;padding:14px 32px;text-decoration:none;border-radius:999px;font-weight:700;">Suivre ma commande</a></p>
    ${
      nouveauStatut === 'livree'
        ? `<p style="background-color:#E8F3E8;border-radius:12px;padding:16px 18px;margin-top:22px;"><strong>Votre avis compte !</strong><br />Dites-nous ce que vous avez pensé de vos plats depuis la page de votre commande.</p>`
        : ''
    }
  `;
  return baseTemplate(content, 'Mise à jour de commande - Afro-food');
};

// Email de reset de mot de passe
export const passwordResetEmail = (nom, prenom, resetToken) => {
  const resetUrl = `${FRONTEND}/mot-de-passe-oublie?token=${encodeURIComponent(resetToken)}`;
  const identite = escapeHtml([prenom, nom].filter(Boolean).join(' '));

  const content = `
    <h2>Réinitialisation de votre mot de passe</h2>
    <p>Bonjour${identite ? ` ${identite}` : ''},</p>
    <p>Vous avez demandé à réinitialiser le mot de passe de votre compte Afro-food. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.</p>
    <p style="text-align:center;margin:30px 0;"><a href="${resetUrl}" class="button" style="display:inline-block;background-color:#C2610F;color:#FFFFFF;padding:14px 32px;text-decoration:none;border-radius:999px;font-weight:700;">Choisir un nouveau mot de passe</a></p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 18px;">
      <tr><td style="background-color:#F4EBDD;border-radius:12px;padding:14px 18px;color:#2C1A0E;"><strong>Ce lien est valable 1 heure.</strong> Passé ce délai, refaites une demande depuis la page de connexion.</td></tr>
    </table>
    <p>Vous n'êtes pas à l'origine de cette demande ? Ignorez simplement cet e-mail : votre mot de passe reste inchangé.</p>
    <p style="font-size:12.5px;color:#8A7664;word-break:break-all;">Le bouton ne fonctionne pas ? Copiez ce lien dans votre navigateur :<br />${resetUrl}</p>
  `;
  return baseTemplate(content, 'Réinitialisation de mot de passe - Afro-food');
};

// Email de vérification d'email
export const emailVerificationEmail = (nom, prenom, verificationToken) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  
  const content = `
    <h2>Vérification de votre email</h2>
    <p>Bonjour ${prenom} ${nom},</p>
    <p>Merci de vous être inscrit sur Afro-food !</p>
    <p>Pour finaliser votre inscription et sécuriser votre compte, veuillez vérifier votre adresse email :</p>
    
    <p>
        <a href="${verificationUrl}" class="button">Vérifier mon email</a>
    </p>
    
    <p><strong>Ce lien est valide pendant 24 heures.</strong></p>
    
    <p style="font-size: 14px; color: #666;">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
        ${verificationUrl}
    </p>
  `;
  
  return baseTemplate(content, 'Vérification email - Afro-food');
};

// Email de newsletter/promotional
export const promotionalEmail = (nom, prenom, titre, contenu, codePromo = null) => {
  const promoSection = codePromo ? `
    <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
        <h3 style="margin-top: 0;">🎉 Offre exclusive !</h3>
        <p style="font-size: 18px; margin: 10px 0;">Code promo : <strong>${codePromo}</strong></p>
        <p style="margin-bottom: 0;">Valable jusqu'à la fin du mois</p>
    </div>
  ` : '';
  
  const content = `
    <h2>${titre}</h2>
    <p>Bonjour ${prenom},</p>
    
    ${contenu}
    
    ${promoSection}
    
    <p>
        <a href="${process.env.FRONTEND_URL}/menu" class="button">Commander maintenant</a>
    </p>
    
    <p style="font-size: 14px; color: #666;">
        Vous recevez cet email car vous êtes abonné à notre newsletter. 
        <a href="${process.env.FRONTEND_URL}/unsubscribe" style="color: #666;">Se désabonner</a>
    </p>
  `;
  
  return baseTemplate(content, titre + ' - Afro-food');
};

/** SVG colis / camion inline (compatible clients mail, pas de GIF requis) */
const ILLUSTRATION_COLIS_SVG = `<svg width="200" height="120" viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Colis en livraison" style="display:block;max-width:100%;height:auto;">
<rect width="200" height="120" fill="#FFF7EA"/>
<rect x="28" y="48" width="96" height="56" rx="6" fill="#C2610F" opacity="0.92"/>
<rect x="36" y="56" width="36" height="14" rx="2" fill="#FAF3E0" opacity="0.95"/>
<path d="M124 72h48l12 20v12h-60V72z" fill="#2C1A0E"/>
<circle cx="56" cy="108" r="10" fill="#2C1A0E"/>
<circle cx="132" cy="108" r="10" fill="#2C1A0E"/>
<rect x="148" y="56" width="24" height="8" rx="2" fill="#8B3A2A"/>
<path d="M40 40 L100 40 L96 48 L44 48 Z" fill="#8B3A2A" opacity="0.85"/>
</svg>`;

function buildRecapCondense(articles, maxLines = 3) {
  const list = Array.isArray(articles) ? articles : [];
  if (list.length === 0) {
    return '<span style="color:#2C1A0E;opacity:0.65;">—</span>';
  }
  const lines = list.slice(0, maxLines).map((a) => {
    const nom = escapeHtml(a.informationsPlat?.nom || 'Article');
    const q = Number(a.quantite) || 0;
    return `· ${nom} × ${q}`;
  });
  const rest = list.length > maxLines ? list.length - maxLines : 0;
  const restHtml =
    rest > 0
      ? `<br /><span style="color:#2C1A0E;opacity:0.65;">+ ${rest} autre${rest > 1 ? 's' : ''} article${rest > 1 ? 's' : ''}</span>`
      : '';
  return lines.join('<br />') + restHtml;
}

/**
 * E-mail Expédition — commande en route (HTML inline).
 * Template statique : backend/templates/emails/expedition.html
 *
 * @param {object} expedition - { numeroSuivi, lienSuivi?, transporteur, dateLivraisonEstimee (texte affiché), imageColisUrl? }
 */
export const expeditionEmail = (commande, client, expedition = {}) => {
  const prenom = escapeHtml(client?.prenom || commande?.informationsClient?.prenom || '');
  const numero = escapeHtml(commande.numeroCommande || '');
  const idCmd = String(commande._id || '');
  const numeroSuivi = escapeHtml(expedition.numeroSuivi || '');
  const transporteur = escapeHtml(expedition.transporteur || 'Transporteur');
  const dateEst = escapeHtml(
    expedition.dateLivraisonEstimee ||
      (commande.dateLivraisonEstimee
        ? new Date(commande.dateLivraisonEstimee).toLocaleString('fr-FR', {
            dateStyle: 'full',
            timeStyle: 'short',
          })
        : 'Sous 24 à 48 h')
  );

  const lienSuivi = expedition.lienSuivi || expedition.urlTransporteur || `${FRONTEND}/commandes/${idCmd}`;
  const ctaUrl = expedition.urlSuiviColis || `${FRONTEND}/commandes/${idCmd}`;
  const logoUrl = `${FRONTEND}/logo-afro-eats.png`;

  const recap = buildRecapCondense(commande.articles);

  const blocIllustration = expedition.imageColisUrl
    ? `<img src="${escapeHtml(expedition.imageColisUrl)}" width="200" alt="" style="display:block;max-width:100%;height:auto;border-radius:12px;" />`
    : ILLUSTRATION_COLIS_SVG;

  const emailQuery = client?.email
    ? `?unsubscribe=1&email=${encodeURIComponent(client.email)}`
    : '?unsubscribe=1';

  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Votre commande est en route — Afro-food</title>
</head>
<body style="margin:0;padding:0;width:100%;background-color:#FAF3E0;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
  <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    Colis expédié — commande ${numero}
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#FAF3E0;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;width:100%;background-color:#FAF3E0;border-radius:12px;overflow:hidden;">
          <tr>
            <td align="center" style="background-color:#2C1A0E;padding:26px 24px 22px 24px;border-radius:12px 12px 0 0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding-bottom:14px;">
                    <img src="${logoUrl}" width="52" height="52" alt="Afro-food" style="display:block;border:0;width:52px;height:52px;border-radius:12px;background-color:#FAF3E0;padding:4px;" />
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family:Georgia,'Times New Roman',serif;font-size:25px;line-height:1.2;font-weight:700;color:#FAF3E0;padding:0 8px;">
                    Votre commande est en route !
                  </td>
                </tr>
                <tr>
                  <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.45;color:#FAF3E0;padding:10px 8px 0 8px;opacity:0.88;">
                    Votre colis a quitté nos partenaires — suivez-le en temps réel.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="background-color:#FAF3E0;padding:24px 20px 8px 20px;border-left:1px solid #e8dcc4;border-right:1px solid #e8dcc4;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;background-color:#ffffff;border-radius:16px;border:1px solid #e8dcc4;">
                <tr>
                  <td align="center" style="padding:20px 24px;">${blocIllustration}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#FAF3E0;padding:12px 24px 8px 24px;border-left:1px solid #e8dcc4;border-right:1px solid #e8dcc4;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#ffffff;border-radius:10px;border:1px solid #e8dcc4;">
                <tr>
                  <td style="padding:16px 18px;">
                    <p style="margin:0 0 10px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.55;color:#2C1A0E;">
                      Bonjour <strong style="color:#2C1A0E;">${prenom}</strong>,
                    </p>
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#2C1A0E;opacity:0.88;">
                      La commande <strong style="color:#C2610F;">#${numero}</strong> est en cours d’acheminement.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="border-top:1px solid #efe6d4;padding:14px 18px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td style="font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#C2610F;padding-bottom:6px;">Numéro de suivi</td>
                      </tr>
                      <tr>
                        <td style="font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:700;">
                          <a href="${escapeHtml(lienSuivi)}" style="color:#C2610F;text-decoration:underline;">${numeroSuivi || '—'}</a>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding-top:14px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#C2610F;padding-bottom:4px;">Transporteur</td>
                      </tr>
                      <tr>
                        <td style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#2C1A0E;">${transporteur}</td>
                      </tr>
                      <tr>
                        <td style="padding-top:14px;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#C2610F;padding-bottom:4px;">Livraison estimée</td>
                      </tr>
                      <tr>
                        <td style="font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:700;color:#2C1A0E;">${dateEst}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#FAF3E0;padding:8px 24px 8px 24px;border-left:1px solid #e8dcc4;border-right:1px solid #e8dcc4;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#ffffff;border-radius:10px;border:1px solid #e8dcc4;">
                <tr>
                  <td style="padding:12px 16px;background-color:#2C1A0E;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;color:#FAF3E0;">
                    Contenu (aperçu)
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 16px 14px 16px;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.65;color:#2C1A0E;">
                    ${recap}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="background-color:#FAF3E0;padding:16px 24px 12px 24px;border-left:1px solid #e8dcc4;border-right:1px solid #e8dcc4;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
                <tr>
                  <td align="center" style="border-radius:999px;background-color:#C2610F;">
                    <a href="${escapeHtml(ctaUrl)}" target="_blank" style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;display:inline-block;padding:14px 28px;border-radius:999px;">Suivre le colis</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background-color:#FAF3E0;padding:8px 24px 16px 24px;border-left:1px solid #e8dcc4;border-right:1px solid #e8dcc4;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#FFF7EA;border-radius:10px;border:1px solid #e8dcc4;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0 0 8px 0;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-weight:700;color:#2C1A0E;">Conseils à la réception</p>
                    <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.6;color:#2C1A0E;opacity:0.9;">
                      Vérifiez l’état du colis avant signature. Pour les produits frais ou réfrigérés, placez-les rapidement au frais. En cas d’anomalie, contactez-nous sous 48&nbsp;h avec photos.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="background-color:#FAF3E0;padding:8px 24px 24px 24px;border-left:1px solid #e8dcc4;border-right:1px solid #e8dcc4;border-radius:0 0 12px 12px;">
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55;color:#2C1A0E;">
                Une question sur la livraison ?<br />
                <a href="${FRONTEND}/contact" style="color:#C2610F;font-weight:700;text-decoration:underline;">Service client</a>
                <span style="color:#2C1A0E;opacity:0.5;"> · </span>
                <a href="${FRONTEND}/help" style="color:#C2610F;font-weight:600;text-decoration:underline;">Centre d’aide</a>
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:18px 16px 28px 16px;">
              <p style="margin:0 0 10px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#2C1A0E;opacity:0.7;">
                <a href="${FRONTEND}/compte/notifications${emailQuery}" style="color:#C2610F;text-decoration:underline;">Se désabonner</a>
                <span style="color:#c4b8a8;"> · </span>
                <a href="${FRONTEND}/terms" style="color:#C2610F;text-decoration:underline;">CGV</a>
              </p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#2C1A0E;opacity:0.45;">
                © ${new Date().getFullYear()} Afro-food — Marketplace de nourriture africaine
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const PLACEHOLDER_AVIS_IMAGE =
  'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=240&q=80';

/**
 * Demande d’avis sur un produit — HTML inline (ivoire / ocre / bois).
 * Aperçu statique : backend/templates/emails/demande-avis-produit.html
 *
 * Les étoiles pointent vers `reviewPageUrl` avec `?note=1` … `?note=5` (ou `&` si l’URL contient déjà une query).
 *
 * @param {object} options
 * @param {string} options.prenom
 * @param {string} options.nomProduit
 * @param {string} [options.imageProduit]
 * @param {string} options.reviewPageUrl — URL de la page « laisser un avis » (CTA + étoiles)
 * @param {string} [options.vendeurMessage] — court message de remerciement (ton authentique). `vendeurNom` ignoré (rétrocompat).
 * @param {string} [options.clientEmail] — pour lien désabonnement notifications
 */
export const productReviewRequestEmail = (options = {}) => {
  const prenom = escapeHtml(options.prenom || '');
  const nomProduit = escapeHtml(options.nomProduit || 'Produit');
  const imageProduit = escapeHtml(options.imageProduit || PLACEHOLDER_AVIS_IMAGE);
  const remerciMessage = escapeHtml(
    options.vendeurMessage ||
      options.remerciMessage ||
      'Merci d’avoir goûté à ce plat. Votre retour nous aide à garder la même exigence — et si quelque chose n’était pas comme vous l’imaginiez, écrivez-nous : on préfère toujours savoir.'
  );

  const base = String(options.reviewPageUrl || `${FRONTEND}/avis`).trim();
  const starHref = (n) => {
    const sep = base.includes('?') ? '&' : '?';
    return `${base}${sep}note=${n}`;
  };

  const logoUrl = `${FRONTEND}/logo-afro-eats.png`;
  const preheader = escapeHtml(
    `Une minute pour noter ${options.nomProduit || 'votre plat'} — merci pour votre sincérité.`
  );

  const emailQuery = options.clientEmail
    ? `?unsubscribe=1&email=${encodeURIComponent(options.clientEmail)}`
    : '?unsubscribe=1';

  const stars = [1, 2, 3, 4, 5]
    .map(
      (n) => `<td style="padding:0 4px;"><a href="${escapeHtml(starHref(n))}" style="display:inline-block;text-decoration:none;color:#C2610F;font-size:34px;line-height:1;" title="${n} étoile${n > 1 ? 's' : ''}" aria-label="Noter ${n} sur 5">★</a></td>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Votre avis compte — Afro-food</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF3E0;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${preheader}
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#FAF3E0;">
    <tr>
      <td align="center" style="padding:0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;background-color:#FAF3E0;">
          <tr>
            <td style="padding:0;background-color:#2C1A0E;">
              <svg xmlns="http://www.w3.org/2000/svg" width="600" height="72" viewBox="0 0 600 72" preserveAspectRatio="xMidYMid slice" style="display:block;width:100%;max-width:600px;height:auto;">
                <defs>
                  <pattern id="reviewKenteEmail" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M0 12h24M12 0v24" stroke="#C2610F" stroke-width="1.2" opacity="0.35"/>
                    <path d="M0 0l24 24M24 0L0 24" stroke="#FAF3E0" stroke-width="0.8" opacity="0.12"/>
                    <rect x="0" y="0" width="24" height="24" fill="none" stroke="#C2610F" stroke-width="0.5" opacity="0.2"/>
                  </pattern>
                </defs>
                <rect width="600" height="72" fill="#2C1A0E"/>
                <rect width="600" height="72" fill="url(#reviewKenteEmail)"/>
              </svg>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding:8px 20px 22px 20px;">
                    <img src="${logoUrl}" width="52" height="52" alt="Afro-food" style="display:block;border:0;border-radius:12px;background-color:#FAF3E0;padding:4px;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:26px 24px 10px 24px;background-color:#FAF3E0;">
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2;font-weight:700;color:#2C1A0E;text-align:center;">
                Votre avis compte !
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 24px 18px 24px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.65;color:#2C1A0E;background-color:#FAF3E0;">
              <p style="margin:0 0 14px 0;">Bonjour <strong style="color:#2C1A0E;">${prenom}</strong>,</p>
              <p style="margin:0;">
                Vous avez goûté à un plat préparé avec soin — un petit mot de votre part, ce serait précieux pour le cuisinier et pour les prochains curieux du marché. Rien d’obligatoire : juste votre sincérité.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 20px 16px 20px;background-color:#FAF3E0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#ffffff;border:1px solid #e8dcc4;border-radius:14px;overflow:hidden;">
                <tr>
                  <td width="120" valign="middle" style="padding:0;width:120px;background-color:#f5efe3;">
                    <img src="${imageProduit}" width="120" height="120" alt="" style="display:block;width:120px;height:120px;object-fit:cover;border:0;" />
                  </td>
                  <td valign="middle" style="padding:16px 18px;font-family:Georgia,serif;font-size:18px;font-weight:700;color:#2C1A0E;line-height:1.35;">
                    ${nomProduit}
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:6px 20px 8px 20px;background-color:#FAF3E0;">
              <p style="margin:0 0 10px 0;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#2C1A0E;opacity:0.85;">En un clic, donnez une première note :</p>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center">
                <tr>
                  ${stars}
                </tr>
              </table>
              <p style="margin:10px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#2C1A0E;opacity:0.55;">Chaque étoile ouvre la page avis avec cette note déjà sélectionnée.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:12px 24px 8px 24px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#2C1A0E;background-color:#FAF3E0;">
              <p style="margin:0;">
                Que ce soit une étoile ou cinq, ce qui compte pour nous, c’est votre vécu : le goût, la portion, l’emballage… Les détails font la différence entre une bonne adresse et une adresse qu’on garde.
              </p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:16px 24px 24px 24px;background-color:#FAF3E0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="border-radius:999px;background-color:#C2610F;">
                    <a href="${escapeHtml(base)}" style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;color:#ffffff;text-decoration:none;display:inline-block;padding:14px 32px;border-radius:999px;">Laisser un avis complet</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 20px 24px 20px;background-color:#FAF3E0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f0e6d4;border-left:4px solid #C2610F;border-radius:0 12px 12px 0;">
                <tr>
                  <td style="padding:18px 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#2C1A0E;">
                    <p style="margin:0 0 8px 0;font-family:Georgia,serif;font-size:16px;font-weight:700;color:#2C1A0E;">Un petit mot pour vous</p>
                    <p style="margin:0;">${remerciMessage}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:18px 16px 28px 16px;border-top:1px solid #e8dcc4;background-color:#FAF3E0;">
              <p style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#2C1A0E;opacity:0.75;">
                <a href="${FRONTEND}/contact" style="color:#C2610F;text-decoration:underline;">Une question ?</a>
                <span style="color:#c4b8a8;"> · </span>
                <a href="${FRONTEND}/help" style="color:#C2610F;text-decoration:underline;">Aide</a>
              </p>
              <p style="margin:0 0 10px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#2C1A0E;opacity:0.7;">
                <a href="${FRONTEND}/compte/notifications${emailQuery}" style="color:#C2610F;text-decoration:underline;">Gérer les e-mails de suivi</a>
              </p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#2C1A0E;opacity:0.45;">© ${new Date().getFullYear()} Afro-food — Saveurs authentiques, qualité avant tout</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

const BRICK = '#A0522D';

/** Message stock doux selon la quantité restante (optionnel). */
function stockHintFr(stockRestant) {
  if (stockRestant == null || Number.isNaN(Number(stockRestant))) {
    return 'Encore disponible — parfait pour reprendre tranquillement.';
  }
  const s = Number(stockRestant);
  if (s <= 0) return 'Revenez vite : ce produit part parfois vite des étals.';
  if (s <= 3) {
    return 'Il reste peu de portions aujourd’hui — sans vous presser, juste pour info.';
  }
  if (s <= 12) {
    return 'Stock limité : d’autres curieux regardent aussi ce plat.';
  }
  return 'Stock confortable — vous pouvez prendre votre temps.';
}

/**
 * Relance panier abandonné — HTML inline (ivoire / bois / ocre / brique).
 * Aperçu statique : backend/templates/emails/relance-panier-abandonne.html
 *
 * @param {object} options
 * @param {string} options.prenom
 * @param {Array<{ nom: string, image?: string, prix: number, quantite?: number, stockRestant?: number, stockMessage?: string }>} options.articles
 * @param {string} [options.cartUrl] — URL du panier (défaut : FRONTEND/panier)
 * @param {string} [options.clientEmail] — pour lien désabonnement rappels panier
 */
export const abandonedCartEmail = (options = {}) => {
  const prenom = escapeHtml(options.prenom || '');
  const cartUrl = String(options.cartUrl || `${FRONTEND}/panier`).trim();
  const placeholderImg =
    'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80';

  const rawArticles = Array.isArray(options.articles) ? options.articles : [];
  const MAX = 6;
  const display = rawArticles.slice(0, MAX);
  const restCount = Math.max(0, rawArticles.length - MAX);

  const emailQuery = options.clientEmail
    ? `?unsubscribe=cart&email=${encodeURIComponent(options.clientEmail)}`
    : '?unsubscribe=cart';

  const logoUrl = `${FRONTEND}/logo-afro-eats.png`;

  const preheader = escapeHtml(
    `Votre sélection vous attend — reprenez où vous en étiez, sans pression.`
  );

  const productCard = (a) => {
    const nom = escapeHtml(a.nom || 'Produit');
    const img = escapeHtml(a.image || placeholderImg);
    const qty = Number(a.quantite) > 1 ? Number(a.quantite) : 1;
    const lignePrix = formatMoneyEUR(Number(a.prix) * qty);
    const stockText = escapeHtml(
      a.stockMessage != null && String(a.stockMessage).trim() !== ''
        ? String(a.stockMessage)
        : stockHintFr(a.stockRestant)
    );
    return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#ffffff;border:1px solid #e8dcc4;border-radius:12px;overflow:hidden;">
                <tr>
                  <td style="padding:0;background-color:#f5efe3;">
                    <img src="${img}" width="260" alt="" style="display:block;width:100%;max-width:260px;height:auto;border:0;" />
                  </td>
                </tr>
                <tr>
                  <td style="padding:12px 12px 6px 12px;font-family:Georgia,serif;font-size:15px;font-weight:700;color:#2C1A0E;line-height:1.3;">
                    ${nom}${qty > 1 ? ` <span style="font-weight:600;opacity:0.75;">×&nbsp;${qty}</span>` : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 12px 4px 12px;font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;color:#C2610F;">
                    ${lignePrix}
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 12px 14px 12px;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.45;color:${BRICK};">
                    ${stockText}
                  </td>
                </tr>
              </table>`;
  };

  const rows = [];
  if (display.length === 0) {
    rows.push(`<tr>
                  <td colspan="2" style="padding:16px 20px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#2C1A0E;">
                    Reprenez depuis le catalogue : votre panier était peut-être vide ou a expiré.
                  </td>
                </tr>`);
  }
  for (let i = 0; i < display.length; i += 2) {
    const left = display[i];
    const right = display[i + 1];
    const cellRight = right
      ? `<td width="50%" valign="top" style="padding:8px;">${productCard(right)}</td>`
      : `<td width="50%" valign="top" style="padding:8px;">&nbsp;</td>`;
    rows.push(`<tr>
                  <td width="50%" valign="top" style="padding:8px;">${productCard(left)}</td>
                  ${cellRight}
                </tr>`);
  }
  const gridHtml = rows.join('');

  const moreLine =
    restCount > 0
      ? `<tr>
            <td style="padding:0 22px 14px 22px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#2C1A0E;text-align:center;opacity:0.85;">
              + ${restCount} autre${restCount > 1 ? 's' : ''} article${restCount > 1 ? 's' : ''} dans votre panier
            </td>
          </tr>`
      : '';

  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Votre panier vous attend — Afro-food</title>
</head>
<body style="margin:0;padding:0;background-color:#FAF3E0;-webkit-text-size-adjust:100%;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${preheader}
  </div>
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#FAF3E0;">
    <tr>
      <td align="center" style="padding:0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:600px;background-color:#FAF3E0;">
          <tr>
            <td style="padding:0;background-color:#2C1A0E;">
              <svg xmlns="http://www.w3.org/2000/svg" width="600" height="76" viewBox="0 0 600 76" preserveAspectRatio="xMidYMid slice" style="display:block;width:100%;max-width:600px;height:auto;">
                <defs>
                  <pattern id="abandonedCartKenteEmail" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
                    <path d="M0 12h24M12 0v24" stroke="#C2610F" stroke-width="1.2" opacity="0.35"/>
                    <path d="M0 0l24 24M24 0L0 24" stroke="#A0522D" stroke-width="0.7" opacity="0.22"/>
                    <path d="M0 0l24 24M24 0L0 24" stroke="#FAF3E0" stroke-width="0.8" opacity="0.1"/>
                    <rect x="0" y="0" width="24" height="24" fill="none" stroke="#C2610F" stroke-width="0.5" opacity="0.2"/>
                  </pattern>
                </defs>
                <rect width="600" height="76" fill="#2C1A0E"/>
                <rect width="600" height="76" fill="url(#abandonedCartKenteEmail)"/>
              </svg>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                <tr>
                  <td align="center" style="padding:8px 20px 24px 20px;">
                    <img src="${logoUrl}" width="52" height="52" alt="Afro-food" style="display:block;border:0;border-radius:12px;background-color:#FAF3E0;padding:4px;" />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:26px 22px 8px 22px;background-color:#FAF3E0;">
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:25px;line-height:1.25;font-weight:700;color:#2C1A0E;text-align:center;">
                Vous avez oublié quelque chose ?
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding:10px 22px 18px 22px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:1.65;color:#2C1A0E;background-color:#FAF3E0;">
              <p style="margin:0 0 12px 0;">Bonjour <strong style="color:#2C1A0E;">${prenom}</strong>,</p>
              <p style="margin:0;">
                Pas de stress : votre panier est resté tel quel, au chaud de notre côté. Si l’envie vous reprend, il suffit d’un clic — on vous laisse reprendre à votre rythme, sans blabla commercial.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:6px 14px 6px 14px;background-color:#FAF3E0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                ${gridHtml}
              </table>
            </td>
          </tr>
          ${moreLine}
          <tr>
            <td align="center" style="padding:12px 20px 22px 20px;background-color:#FAF3E0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center" style="border-radius:10px;background-color:#C2610F;border:2px solid #A0522D;">
                    <a href="${escapeHtml(cartUrl)}" style="font-family:Arial,Helvetica,sans-serif;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;display:inline-block;padding:16px 40px;border-radius:8px;">Reprendre mon panier</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 18px 22px 18px;background-color:#FAF3E0;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f7efe4;border:1px solid #e4d4bc;border-radius:14px;">
                <tr>
                  <td style="padding:18px 16px 8px 16px;font-family:Georgia,serif;font-size:15px;font-weight:700;color:#2C1A0E;text-align:center;">
                    On veut que vous commandiez l’esprit tranquille
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 8px 18px 8px;">
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                      <tr>
                        <td width="33%" valign="top" style="padding:10px 6px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#2C1A0E;">
                          <span style="font-size:22px;line-height:1;display:block;margin-bottom:6px;" aria-hidden="true">🚚</span>
                          <strong style="color:#C2610F;display:block;margin-bottom:4px;">Livraison</strong>
                          Suivie, créneaux clairs, partout où nous livrons.
                        </td>
                        <td width="33%" valign="top" style="padding:10px 6px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#2C1A0E;border-left:1px solid #e8dcc4;border-right:1px solid #e8dcc4;">
                          <span style="font-size:22px;line-height:1;display:block;margin-bottom:6px;" aria-hidden="true">🔄</span>
                          <strong style="color:#A0522D;display:block;margin-bottom:4px;">Retours</strong>
                          Un souci ? Notre équipe vous répond, simplement et sans jargon.
                        </td>
                        <td width="33%" valign="top" style="padding:10px 6px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.5;color:#2C1A0E;">
                          <span style="font-size:22px;line-height:1;display:block;margin-bottom:6px;" aria-hidden="true">🔒</span>
                          <strong style="color:#C2610F;display:block;margin-bottom:4px;">Paiement</strong>
                          Sécurisé : vos données sont chiffrées, comme il se doit.
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 22px 24px 22px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.6;color:#2C1A0E;opacity:0.88;background-color:#FAF3E0;text-align:center;">
              <p style="margin:0;">Si ce n’était pas le bon moment, aucun souci — ce message est juste un petit rappel amical.</p>
            </td>
          </tr>
          <tr>
            <td align="center" style="padding:18px 16px 28px 16px;border-top:1px solid #e8dcc4;background-color:#FAF3E0;">
              <p style="margin:0 0 10px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#2C1A0E;opacity:0.75;">
                <a href="${escapeHtml(options.unsubscribeUrl || `${FRONTEND}/compte/notifications${emailQuery}`)}" style="color:#A0522D;text-decoration:underline;">Ne plus recevoir ces rappels de panier</a>
              </p>
              <p style="margin:0 0 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#2C1A0E;opacity:0.65;">
                <a href="${FRONTEND}/contact" style="color:#C2610F;text-decoration:underline;">Nous écrire</a>
                <span style="color:#c4b8a8;"> · </span>
                <a href="${FRONTEND}/help" style="color:#C2610F;text-decoration:underline;">Aide</a>
              </p>
              <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#2C1A0E;opacity:0.42;">© ${new Date().getFullYear()} Afro-food</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};


// Email de remerciement après livraison, avec notation en un clic (1 à 5 étoiles)
export const thankYouEmail = (commande, client) => {
  const prenom = escapeHtml(client?.prenom || commande?.informationsClient?.prenom || '');
  const numero = escapeHtml(commande.numeroCommande || '');
  const id = encodeURIComponent(String(commande._id || commande.id || ''));
  const base = `${FRONTEND}/commande/${id}`;
  const etoiles = [1, 2, 3, 4, 5]
    .map(
      (n) =>
        `<a href="${base}?noter=${n}&utm_source=email&utm_medium=merci" style="display:inline-block;text-decoration:none;font-size:38px;line-height:1;color:#E9A23B;padding:0 3px;" title="${n} étoile${n > 1 ? 's' : ''}">★</a>`
    )
    .join('');

  const content = `
    <h2>Merci${prenom ? ` ${prenom}` : ''} !</h2>
    <p>Votre commande <strong>${numero}</strong> vient d'être livrée. Toute l'équipe Afro-food vous remercie pour votre confiance : nous espérons que vous vous êtes régalé·e.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:26px 0;">
      <tr>
        <td align="center" style="background-color:#F4EBDD;border-radius:16px;padding:24px 16px;">
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:700;color:#2C1A0E;margin-bottom:6px;">Comment était votre commande ?</div>
          <div style="font-size:13px;color:#8A7664;margin-bottom:14px;">Touchez une étoile pour nous noter, cela prend 5 secondes.</div>
          <div>${etoiles}</div>
        </td>
      </tr>
    </table>
    <p style="text-align:center;margin:8px 0 0;"><a href="${base}?noter=5&utm_source=email&utm_medium=merci" class="button" style="display:inline-block;background-color:#C2610F;color:#FFFFFF;padding:14px 32px;text-decoration:none;border-radius:999px;font-weight:700;">Donner mon avis</a></p>
    <p style="margin-top:22px;font-size:13px;color:#8A7664;">Votre avis aide les autres clients et nous permet de nous améliorer.</p>
  `;
  return baseTemplate(content, 'Merci pour votre commande - Afro-food');
};

// Email annonçant le code promo offert après une commande de plus de 30 €
export const promoRewardEmail = (client, promo, commande) => {
  const prenom = escapeHtml(client?.prenom || commande?.informationsClient?.prenom || '');
  const code = escapeHtml(promo.code);
  const numero = escapeHtml(commande?.numeroCommande || '');
  const fin = promo.dateFin
    ? new Date(promo.dateFin).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';
  const utilisations = promo.utilisationsMax || null;

  const content = `
    <h2>Un cadeau pour vous${prenom ? `, ${prenom}` : ''} 🎁</h2>
    <p>Merci pour votre commande <strong>${numero}</strong> ! Pour vous remercier d'avoir commandé plus de 30&nbsp;€, nous vous offrons un code personnel :</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0;">
      <tr>
        <td align="center" style="background-color:#2C1A0E;border-radius:16px;padding:26px 16px;">
          <div style="font-size:12px;letter-spacing:3px;text-transform:uppercase;color:#E9B26B;">Votre code</div>
          <div style="font-family:'Courier New',monospace;font-size:30px;font-weight:700;letter-spacing:3px;color:#FFFDF8;margin:8px 0;">${code}</div>
          <div style="font-size:14px;color:#E9B26B;">−10&nbsp;% sur vos plats <strong style="color:#FFFDF8;">+ livraison offerte</strong></div>
        </td>
      </tr>
    </table>
    <ul style="padding-left:20px;margin:0 0 18px;">
      <li>Valable sur vos prochaines commandes${utilisations ? ` (${utilisations} utilisations maximum)` : ''}</li>
      ${fin ? `<li>Utilisable jusqu'au ${fin}</li>` : ''}
      <li>Code personnel : il fonctionne uniquement avec votre compte</li>
      <li>À saisir dans le champ « Code promo » du panier</li>
    </ul>
    <p style="text-align:center;margin:26px 0 8px;"><a href="${FRONTEND}/catalogue?utm_source=email&utm_medium=code_merci" class="button" style="display:inline-block;background-color:#C2610F;color:#FFFFFF;padding:14px 32px;text-decoration:none;border-radius:999px;font-weight:700;">Découvrir le menu</a></p>
  `;
  return baseTemplate(content, 'Votre code promo offert - Afro-food');
};

/**
 * E-mail admin « Nouvelle commande » — récapitulatif client, articles, adresse et total.
 * @param {object} commande
 * @param {string} lienAdmin — lien vers la gestion des commandes
 */
export const newOrderAdminEmail = (commande, lienAdmin) => {
  const info = commande.informationsClient || {};
  const client = escapeHtml([info.prenom, info.nom].filter(Boolean).join(' ') || 'Client');
  const numero = escapeHtml(commande.numeroCommande || '');
  const m = commande.montants || {};
  const total = formatMoneyEUR(m.total ?? commande.total);
  const dateCmd = new Date(commande.createdAt || Date.now()).toLocaleString('fr-FR', {
    dateStyle: 'long',
    timeStyle: 'short',
  });
  const lignes = (commande.articles || [])
    .map(
      (a) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #EFE6D4;font-size:14px;color:#2C1A0E;"><strong>${escapeHtml(a.informationsPlat?.nom || 'Produit')}</strong></td>
        <td align="center" style="padding:10px 8px;border-bottom:1px solid #EFE6D4;font-size:14px;color:#4A3426;white-space:nowrap;">×&nbsp;${Number(a.quantite) || 0}</td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid #EFE6D4;font-size:14px;font-weight:700;color:#C2610F;white-space:nowrap;">${formatMoneyEUR(a.sousTotal)}</td>
      </tr>`
    )
    .join('');
  const addr = commande.adresseLivraison || {};
  const adresse = [
    escapeHtml(addr.adresse),
    `${escapeHtml(addr.codePostal || '')} ${escapeHtml(addr.ville || '')}`.trim(),
  ]
    .filter(Boolean)
    .join('<br />');
  const contact = [info.telephone, info.email].filter(Boolean).map(escapeHtml).join(' · ');

  const content = `
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#C2610F;font-weight:700;">Nouvelle commande</p>
    <h2>Commande ${numero}</h2>
    <p style="color:#8A7664;font-size:13px;margin:0 0 20px;">${escapeHtml(dateCmd)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F4EBDD;border-radius:14px;margin:0 0 22px;">
      <tr><td style="padding:16px 18px;font-size:14px;line-height:1.6;color:#4A3426;">
        <strong>${client}</strong>${contact ? `<br />${contact}` : ''}${adresse ? `<br /><span style="color:#8A7664;">${adresse}</span>` : ''}
      </td></tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${lignes}</table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0 26px;">
      <tr>
        <td style="font-size:16px;font-weight:700;color:#2C1A0E;">Total</td>
        <td align="right" style="font-size:22px;font-weight:700;color:#C2610F;">${total}</td>
      </tr>
    </table>
    <p style="text-align:center;margin:0 0 8px;"><a href="${escapeHtml(lienAdmin)}" class="button" style="display:inline-block;background:#C2610F;color:#FFFFFF;padding:14px 32px;text-decoration:none;border-radius:999px;font-weight:700;font-size:15px;">Traiter la commande</a></p>
  `;
  return baseTemplate(content, `Nouvelle commande ${commande.numeroCommande || ''} - Afro-food`);
};

/** E-mail client : code de remise à donner au livreur pour un paiement en espèces. */
export const cashCodeEmail = (commande, code) => {
  const prenom = escapeHtml(commande?.informationsClient?.prenom || '');
  const total = formatMoneyEUR(commande?.total ?? commande?.montants?.total);
  const content = `
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#C2610F;font-weight:700;">Livraison en cours</p>
    <h2>${prenom ? `${prenom}, v` : 'V'}otre commande arrive</h2>
    <p>Vous réglez <strong>${total}</strong> en espèces au livreur. À sa remise, donnez-lui ce code pour confirmer la livraison :</p>
    <p style="text-align:center;margin:22px 0;"><span style="display:inline-block;background-color:#2C1A0E;color:#FFFDF8;font-family:'Courier New',monospace;font-size:38px;letter-spacing:12px;padding:14px 12px 14px 24px;border-radius:14px;font-weight:700;">${escapeHtml(code)}</span></p>
    <p style="font-size:13px;color:#8A7664;">Ne communiquez ce code qu'au moment de la remise de la commande, et uniquement au livreur qui vous la remet. Vous recevrez un reçu après paiement.</p>
  `;
  return baseTemplate(content, `Code de remise ${commande?.numeroCommande || ''} - Afro-food`);
};

/** E-mail client : reçu du paiement en espèces. */
export const cashReceiptEmail = (commande, montant, livreurPrenom) => {
  const numero = escapeHtml(commande?.numeroCommande || '');
  const content = `
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#C2610F;font-weight:700;">Reçu de paiement</p>
    <h2>Merci pour votre commande</h2>
    <p>Vous avez payé <strong>${formatMoneyEUR(montant)}</strong> en espèces${livreurPrenom ? ` à <strong>${escapeHtml(livreurPrenom)}</strong>` : ''} pour la commande <strong>${numero}</strong>, le ${escapeHtml(new Date().toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }))}.</p>
    <p style="font-size:13px;color:#8A7664;">Un doute sur ce paiement ? Répondez à ce message en indiquant le numéro de commande.</p>
  `;
  return baseTemplate(content, `Reçu commande ${commande?.numeroCommande || ''} - Afro-food`);
};

/** E-mail client : paiement Stripe d'un virement reçu, justificatif à envoyer. */
export const stripeVirementEmail = (commande) => {
  const idCmd = String(commande._id || commande.id || '');
  const lien = `${FRONTEND}/commande/${encodeURIComponent(idCmd)}`;
  const content = `
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#C2610F;font-weight:700;">Paiement enregistré</p>
    <h2>Merci, votre paiement est enregistré</h2>
    <p>Nous avons bien reçu votre paiement de <strong>${formatMoneyEUR(commande.total)}</strong> pour la commande <strong>${escapeHtml(commande.numeroCommande)}</strong>.</p>
    <p>Dernière étape : <strong>téléchargez votre justificatif de paiement</strong> depuis la page de votre commande, puis envoyez-le-nous. Dès que l'administration l'aura vérifié, votre commande sera préparée puis livrée.</p>
    <p style="text-align:center;margin:26px 0 8px;"><a href="${escapeHtml(lien)}" class="button" style="display:inline-block;background:#C2610F;color:#FFFFFF;padding:14px 32px;text-decoration:none;border-radius:999px;font-weight:700;font-size:15px;">Envoyer mon justificatif</a></p>
  `;
  return baseTemplate(content, `Paiement enregistré ${commande.numeroCommande || ''} - Afro-food`);
};

/** E-mail livreur : une commande est prête à être récupérée. */
export const orderReadyCourierEmail = (commande, lienLivreur) => {
  const info = commande.informationsClient || {};
  const client = escapeHtml([info.prenom, info.nom].filter(Boolean).join(' ') || 'Client');
  const numero = escapeHtml(commande.numeroCommande || '');
  const addr = commande.adresseLivraison || {};
  const adresse = [
    escapeHtml(addr.adresse),
    escapeHtml(addr.complementAdresse),
    `${escapeHtml(addr.codePostal || '')} ${escapeHtml(addr.ville || '')}`.trim(),
  ]
    .filter(Boolean)
    .join('<br />');
  const total = formatMoneyEUR(commande.total ?? commande.montants?.total);
  const articles = (commande.articles || [])
    .map(
      (a) =>
        `<tr><td style="padding:6px 0;font-size:14px;color:#2C1A0E;">${Number(a.quantite) || 0}&nbsp;×&nbsp;${escapeHtml(a.informationsPlat?.nom || 'Produit')}</td></tr>`
    )
    .join('');
  const aEncaisser =
    commande.methodePaiement === 'especes' && commande.statutPaiement !== 'valide'
      ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0;"><tr><td style="background-color:#FDECEC;border-left:5px solid #B3261E;border-radius:12px;padding:14px 18px;">
          <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#B3261E;font-weight:700;">À encaisser en espèces</div>
          <div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:700;color:#B3261E;">${total}</div>
          <div style="font-size:13px;color:#4A3426;">Demandez au client son code à 4 chiffres avant de valider la livraison.</div>
        </td></tr></table>`
      : '';
  const content = `
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#C2610F;font-weight:700;">Commande prête</p>
    <h2>À récupérer : ${numero}</h2>
    <p style="margin:0 0 18px;">Une commande vient d'être préparée. Prenez-la en charge depuis votre espace livreur.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#F4EBDD;border-radius:14px;margin:0 0 18px;">
      <tr><td style="padding:16px 18px;font-size:14px;line-height:1.6;color:#4A3426;">
        <strong>${client}</strong>${info.telephone ? ` · ${escapeHtml(info.telephone)}` : ''}${adresse ? `<br />${adresse}` : ''}
      </td></tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${articles}</table>
    ${aEncaisser}
    <p style="text-align:center;margin:24px 0 8px;"><a href="${escapeHtml(lienLivreur)}" class="button" style="display:inline-block;background:#C2610F;color:#FFFFFF;padding:14px 32px;text-decoration:none;border-radius:999px;font-weight:700;font-size:15px;">Prendre en charge</a></p>
  `;
  return baseTemplate(content, `Commande prête ${commande.numeroCommande || ''} - Afro-food`);
};

/** E-mail livreur : une fiche de rémunération est disponible. */
export const payslipEmail = (prenom, fiche) => {
  const lien = `${FRONTEND}/livreur`;
  const content = `
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#C2610F;font-weight:700;">Fiche de rémunération</p>
    <h2>${prenom ? `${escapeHtml(prenom)}, v` : 'V'}otre fiche est disponible</h2>
    <p>Votre fiche <strong>${escapeHtml(fiche.numero)}</strong> couvre la période du <strong>${escapeHtml(fiche.du)}</strong> au <strong>${escapeHtml(fiche.au)}</strong> : <strong>${formatMoneyEUR(fiche.totalMontant)}</strong> pour ${Number(fiche.nbLivraisons) || 0} livraison(s).</p>
    <p style="text-align:center;margin:26px 0 8px;"><a href="${escapeHtml(lien)}" class="button" style="display:inline-block;background:#C2610F;color:#FFFFFF;padding:14px 32px;text-decoration:none;border-radius:999px;font-weight:700;font-size:15px;">Voir ma fiche</a></p>
    <p style="font-size:13px;color:#8A7664;">Retrouvez-la dans la section « Mes fiches de paie » de votre espace livreur.</p>
  `;
  return baseTemplate(content, `Fiche de rémunération ${fiche.numero || ''} - Afro-food`);
};

/** E-mail admin : un client a donné une mauvaise note. */
export const negativeReviewEmail = (commande, evaluation) => {
  const info = commande.informationsClient || {};
  const client = escapeHtml([info.prenom, info.nom].filter(Boolean).join(' ') || 'Un client');
  const note = Math.max(0, Math.min(5, Number(evaluation.note) || 0));
  const etoiles = `${'★'.repeat(note)}<span style="color:#E8DCC4;">${'★'.repeat(5 - note)}</span>`;
  const lien = `${FRONTEND}/admin-avis`;
  const content = `
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#B3261E;font-weight:700;">Avis à traiter</p>
    <h2>${client} n'est pas satisfait</h2>
    <p>Commande <strong>${escapeHtml(commande.numeroCommande || '')}</strong></p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:18px 0;">
      <tr><td style="background-color:#FDECEC;border-left:5px solid #B3261E;border-radius:12px;padding:18px 22px;">
        <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#8A7664;">Note donnée</div>
        <div style="font-size:30px;line-height:1.2;color:#C2610F;margin:4px 0;">${etoiles} <span style="font-size:16px;color:#2C1A0E;font-weight:700;">${note}/5</span></div>
        ${
          evaluation.commentaire
            ? `<div style="margin-top:10px;font-style:italic;color:#2C1A0E;">« ${escapeHtml(evaluation.commentaire)} »</div>`
            : '<div style="margin-top:10px;color:#8A7664;">Sans commentaire.</div>'
        }
      </td></tr>
    </table>
    <p>Pensez à contacter le client rapidement pour comprendre le problème et le rassurer.</p>
    ${info.telephone || info.email ? `<p style="color:#8A7664;font-size:13px;">${[info.telephone, info.email].filter(Boolean).map(escapeHtml).join(' · ')}</p>` : ''}
    <p style="text-align:center;margin:26px 0 8px;"><a href="${escapeHtml(lien)}" class="button" style="display:inline-block;background:#C2610F;color:#FFFFFF;padding:14px 32px;text-decoration:none;border-radius:999px;font-weight:700;font-size:15px;">Voir les avis</a></p>
  `;
  return baseTemplate(content, `Avis ${note}/5 - Afro-food`);
};

/** E-mail admin : espèces non reversées par des livreurs. */
export const cashAlertEmail = (lignes, delaiHeures) => {
  const lien = `${FRONTEND}/admin-caisse`;
  const total = lignes.reduce((t, l) => t + Number(l.solde || 0), 0);
  const rows = lignes
    .map(
      (l) => `<tr>
        <td style="padding:10px 0;border-bottom:1px solid #EFE6D4;font-size:14px;color:#2C1A0E;"><strong>${escapeHtml(l.nom)}</strong><br /><span style="font-size:12px;color:#8A7664;">non reversé depuis ${Number(l.ageHeures) || 0} h</span></td>
        <td align="right" style="padding:10px 0;border-bottom:1px solid #EFE6D4;font-size:15px;font-weight:700;color:#B3261E;white-space:nowrap;">${formatMoneyEUR(l.solde)}</td>
      </tr>`
    )
    .join('');
  const content = `
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#B3261E;font-weight:700;">Alerte caisse</p>
    <h2>Espèces non reversées</h2>
    <p>Ces livreurs détiennent des espèces encaissées depuis plus de <strong>${Number(delaiHeures) || 48} h</strong>.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:14px 0 6px;">${rows}</table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:10px 0 24px;"><tr>
      <td style="font-size:15px;font-weight:700;color:#2C1A0E;">Total à récupérer</td>
      <td align="right" style="font-size:20px;font-weight:700;color:#C2610F;">${formatMoneyEUR(total)}</td>
    </tr></table>
    <p style="text-align:center;margin:0 0 8px;"><a href="${escapeHtml(lien)}" class="button" style="display:inline-block;background:#C2610F;color:#FFFFFF;padding:14px 32px;text-decoration:none;border-radius:999px;font-weight:700;font-size:15px;">Ouvrir la caisse</a></p>
  `;
  return baseTemplate(content, 'Espèces non reversées - Afro-food');
};

export default {
  negativeReviewEmail,
  cashAlertEmail,
  payslipEmail,
  orderReadyCourierEmail,
  stripeVirementEmail,
  cashCodeEmail,
  cashReceiptEmail,
  newOrderAdminEmail,
  thankYouEmail,
  promoRewardEmail,
  welcomeEmail,
  orderConfirmationEmail,
  expeditionEmail,
  orderStatusEmail,
  passwordResetEmail,
  emailVerificationEmail,
  promotionalEmail,
  productReviewRequestEmail,
  abandonedCartEmail,
};