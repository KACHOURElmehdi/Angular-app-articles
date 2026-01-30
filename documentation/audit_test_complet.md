# 🔍 Audit Complet des Tests et CI/CD

> **Application**: Angular RealWorld Example App (v2)  
> **Date d'audit**: 29 janvier 2026  
> **Stack principale**: Angular 20.3.9 + Node.js Backend (Express/Prisma)

---

## 📋 1. Executive Summary

| Point clé                | Statut                                                |
| ------------------------ | ----------------------------------------------------- |
| **Framework principal**  | Angular 20.3.9 (frontend) + Express/Prisma (backend)  |
| **Unit tests**           | Vitest pour frontend (10 fichiers, ~1700+ assertions) |
| **E2E tests**            | Playwright (7 fichiers, ~45 scénarios)                |
| **Backend tests**        | Jest (2 fichiers, ~20 tests)                          |
| **CI/CD**                | GitHub Actions (2 workflows)                          |
| **⚠️ GAP CRITIQUE**      | **Les tests unitaires NE SONT PAS exécutés en CI**    |
| **⚠️ GAP CRITIQUE**      | **Les tests backend NE SONT PAS exécutés en CI**      |
| **Coverage**             | Configuré mais non requis/vérifié en CI               |
| **Tests de performance** | ❌ Absents                                            |

**Résumé en bullets**:

- ✅ Bonne couverture E2E des user stories principales (auth, articles, commentaires, social)
- ✅ Tests unitaires bien structurés avec mocks HTTP propres
- ⚠️ **CRITIQUE**: Seuls les tests E2E Playwright sont exécutés en pipeline CI
- ⚠️ **CRITIQUE**: Les tests unitaires Vitest et backend Jest sont ignorés en CI
- ⚠️ Pas de seuil de couverture obligatoire
- ❌ Aucun test de performance/charge
- ❌ Pas de tests d'accessibilité (a11y)

---

## 📊 2. Inventaire des Tests

### 2.1 Vue d'ensemble

| Type                      | Framework  | Quantité                   | Emplacement                                     | Commande                  | Exécuté en CI        |
| ------------------------- | ---------- | -------------------------- | ----------------------------------------------- | ------------------------- | -------------------- |
| **Unit tests (Frontend)** | Vitest     | 10 fichiers (~1700+ tests) | `src/app/**/*.spec.ts`                          | `npm run test`            | ❌ **NON**           |
| **E2E tests**             | Playwright | 7 fichiers (~45 scénarios) | `e2e/*.spec.ts`                                 | `npm run test:e2e`        | ✅ Oui               |
| **Functional tests**      | Playwright | 1 fichier (5 scénarios)    | `e2e/functional.spec.ts`                        | `npm run test:functional` | ✅ (inclus dans e2e) |
| **Backend unit tests**    | Jest       | 2 fichiers (~20 tests)     | `backend/src/__tests__/*.test.js`               | `npm run test` (backend)  | ❌ **NON**           |
| **UI Component tests**    | Vitest     | 1 fichier                  | `src/app/.../article-comment.component.spec.ts` | `npm run test`            | ❌ **NON**           |
| **Integration tests**     | -          | 0                          | -                                               | -                         | -                    |
| **Performance tests**     | -          | 0                          | -                                               | -                         | -                    |

### 2.2 Détail des fichiers de tests unitaires (Frontend)

