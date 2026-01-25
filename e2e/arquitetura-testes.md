# Arquitetura de Testes E2E

Documentação da estrutura e padrões de testes end-to-end do projeto.

## Stack de Testes

| Camada | Tecnologia |
|--------|------------|
| Framework | Playwright |
| Viewport | 2560x1440 (2K) |
| Browser | Chromium |
| Ambiente | Deve rodar em staging/homologação, NUNCA em produção |

## Estrutura de Pastas

```
e2e/
├── routines/              # Funções atômicas reutilizáveis (os "Legos")
│   ├── index.ts           # Re-exporta TUDO (única fonte de importação)
│   ├── navigation.ts      # navigateTo(), waitForUrl()
│   ├── form.ts            # fillInput(), clickButton(), selectOption()
│   ├── auth.ts            # generateTestUser(), loginWithCredentials()
│   ├── api.ts             # callAsaasApi(), simulatePayment()
│   ├── database.ts        # createTestUser(), cleanupTestUser(), confirmUserEmail()
│   └── assertions.ts      # expectToast(), expectRedirect(), expectVisible()
│
├── pages/                 # Page Objects que ORQUESTRAM as rotinas
│   ├── index.ts           # Re-exporta tudo
│   ├── base.page.ts       # Classe base com funcionalidades comuns
│   ├── login.page.ts
│   ├── register.page.ts
│   ├── pricing.page.ts
│   ├── profile.page.ts
│   └── dashboard.page.ts
│
├── specs/                 # Arquivos de teste
│   ├── register.spec.ts   # Teste E2E #1: Register User
│   ├── login.spec.ts      # Teste E2E #2: Login User
│   └── ...
│
└── arquitetura-testes.md  # Este documento
```

## Arquitetura Híbrida: Routines + Page Objects

Decisão arquitetural: combinar **funções atômicas por domínio** com **Page Object Model (POM)**.

### Por quê?

- **POM puro** tem classes com código duplicado e "funções medonhas"
- **Funções soltas** não têm organização por página
- **Híbrido** = melhor dos dois mundos

### Como funciona

```
┌─────────────────────────────────────────────────────────────────┐
│  ROUTINES (funções atômicas)                                    │
│                                                                 │
│  navigation.ts   form.ts   auth.ts   database.ts   assertions.ts│
│       │            │          │           │             │       │
│       └────────────┴──────────┴───────────┴─────────────┘       │
│                              │                                  │
│                              ▼                                  │
│  PAGES (orquestram routines)                                    │
│                                                                 │
│  LoginPage.login() = fillInput() + fillInput() + clickButton()  │
│                                                                 │
│                              │                                  │
│                              ▼                                  │
│  SPECS (usam pages)                                             │
│                                                                 │
│  test('deve fazer login', async ({ page }) => {                 │
│    const loginPage = new LoginPage(page);                       │
│    await loginPage.goto();                                      │
│    await loginPage.login(email, password);                      │
│  });                                                            │
└─────────────────────────────────────────────────────────────────┘
```

### Exemplo Concreto

```typescript
// routines/form.ts - Função atômica
export async function fillInputByPlaceholder(page: Page, placeholder: string, value: string) {
  await page.fill(`[placeholder="${placeholder}"]`, value);
}

// pages/login.page.ts - Page Object usa rotinas
import { fillInputByPlaceholder, clickButton } from '../routines';

export class LoginPage extends BasePage {
  async login(email: string, password: string) {
    await fillInputByPlaceholder(this.page, 'Email', email);      // usa rotina
    await fillInputByPlaceholder(this.page, 'Senha', password);   // usa rotina
    await clickButton(this.page, 'Entrar');                       // usa rotina
  }
}

// specs/login.spec.ts - Teste usa Page Object
test('deve fazer login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(testUser.email, testUser.password);
  await expectRedirect(page, '/home');
});
```

## Princípios

### 1. Uma única fonte da verdade

- Cada ação tem UMA rotina
- Nunca duplicar código
- Se precisa preencher input, usa `fillInput()`, nunca `page.fill()` direto

### 2. Teste fluxo real, completo

