# Jenkins sur Fly.io (Afro-food)

Objectif : Jenkins **public** pour le CV.  
URL typique : `https://afro-food-jenkins.fly.dev/`

> Fly.io n’a **pas** de Docker daemon. Les builds utilisent Node dans l’image (`Jenkinsfile.fly` + `agent any`).

## Prérequis
1. Compte [Fly.io](https://fly.io)
2. CLI : `curl -L https://fly.io/install.sh | sh`

## Déploiement

```bash
cd ci/jenkins
fly auth login
fly apps create afro-food-jenkins

fly secrets set \
  JENKINS_ADMIN_PASSWORD='ton-mot-de-passe-long' \
  JENKINS_URL='https://afro-food-jenkins.fly.dev/' \
  JENKINS_LECTURE='anonymous'

fly deploy
```

Ouvre `https://afro-food-jenkins.fly.dev/` — login `admin` + ton mot de passe.  
Job **afro-food** créé automatiquement (≤ 5 min). Lecture anonyme = Stage View visible sans compte.

## Lien CV
`https://afro-food-jenkins.fly.dev/job/afro-food/job/main/`

## Limites
- Machine 2 Go RAM : minimum ; augmente si OOM (`memory = '4096mb'` dans `fly.toml`)
- Surveille le free allowance Fly (peut devenir payant en 24/7)

## Fichiers
| Fichier | Rôle |
|---------|------|
| `ci/jenkins/fly.toml` | App Fly |
| `ci/jenkins/Dockerfile.fly` | Jenkins + Node 24 |
| `ci/jenkins/jenkins.fly.yaml` | JCasC Fly |
| `Jenkinsfile.fly` | Pipeline sans Docker agents |
