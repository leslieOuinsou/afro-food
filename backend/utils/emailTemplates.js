/**
 * Templates d'email pour l'application Afro-Eats
 */

// Template de base pour tous les emails
const baseTemplate = (content, title = 'Afro-Eats') => `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
        }
        .header {
            text-align: center;
            padding: 20px 0;
            border-bottom: 2px solid #ff6b35;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #ff6b35;
        }
        .content {
            padding: 30px 0;
        }
        .button {
            display: inline-block;
            background: #ff6b35;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            padding: 20px 0;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">Afro-Eats</div>
            <p>Saveurs authentiques d'Afrique</p>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>© 2025 Afro-Eats. Tous droits réservés.</p>
            <p>Si vous avez des questions, contactez-nous à support@afro-eats.com</p>
        </div>
    </div>
</body>
</html>
`;

// Email de bienvenue
export const welcomeEmail = (nom, prenom) => {
  const content = `
    <h2>Bienvenue ${prenom} ${nom} !</h2>
    <p>Nous sommes ravis de vous accueillir dans la famille Afro-Eats !</p>
    <p>Votre compte a été créé avec succès. Vous pouvez maintenant :</p>
    <ul>
        <li>Découvrir nos plats authentiques du Cameroun et du Bénin</li>
        <li>Passer vos commandes en ligne</li>
        <li>Suivre vos livraisons en temps réel</li>
        <li>Laisser des avis sur nos plats</li>
    </ul>
    <p>
        <a href="${process.env.FRONTEND_URL}/menu" class="button">Découvrir notre menu</a>
    </p>
    <p>Merci de nous faire confiance pour vos saveurs africaines préférées !</p>
  `;
  
  return baseTemplate(content, 'Bienvenue chez Afro-Eats');
};

// Email de confirmation de commande
export const orderConfirmationEmail = (commande, client) => {
  const articlesHtml = commande.articles.map(article => `
    <tr>
        <td>${article.informationsPlat.nom}</td>
        <td style="text-align: center;">${article.quantite}</td>
        <td style="text-align: right;">${article.prixUnitaire.toFixed(2)} €</td>
        <td style="text-align: right;">${article.sousTotal.toFixed(2)} €</td>
    </tr>
  `).join('');
  
  const content = `
    <h2>Commande confirmée !</h2>
    <p>Bonjour ${client.prenom},</p>
    <p>Votre commande <strong>#${commande.numeroCommande}</strong> a été confirmée avec succès.</p>
    
    <h3>Détails de la commande :</h3>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
            <tr style="background-color: #f8f9fa;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Plat</th>
                <th style="padding: 10px; text-align: center; border: 1px solid #ddd;">Qté</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Prix unitaire</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Total</th>
            </tr>
        </thead>
        <tbody>
            ${articlesHtml}
        </tbody>
    </table>
    
    <div style="text-align: right; font-size: 16px; font-weight: bold;">
        <p>Sous-total: ${commande.montants.sousTotal.toFixed(2)} €</p>
        <p>Frais de livraison: ${commande.montants.fraisLivraison.toFixed(2)} €</p>
        ${commande.montants.remise > 0 ? `<p style="color: green;">Remise: -${commande.montants.remise.toFixed(2)} €</p>` : ''}
        <p style="font-size: 18px; color: #ff6b35;">Total: ${commande.montants.total.toFixed(2)} €</p>
    </div>
    
    <h3>Adresse de livraison :</h3>
    <p>
        ${commande.adresseLivraison.nom}<br>
        ${commande.adresseLivraison.adresse}<br>
        ${commande.adresseLivraison.codePostal} ${commande.adresseLivraison.ville}
    </p>
    
    <p>Temps de livraison estimé : <strong>30-45 minutes</strong></p>
    
    <p>
        <a href="${process.env.FRONTEND_URL}/commandes/${commande._id}" class="button">Suivre ma commande</a>
    </p>
    
    <p>Merci de votre confiance !</p>
  `;
  
  return baseTemplate(content, 'Commande confirmée - Afro-Eats');
};

// Email de changement de statut de commande
export const orderStatusEmail = (commande, nouveauStatut, client) => {
  const statutsMessages = {
    'confirmee': 'Votre commande a été confirmée et est en cours de préparation.',
    'en_preparation': 'Nos chefs préparent votre commande avec amour !',
    'prete': 'Votre commande est prête ! Notre livreur arrive bientôt.',
    'en_livraison': 'Votre commande est en route ! Livraison dans quelques minutes.',
    'livree': 'Votre commande a été livrée avec succès ! Bon appétit !',
    'annulee': 'Votre commande a été annulée. Nous nous excusons pour ce désagrément.'
  };
  
  const message = statutsMessages[nouveauStatut] || 'Le statut de votre commande a été mis à jour.';
  
  const content = `
    <h2>Mise à jour de votre commande</h2>
    <p>Bonjour ${client.prenom},</p>
    <p>Votre commande <strong>#${commande.numeroCommande}</strong> a été mise à jour.</p>
    
    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #ff6b35; margin-top: 0;">Nouveau statut : ${nouveauStatut.replace('_', ' ').toUpperCase()}</h3>
        <p style="margin-bottom: 0;">${message}</p>
    </div>
    
    <p>
        <a href="${process.env.FRONTEND_URL}/commandes/${commande._id}" class="button">Voir les détails</a>
    </p>
    
    ${nouveauStatut === 'livree' ? `
        <p style="background-color: #e8f5e8; padding: 15px; border-radius: 5px;">
            <strong>💚 Votre avis nous intéresse !</strong><br>
            Aidez-nous à améliorer nos services en laissant un avis sur votre commande.
        </p>
    ` : ''}
  `;
  
  return baseTemplate(content, 'Mise à jour de commande - Afro-Eats');
};

// Email de reset de mot de passe
export const passwordResetEmail = (nom, prenom, resetToken) => {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
  
  const content = `
    <h2>Réinitialisation de mot de passe</h2>
    <p>Bonjour ${prenom} ${nom},</p>
    <p>Vous avez demandé à réinitialiser votre mot de passe Afro-Eats.</p>
    <p>Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
    
    <p>
        <a href="${resetUrl}" class="button">Réinitialiser mon mot de passe</a>
    </p>
    
    <p><strong>Ce lien est valide pendant 1 heure.</strong></p>
    
    <p>Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet email.</p>
    
    <p style="font-size: 14px; color: #666;">
        Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br>
        ${resetUrl}
    </p>
  `;
  
  return baseTemplate(content, 'Réinitialisation de mot de passe - Afro-Eats');
};

// Email de vérification d'email
export const emailVerificationEmail = (nom, prenom, verificationToken) => {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
  
  const content = `
    <h2>Vérification de votre email</h2>
    <p>Bonjour ${prenom} ${nom},</p>
    <p>Merci de vous être inscrit sur Afro-Eats !</p>
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
  
  return baseTemplate(content, 'Vérification email - Afro-Eats');
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
  
  return baseTemplate(content, titre + ' - Afro-Eats');
};

export default {
  welcomeEmail,
  orderConfirmationEmail,
  orderStatusEmail,
  passwordResetEmail,
  emailVerificationEmail,
  promotionalEmail
};