- Nada de "teste rápido" ou atalhos
- Se email falha, usuário não consegue se cadastrar = teste falha
- Testar o que o usuário real faria

### 3. Rotinas atômicas, Pages orquestram

- **Rotina** = faz UMA coisa (preencher input, clicar botão)
- **Page** = combina rotinas para ações de página (login, register)
- **Spec** = usa pages para testar fluxos

### 4. Cleanup sempre

- Cada teste limpa seus dados no `afterAll`
- Usar `cleanupTestUser()` para remover usuários de teste
- Testes devem ser independentes

## Gerenciamento de Usuários de Teste

### Para testes que NÃO são de registro

Usar API Admin do Supabase para criar usuários já confirmados:

```typescript
// Cria usuário sem precisar de confirmação de email
const testUser = await createTestUserWithCredentials('e2e-login');
// Retorna: { id, email, password }
```

### Para teste de REGISTRO

Testar fluxo real completo:

1. Preencher formulário
2. Submeter
3. Verificar se email foi enviado (se falhar = teste falha)
4. Confirmar email via API Admin (simula clique no link)
5. Fazer login
6. Verificar acesso

```typescript
// Confirma email via API (simula clique no link)
await confirmUserEmailByEmail(testEmail);
```

## Rotinas Disponíveis

### navigation.ts
- `navigateTo(page, path)` - Navega para URL
- `waitForUrl(page, pattern)` - Aguarda URL específica
- `waitForPageLoad(page)` - Aguarda carregamento

### form.ts
- `fillInput(page, testId, value)` - Preenche por data-testid
- `fillInputByPlaceholder(page, placeholder, value)` - Preenche por placeholder
- `clickButton(page, text)` - Clica botão por texto
- `selectOption(page, testId, value)` - Seleciona em dropdown

### auth.ts
- `generateTestUser(prefix)` - Gera dados de usuário
- `loginWithCredentials(page, email, password)` - Faz login
- `logout(page)` - Faz logout
- `ensureLoggedOut(page)` - Garante que não tem sessão

### database.ts
- `createTestUser(email, password)` - Cria usuário já confirmado
- `createTestUserWithCredentials(prefix)` - Cria e retorna credenciais
- `cleanupTestUser(email)` - Remove usuário de teste
- `confirmUserEmailByEmail(email)` - Confirma email via API
- `findUserByEmail(email)` - Busca usuário
- `setUserPlan(userId, plan)` - Define plano do usuário

### api.ts
- `callAsaasApi(request, method, endpoint, data)` - Chama API Asaas
- `simulatePaymentConfirmation(request, paymentId)` - Simula pagamento
- `waitForWebhookProcessing(page, timeout)` - Aguarda webhook

### assertions.ts
- `expectSuccessToast(page, message?)` - Verifica toast de sucesso
- `expectErrorToast(page, message?)` - Verifica toast de erro
- `expectRedirect(page, path)` - Verifica redirecionamento
- `expectVisible(page, testId)` - Verifica elemento visível
- `expectText(page, text)` - Verifica texto na página

## Scripts NPM

```bash
npm run e2e          # Roda todos os testes
npm run e2e:ui       # Abre UI do Playwright
npm run e2e:headed   # Roda com browser visível
npm run e2e:debug    # Modo debug
npm run e2e:report   # Abre relatório
```

## Ambientes

| Ambiente | Pode rodar testes? |
|----------|-------------------|
| Local/Dev | ✅ Sim |
| Staging/Homologação | ✅ Sim |
| Produção | ❌ NUNCA |

**Regra:** Testes E2E criam e modificam dados. NUNCA rodar em produção.

## Plano de Testes

Baseado em `tests/plan-unit-test.md`:

1. ✅ Register User
2. ✅ Login User
3. ⏳ Update User Profile
4. ⏳ Subscribe to Pro Plan
5. ⏳ Upgrade Pro to Ultra
6. ⏳ Downgrade Ultra to Pro
7. ⏳ Cancel Subscription
8. ⏳ Webhook - Payment Confirmed
9. ⏳ Webhook - Payment Overdue
10. ⏳ Webhook - Subscription Deleted
11. ⏳ Trial Expiration
12. ⏳ Payment Failure
