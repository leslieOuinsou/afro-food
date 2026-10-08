#!/usr/bin/env bash
# Préparation d'une machine Oracle Cloud (Ubuntu 22.04/24.04, ARM ou x86) pour héberger Jenkins.
# Usage (sur la machine, en tant qu'utilisateur « ubuntu ») :  bash ci/oracle/install.sh
set -euo pipefail

echo "▶ 1/5 Mises à jour système"
sudo apt-get update -y
sudo DEBIAN_FRONTEND=noninteractive apt-get upgrade -y
sudo apt-get install -y ca-certificates curl git ufw iptables-persistent unattended-upgrades

echo "▶ 2/5 Docker"
if ! command -v docker >/dev/null; then
  curl -fsSL https://get.docker.com | sudo sh
fi
sudo usermod -aG docker "$USER"

echo "▶ 3/5 Espace d'échange (swap) de 4 Go : le build Next.js consomme beaucoup de mémoire"
if ! swapon --show | grep -q swapfile; then
  sudo fallocate -l 4G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
fi

echo "▶ 4/5 Pare-feu : SSH (22), HTTP (80), HTTPS (443) uniquement"
# Les images Oracle ont des règles iptables par défaut qui bloquent 80/443 : on les ouvre avant la règle de rejet
sudo iptables -C INPUT -p tcp --dport 80 -j ACCEPT 2>/dev/null || sudo iptables -I INPUT 5 -p tcp --dport 80 -j ACCEPT
sudo iptables -C INPUT -p tcp --dport 443 -j ACCEPT 2>/dev/null || sudo iptables -I INPUT 5 -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save

echo "▶ 5/5 Mises à jour de sécurité automatiques"
sudo dpkg-reconfigure -f noninteractive unattended-upgrades

cat <<'FIN'

✔ Machine prête. Déconnectez-vous puis reconnectez-vous en SSH (pour activer le groupe docker), puis :

  git clone https://github.com/leslieOuinsou/afro-food.git && cd afro-food/ci/jenkins
  cp .env.example .env && nano .env        # JENKINS_DOMAIN, mot de passe admin, VERCEL_TOKEN, DATABASE_URL_DIRECT…
  cd ../oracle && docker compose --env-file ../jenkins/.env up -d --build

Jenkins sera disponible sur https://<votre domaine>/ (le certificat HTTPS est obtenu automatiquement).
FIN