| Fichier                                                                                                                                                             | Scope        | Tests     | Type      | Dépendances mockées              |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | --------- | --------- | -------------------------------- |
| [auth.service.spec.ts](file:///d:/Ynov/M2/Test/angular-realworld-example-app-v2/src/app/core/auth/services/auth.service.spec.ts)                                    | Auth         | 4 tests   | Unit      | HttpClient, Router, localStorage |
| [jwt.service.spec.ts](file:///d:/Ynov/M2/Test/angular-realworld-example-app-v2/src/app/core/auth/services/jwt.service.spec.ts)                                      | Auth         | 52 tests  | Unit      | localStorage                     |
| [user.service.spec.ts](file:///d:/Ynov/M2/Test/angular-realworld-example-app-v2/src/app/core/auth/services/user.service.spec.ts)                                    | Auth         | 30+ tests | Unit      | HttpClient, JwtService, Router   |
| [token.interceptor.spec.ts](file:///d:/Ynov/M2/Test/angular-realworld-example-app-v2/src/app/core/interceptors/token.interceptor.spec.ts)                           | Interceptor  | 2 tests   | Unit      | JwtService                       |
| [articles.service.spec.ts](file:///d:/Ynov/M2/Test/angular-realworld-example-app-v2/src/app/features/article/services/articles.service.spec.ts)                     | Articles     | 18 tests  | Unit      | HttpClient                       |
| [articles.service.http.spec.ts](file:///d:/Ynov/M2/Test/angular-realworld-example-app-v2/src/app/features/article/services/articles.service.http.spec.ts)           | Articles     | 7 tests   | Contract  | HttpClient + Interceptors        |
| [comments.service.spec.ts](file:///d:/Ynov/M2/Test/angular-realworld-example-app-v2/src/app/features/article/services/comments.service.spec.ts)                     | Comments     | 35+ tests | Unit      | HttpClient                       |
| [tags.service.spec.ts](file:///d:/Ynov/M2/Test/angular-realworld-example-app-v2/src/app/features/article/services/tags.service.spec.ts)                             | Tags         | 50+ tests | Unit      | HttpClient                       |
| [profile.service.spec.ts](file:///d:/Ynov/M2/Test/angular-realworld-example-app-v2/src/app/features/profile/services/profile.service.spec.ts)                       | Profile      | 40+ tests | Unit      | HttpClient                       |
| [article-comment.component.spec.ts](file:///d:/Ynov/M2/Test/angular-realworld-example-app-v2/src/app/features/article/components/article-comment.component.spec.ts) | UI/Component | 15 tests  | Component | UserService                      |

### 2.3 Détail des fichiers E2E (Playwright)

| Fichier                                                                                               | Scope              | Scénarios | Dépendances     |
| ----------------------------------------------------------------------------------------------------- | ------------------ | --------- | --------------- |
| [articles.spec.ts](file:///d:/Ynov/M2/Test/angular-realworld-example-app-v2/e2e/articles.spec.ts)     | Articles CRUD      | 8 tests   | Backend API, DB |
| [auth.spec.ts](file:///d:/Ynov/M2/Test/angular-realworld-example-app-v2/e2e/auth.spec.ts)             | Authentification   | 7 tests   | Backend API, DB |
| [comments.spec.ts](file:///d:/Ynov/M2/Test/angular-realworld-example-app-v2/e2e/comments.spec.ts)     | Commentaires       | 9 tests   | Backend API, DB |
| [functional.spec.ts](file:///d:/Ynov/M2/Test/angular-realworld-example-app-v2/e2e/functional.spec.ts) | Scénarios métier   | 5 tests   | Backend API, DB |
| [health.spec.ts](file:///d:/Ynov/M2/Test/angular-realworld-example-app-v2/e2e/health.spec.ts)         | Smoke tests        | 4 tests   | Backend API     |
| [navigation.spec.ts](file:///d:/Ynov/M2/Test/angular-realworld-example-app-v2/e2e/navigation.spec.ts) | Navigation/Filtres | 9 tests   | Backend API, DB |
| [social.spec.ts](file:///d:/Ynov/M2/Test/angular-realworld-example-app-v2/e2e/social.spec.ts)         | Follow/Profile     | 6 tests   | Backend API, DB |

### 2.4 Détail des tests Backend (Jest)

| Fichier                                                                                                                                 | Scope      | Tests     | Description                                  |
| --------------------------------------------------------------------------------------------------------------------------------------- | ---------- | --------- | -------------------------------------------- |
| [auth.utils.test.js](file:///d:/Ynov/M2/Test/angular-realworld-example-app-v2/backend/src/__tests__/auth.utils.test.js)                 | Auth       | ~10 tests | Hash password, JWT sign/verify, middleware   |
| [validation.helpers.test.js](file:///d:/Ynov/M2/Test/angular-realworld-example-app-v2/backend/src/__tests__/validation.helpers.test.js) | Validation | ~10 tests | Input validation (register, login, articles) |

---

## 🔄 3. Analyse Pipeline CI/CD

### 3.1 Structure des Workflows GitHub Actions

```
.github/workflows/
├── lint.yml        # Format check (Prettier)
└── playwright.yml  # E2E tests uniquement
```

### 3.2 Workflow: `lint.yml` (Format Check)

| Attribut         | Valeur                                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Fichier**      | [.github/workflows/lint.yml](file:///d:/Ynov/M2/Test/angular-realworld-example-app-v2/.github/workflows/lint.yml) |
| **Trigger**      | `push` et `pull_request` sur `main`/`master`                                                                      |
| **Runner**       | `ubuntu-latest`                                                                                                   |
| **Node version** | 20                                                                                                                |
| **Cache**        | npm                                                                                                               |

**Étapes exécutées**:

```yaml
1. actions/checkout@v4
2. actions/setup-node@v4 (node: 20, cache: npm)
3. npm ci
4. npm run format:check  # Prettier --check
```

**Artefacts générés**: Aucun  
**Bloque le merge**: ✅ Oui (si format invalide)

---

### 3.3 Workflow: `playwright.yml` (E2E Tests)

| Attribut            | Valeur                                                                                                                        |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **Fichier**         | [.github/workflows/playwright.yml](file:///d:/Ynov/M2/Test/angular-realworld-example-app-v2/.github/workflows/playwright.yml) |
| **Trigger**         | `push` et `pull_request` sur `main`/`master`                                                                                  |
| **Runner**          | `ubuntu-latest`                                                                                                               |
| **Timeout**         | 60 minutes                                                                                                                    |
| **Variables d'env** | `DATABASE_URL=file:./dev.db`, `CI=true`                                                                                       |

**Étapes exécutées**:

```yaml
1. actions/checkout@v4
2. actions/setup-node@v4 (node: 20, cache: npm)
3. npm ci (frontend)
4. npm ci (backend)
5. npm run backend:db  # Prisma db push
6. npm run backend:seed  # Seed database
7. npx playwright install --with-deps chromium
8. npm run test:e2e  # Playwright tests
9. Upload playwright-report/ (toujours)
10. Upload test-results/ (si failure)
```

**Artefacts générés**:
| Artefact | Condition | Rétention |
|----------|-----------|-----------|
| `playwright-report` | Toujours | 30 jours |
| `test-results` | Si échec | 30 jours |

**Bloque le merge**: ✅ Oui (si tests échouent)

---

### 3.4 Schéma d'exécution Pipeline

```
┌────────────────────────────────────────────────────────────────────┐
│                         GITHUB ACTIONS                              │
│                    Trigger: push/PR on main/master                  │
├────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌─────────────────┐       ┌─────────────────────────────────┐   │
│   │   lint.yml      │       │        playwright.yml            │   │
│   │   (Format)      │       │        (E2E Tests)               │   │
│   └────────┬────────┘       └────────────────┬────────────────┘   │
│            │                                  │                     │
│            ▼                                  ▼                     │
│   ┌─────────────────┐       ┌─────────────────────────────────┐   │
│   │ npm run         │       │ 1. Setup DB (Prisma)            │   │
│   │ format:check    │       │ 2. Seed Data                    │   │
│   └────────┬────────┘       │ 3. Install Playwright           │   │
│            │                │ 4. npm run test:e2e              │   │
│            ▼                └────────────────┬────────────────┘   │
│   ┌─────────────────┐                       │                     │
│   │ ✅ Pass / ❌ Fail│                       ▼                     │
│   └─────────────────┘       ┌─────────────────────────────────┐   │
│                             │ Upload: playwright-report/       │   │
│                             │ Upload: test-results/ (on fail)  │   │
│                             └────────────────┬────────────────┘   │
│                                              │                     │
│                                              ▼                     │
│                             ┌─────────────────────────────────┐   │
│                             │ ✅ Pass / ❌ Fail                 │   │
│                             └─────────────────────────────────┘   │
│                                                                     │
│   ⚠️ TESTS NON EXÉCUTÉS EN CI:                                     │
│   - npm run test (Vitest unit tests)                               │
│   - cd backend && npm run test (Jest backend tests)                │
│   - npm run test:coverage                                          │
└────────────────────────────────────────────────────────────────────┘
```

### 3.5 Jobs et dépendances

| Job                     | Dépend de | Bloque merge |
| ----------------------- | --------- | ------------ |
| `format` (lint.yml)     | -         | ✅ Oui       |
| `test` (playwright.yml) | -         | ✅ Oui       |

**Note**: Les deux jobs s'exécutent en parallèle (pas de dépendance entre eux).

---

## 🔧 4. Configuration des Tests

### 4.1 Vitest (Unit Tests Frontend)

**Fichier**: [vitest.config.ts](file:///d:/Ynov/M2/Test/angular-realworld-example-app-v2/vitest.config.ts)

```typescript
export default defineConfig({
  plugins: [angular()],
  test: {
    globals: false,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.spec.ts'],
    pool: 'threads',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'], // ⚠️ Pas de thresholds!
    },
  },
});
```

| Configuration     | Valeur                |
| ----------------- | --------------------- |
| Environment       | jsdom                 |
| Pattern           | `src/**/*.spec.ts`    |
| Pool              | threads (parallèle)   |
| Coverage provider | v8                    |
| **Thresholds**    | **❌ Non configurés** |

---

### 4.2 Playwright (E2E Tests)

**Fichier**: [playwright.config.ts](file:///d:/Ynov/M2/Test/angular-realworld-example-app-v2/playwright.config.ts)

```typescript
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Sériel pour éviter conflits
  reporter: 'html',
  timeout: 120000,

  use: {
    baseURL: 'http://127.0.0.1:4200',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    actionTimeout: 5000,
    navigationTimeout: 10000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Firefox/Webkit désactivés
  ],

  webServer: {
    command: 'npm run start:full',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 180000,
  },
});
```

| Configuration       | Local         | CI            |
| ------------------- | ------------- | ------------- |
| Retries             | 0             | 2             |
| Workers             | 1             | 1             |
| forbidOnly          | false         | true          |
| reuseExistingServer | true          | false         |
| Browsers            | Chromium only | Chromium only |

---

### 4.3 Jest (Backend Tests)

**Fichier**: [backend/jest.config.js](file:///d:/Ynov/M2/Test/angular-realworld-example-app-v2/backend/jest.config.js)

```javascript
module.exports = {
  testEnvironment: 'node',
  clearMocks: true,
  roots: ['<rootDir>/src'],
  collectCoverageFrom: ['src/**/*.js', '!src/server.js', '!src/prisma.js'],
};
```

---

## ⚠️ 5. Gaps & Risques

### 5.1 Gaps Critiques (P0)

| Gap                                    | Impact                                          | Recommandation                       |
| -------------------------------------- | ----------------------------------------------- | ------------------------------------ |
| **Tests unitaires non exécutés en CI** | Régressions unitaires non détectées avant merge | Ajouter `npm run test` dans pipeline |
| **Tests backend non exécutés en CI**   | Bugs backend non détectés                       | Ajouter job backend tests            |
| **Pas de seuil de coverage**           | Coverage peut baisser sans alerte               | Ajouter thresholds (ex: 70%)         |

### 5.2 Gaps Importants (P1)

| Gap                             | Impact                            | Recommandation                     |
| ------------------------------- | --------------------------------- | ---------------------------------- |
| **Pas de tests de performance** | Régressions perf non détectées    | Ajouter Lighthouse CI ou k6        |
| **Un seul navigateur testé**    | Bugs cross-browser non détectés   | Activer Firefox/Safari en CI       |
| **Tests E2E sériels**           | Pipeline lent (~5-10min)          | Paralléliser avec sharding         |
| **1 test skipped**              | `social.spec.ts` - profile update | Corriger le bug et activer le test |

### 5.3 Gaps Mineurs (P2)

| Gap                           | Impact                          | Recommandation             |
| ----------------------------- | ------------------------------- | -------------------------- |
| **Pas de tests a11y**         | Problèmes accessibilité         | Ajouter axe-core ou pa11y  |
| **Pas de visual regression**  | UI bugs non détectés            | Ajouter Percy ou Chromatic |
| **afterEach avec delays**     | Tests potentiellement flaky     | Investiguer les ressources |
| **Pas de tests API contract** | Drift frontend/backend possible | Ajouter tests OpenAPI      |

### 5.4 Tests Flaky Potentiels

Les fichiers E2E contiennent des `setTimeout` dans `afterEach` (500ms-1000ms) pour éviter des flakiness:

```typescript
// articles.spec.ts, navigation.spec.ts, social.spec.ts, comments.spec.ts
test.afterEach(async ({ context }) => {
  await context.close();
  await new Promise(resolve => setTimeout(resolve, 500)); // Resource cleanup
});
```

**Cause probable**: Conflits de ressources (connexions réseau, file descriptors) lors de l'exécution séquentielle de nombreux tests.

---

## ✅ 6. Recommandations Priorisées

### P0 - Critiques (Quick Wins)

1. **Ajouter les tests unitaires dans la CI**

   ```yaml
   # Dans playwright.yml ou nouveau workflow unit.yml
   - name: Run Vitest unit tests
     run: npm run test
   ```

2. **Ajouter les tests backend dans la CI**

   ```yaml
   - name: Run backend tests
     run: cd backend && npm run test
   ```

3. **Ajouter seuils de coverage**
   ```typescript
   // vitest.config.ts
   coverage: {
     thresholds: {
       statements: 70,
       branches: 60,
       functions: 70,
       lines: 70,
     }
   }
   ```

### P1 - Importants

4. **Créer un workflow séparé pour les unit tests**

   ```yaml
   # .github/workflows/unit.yml
   name: Unit Tests
   on: [push, pull_request]
   jobs:
     frontend-unit:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with: { node-version: '20', cache: 'npm' }
         - run: npm ci
         - run: npm run test:coverage
         - name: Upload coverage
           uses: codecov/codecov-action@v4
   ```

5. **Activer la parallélisation E2E avec sharding**

   ```yaml
   strategy:
     matrix:
       shard: [1, 2, 3, 4]
   steps:
     - run: npm run test:e2e -- --shard=${{ matrix.shard }}/4
   ```

6. **Ajouter tests multi-navigateurs**
   ```typescript
   // playwright.config.ts - activer firefox et webkit
   projects: [
     { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
     { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
     { name: 'webkit', use: { ...devices['Desktop Safari'] } },
   ],
   ```

### P2 - Nice to Have

7. **Ajouter tests de performance Lighthouse**
8. **Ajouter tests d'accessibilité avec axe-core**
9. **Ajouter visual regression testing**
10. **Corriger le test skipped (`should update user profile`)**

---

## 🖥️ 7. Comment lancer les tests en local

### 7.1 Prérequis

```bash
# Node.js >= 20.11.1
node --version

# Installer les dépendances
npm install
cd backend && npm install && cd ..

# Installer Playwright browsers (première fois)
npx playwright install chromium
```

### 7.2 Commandes de tests

| Action                          | Commande                     |
| ------------------------------- | ---------------------------- |
| **Tests unitaires (watch)**     | `npm run test`               |
| **Tests unitaires (UI)**        | `npm run test:ui`            |
| **Tests unitaires + coverage**  | `npm run test:coverage`      |
| **Tests E2E (headless)**        | `npm run test:e2e`           |
| **Tests E2E (UI)**              | `npm run test:e2e:ui`        |
| **Tests E2E (debug)**           | `npm run test:e2e:debug`     |
| **Tests E2E (headed)**          | `npm run test:e2e:headed`    |
| **Tests functional uniquement** | `npm run test:functional`    |
| **Voir rapport E2E**            | `npm run test:e2e:report`    |
| **Tests backend**               | `cd backend && npm run test` |

### 7.3 Scripts complets disponibles (package.json)

```json
{
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage",
  "test:e2e": "playwright test",
  "test:functional": "playwright test e2e/functional.spec.ts",
  "test:functional:ui": "playwright test e2e/functional.spec.ts --ui",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:headed": "playwright test --headed",
  "test:e2e:debug": "playwright test --debug",
  "test:e2e:report": "playwright show-report"
}
```

---

## 🔍 8. Comment debugger un test qui fail en CI

### 8.1 Checklist de debug

```markdown
1. ☐ Télécharger les artefacts `playwright-report` et `test-results` depuis GitHub Actions
2. ☐ Ouvrir le rapport HTML: `npx playwright show-report ./playwright-report`
3. ☐ Vérifier les screenshots de failure dans `test-results/`
4. ☐ Regarder les traces (si activées): `npx playwright show-trace trace.zip`
5. ☐ Vérifier la version Node.js (CI vs local)
6. ☐ Comparer les variables d'environnement (DATABASE_URL, CI)
7. ☐ Vérifier si le test est flaky (run multiple times)
8. ☐ Reproduire en local avec: `CI=true npm run test:e2e`
```

### 8.2 Reproduire l'environnement CI en local

```bash
# Simuler l'environnement CI
export CI=true
export DATABASE_URL=file:./dev.db

# Réinitialiser la DB comme en CI
npm run backend:db
npm run backend:seed

# Lancer les tests comme en CI
npm run test:e2e
```

### 8.3 Debug interactif

```bash
# Mode debug avec breakpoints
npm run test:e2e:debug

# Mode UI pour voir les tests en temps réel
npm run test:e2e:ui

# Lancer un seul test
npx playwright test auth.spec.ts --debug
```

### 8.4 Logs et traces

| Type                | Emplacement                | Comment y accéder           |
| ------------------- | -------------------------- | --------------------------- |
| Playwright report   | `playwright-report/`       | `npm run test:e2e:report`   |
| Screenshots failure | `test-results/`            | Ouvrir les .png             |
| Traces              | `test-results/*/trace.zip` | `npx playwright show-trace` |
| Console logs        | Dans le rapport HTML       | Onglet "Console"            |
| Network requests    | Dans le rapport HTML       | Onglet "Network"            |

---

## 📅 9. Plan d'action 7 jours

### Jour 1: Quick Wins CI

- [ ] Créer `.github/workflows/unit.yml` pour les tests Vitest
- [ ] Ajouter `npm run test` dans le workflow
- [ ] Merger et vérifier l'exécution

### Jour 2: Tests Backend et Coverage

- [ ] Ajouter tests backend au workflow CI
- [ ] Configurer les thresholds de coverage (70%)
- [ ] Intégrer Codecov pour le reporting

### Jour 3: Optimisation Pipeline

- [ ] Ajouter cache pour node_modules
- [ ] Ajouter cache pour Playwright browsers
- [ ] Paralléliser les workflows (matrix strategy)

### Jour 4: Multi-navigateurs

- [ ] Activer Firefox et Webkit dans Playwright
- [ ] Configurer sharding pour E2E (4 shards)
- [ ] Vérifier les temps d'exécution

### Jour 5: Qualité

- [ ] Corriger le test skipped `should update user profile`
- [ ] Investiguer et corriger les delays dans afterEach
- [ ] Ajouter tests de régression visuelle (optionnel)

### Jour 6: Performance & A11y

- [ ] Ajouter Lighthouse CI pour les métriques web
- [ ] Ajouter axe-core pour les tests d'accessibilité
- [ ] Configurer les seuils de performance

### Jour 7: Documentation & Validation

- [ ] Mettre à jour README avec instructions de test
- [ ] Créer `TESTING.md` avec la stratégie de test
- [ ] Valider le pipeline complet sur une PR

---

## 📁 10. Structure recommandée

```
angular-realworld-example-app-v2/
├── .github/
│   └── workflows/
│       ├── lint.yml              # ✅ Existe
│       ├── playwright.yml        # ✅ Existe (à améliorer)
│       ├── unit.yml              # 🆕 À créer
│       └── backend.yml           # 🆕 À créer
├── e2e/
│   ├── helpers/                  # ✅ Bien organisé
│   ├── *.spec.ts                 # ✅ Conventions OK
│   └── fixtures/                 # 🆕 À créer (test data)
├── src/
│   └── app/
│       └── **/*.spec.ts          # ✅ Collocated avec code
├── backend/
│   └── src/
│       └── __tests__/            # ✅ Existe
├── playwright.config.ts          # ✅ Bien configuré
├── vitest.config.ts              # ⚠️ Ajouter thresholds
├── TESTING.md                    # 🆕 À créer
└── package.json                  # ✅ Scripts OK
```

---

## 📝 Conventions de nommage recommandées

| Type          | Convention               | Exemple                        |
| ------------- | ------------------------ | ------------------------------ |
| Unit tests    | `*.spec.ts` (collocated) | `user.service.spec.ts`         |
| E2E tests     | `<feature>.spec.ts`      | `articles.spec.ts`             |
| Helpers E2E   | `helpers/<feature>.ts`   | `helpers/auth.ts`              |
| Backend tests | `__tests__/*.test.js`    | `__tests__/auth.utils.test.js` |

---

## 🏷️ Classification des tests

| Type           | Critères                                   | Exemples repo                                 |
| -------------- | ------------------------------------------ | --------------------------------------------- |
| **Unit**       | Testé isolément avec mocks HTTP            | `jwt.service.spec.ts`, `tags.service.spec.ts` |
| **Component**  | Testé avec Angular TestBed, mocks services | `article-comment.component.spec.ts`           |
| **Contract**   | Vérifie format HTTP request/response       | `articles.service.http.spec.ts`               |
| **E2E**        | Browser réel + Backend réel + DB           | `auth.spec.ts`, `articles.spec.ts`            |
| **Functional** | Scénarios métier end-to-end                | `functional.spec.ts`                          |
| **Smoke**      | Vérification basique app fonctionne        | `health.spec.ts`                              |
