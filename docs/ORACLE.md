# Héberger Jenkins sur Oracle Cloud (offre « Always Free »)

Coût : **0 €** tant que vous restez dans les ressources « Always Free ». Une carte bancaire sert à vérifier l'identité à l'inscription (pas de débit).

## 1. Créer le compte
1. https://www.oracle.com/cloud/free/ → *Start for free*. Choisissez la **région d'origine** avec soin : elle ne se change plus, et les machines gratuites y sont parfois épuisées (Paris, Francfort, Amsterdam sont possibles).
2. Validez l'e-mail, la carte et le téléphone.

## 2. Créer la machine
*Compute → Instances → Create instance*
- **Image** : Canonical Ubuntu 24.04 (ou 22.04).
- **Shape** : *Ampere → VM.Standard.A1.Flex*, **2 OCPU et 12 Go de RAM** (largement suffisant, reste dans l'offre gratuite).
  Si « Out of capacity » : réessayez plus tard ou changez de domaine de disponibilité.
- **Réseau** : attribuer une adresse IPv4 publique.
- **Clé SSH** : *Generate a key pair* → téléchargez la clé privée (`.key`) et gardez-la en sécurité. `chmod 600 ma-cle.key`
- Disque : 50 Go suffisent.

## 3. Ouvrir les ports dans Oracle
*Networking → Virtual Cloud Networks → votre VCN → Security Lists → Default → Add Ingress Rules* :
- Source `0.0.0.0/0`, TCP, port de destination **80**
- Source `0.0.0.0/0`, TCP, port de destination **443**
(Le port 22 pour SSH est déjà ouvert. N'ouvrez **pas** 8080 : Jenkins n'est joignable que par HTTPS via Caddy.)

## 4. Un nom de domaine gratuit
1. https://www.duckdns.org → connexion → créez un sous-domaine, par ex. `afro-ci` → `afro-ci.duckdns.org`.
2. Mettez l'**adresse IP publique** de la machine dans le champ *current ip*.

## 5. Installer
```bash
ssh -i ma-cle.key ubuntu@<IP_PUBLIQUE>
git clone https://github.com/leslieOuinsou/afro-food.git
bash afro-food/ci/oracle/install.sh
exit   # puis se reconnecter en SSH
cd afro-food/ci/jenkins && cp .env.example .env && nano .env
#   JENKINS_DOMAIN=afro-ci.duckdns.org
#   JENKINS_ADMIN_PASSWORD=<mot de passe long>
#   JENKINS_LECTURE=anonymous      # lecture seule publique pour le lien du CV
#   VERCEL_TOKEN=…  DATABASE_URL_DIRECT=…
cd ../oracle && docker compose --env-file ../jenkins/.env up -d --build
```
Ouvrez `https://afro-ci.duckdns.org/` : Jenkins répond, le job **afro-food** est créé tout seul et se lance après un premier scan du dépôt (≤ 5 min).

## 6. Relier le lien public
Dans Vercel → projet **frontend** → *Environment Variables* : `JENKINS_PUBLIC_URL=https://afro-ci.duckdns.org`, puis redéployer le frontend.
Le lien à mettre sur le CV est alors `https://afrofood.vercel.app/pipeline` (Stage View).

## Entretien
- Mises à jour de sécurité du système : automatiques (script d'installation).
- Mise à jour de Jenkins : `docker compose --env-file ../jenkins/.env up -d --build --pull always`.
- Sauvegarde : le volume `jenkins_home` contient tout (`docker run --rm -v ci_jenkins_home:/d -v $PWD:/b busybox tar czf /b/jenkins-home.tgz -C /d .`).
- Oracle peut **récupérer une machine gratuite inactive** : ouvrez Jenkins de temps en temps (les builds planifiés suffisent).
