// Pipeline Jenkins d'Afro-food : mêmes étapes que GitHub Actions (.github/workflows/ci.yml).
// Prérequis Jenkins : plugins Docker Pipeline + Credentials Binding ; identifiants « vercel-token » (texte secret)
// et « database-url-direct » (texte secret). Voir docs/CI-CD.md.
pipeline {
  agent none

  options {
    timestamps()
    ansiColor('xterm')
    timeout(time: 30, unit: 'MINUTES')
    disableConcurrentBuilds(abortPrevious: true)
    buildDiscarder(logRotator(numToKeepStr: '20'))
  }

  parameters {
    booleanParam(name: 'DEPLOYER', defaultValue: false, description: 'Déployer en production après des vérifications réussies (branche main uniquement)')
    booleanParam(name: 'MIGRER', defaultValue: true, description: 'Appliquer les migrations de base de données avant le backend')
  }

  environment {
    CI = 'true'
    NEXT_TELEMETRY_DISABLED = '1'
    BACKEND_URL = 'https://backend-swart-phi-99.vercel.app'
    FRONTEND_URL = 'https://afrofood.vercel.app'
  }

  stages {
    stage('Vérifications') {
      parallel {
        stage('Backend') {
          agent { docker { image 'node:24-bookworm'; args '-u root:root' } }
          environment {
            DATABASE_URL = 'postgresql://ci:ci@localhost:5432/ci'
            JWT_SECRET = 'secret-de-test-ci'
          }
          steps {
            dir('backend') {
              sh 'npm ci'
              sh 'npx prisma validate'
              sh 'npm test'
              sh 'npm audit --omit=dev --audit-level=high'
            }
          }
        }

        stage('Frontend') {
          agent { docker { image 'node:24-bookworm'; args '-u root:root' } }
          environment {
            NEXT_PUBLIC_API_URL = 'https://api.example.test'
          }
          steps {
            dir('frontend') {
              sh 'npm ci'
              sh 'npx eslint src'
              sh 'npx tsc --noEmit'
              sh 'npx next build'
              sh 'npm audit --omit=dev --audit-level=high'
            }
          }
        }

        stage('Migrations') {
          agent { docker { image 'node:24-bookworm'; args '-u root:root' } }
          steps {
            sh 'git fetch --no-tags --depth=50 origin +refs/heads/*:refs/remotes/origin/* || true'
            sh 'bash scripts/verifier-migrations.sh'
          }
        }
      }
    }

    stage('Déploiement') {
      when {
        allOf {
          branch 'main'
          expression { return params.DEPLOYER }
        }
      }
      agent { docker { image 'node:24-bookworm'; args '-u root:root' } }
      environment {
        VERCEL_ORG_ID = credentials('vercel-org-id')
        VERCEL_TOKEN = credentials('vercel-token')
      }
      stages {
        stage('Confirmation') {
          steps {
            timeout(time: 10, unit: 'MINUTES') {
              input message: 'Déployer Afro-food en production ?', ok: 'Déployer'
            }
          }
        }
        stage('Backend') {
          environment {
            VERCEL_PROJECT_ID = credentials('vercel-backend-project-id')
            DATABASE_URL = credentials('database-url-direct')
          }
          steps {
            script {
              if (params.MIGRER) {
                dir('backend') {
                  sh 'npm ci && npx prisma migrate deploy'
                }
              }
            }
            sh 'npx --yes vercel@latest deploy --prod --yes --token "$VERCEL_TOKEN"'
            sh 'bash scripts/verifier-sante.sh "$BACKEND_URL/api/health"'
          }
        }
        stage('Frontend') {
          environment {
            VERCEL_PROJECT_ID = credentials('vercel-frontend-project-id')
          }
          steps {
            sh 'npx --yes vercel@latest deploy --prod --yes --token "$VERCEL_TOKEN"'
            sh 'bash scripts/verifier-sante.sh "$FRONTEND_URL/catalogue"'
          }
        }
      }
    }
  }

  post {
    success { echo 'Pipeline réussi.' }
    failure { echo 'Pipeline en échec : consultez les journaux de l’étape en rouge.' }
  }
}
