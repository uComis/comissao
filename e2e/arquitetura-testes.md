# Arquitetura de Testes E2E

Documentação da estrutura e padrões de testes end-to-end do projeto.

## Stack de Testes

| Camada | Tecnologia |
|--------|------------|
| Framework | Playwright |
| Viewport | 1280x720 (HD) |
| Browser | Chromium |
| Ambiente | Deve rodar em staging/homologação, NUNCA em produção |

## Estrutura de Pastas

```
e2e/
├── fixtures/              # Fixtures customizadas do Playwright
│   └── test-report.ts     # Fixture que gera relatórios HTML
│
├── reports/               # Relatórios HTML gerados (git ignored)
│   └── *.html             # Um arquivo por execução de teste
│
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
├── state/                 # Estado compartilhado entre testes
│   ├── shared-user.ts     # Gerenciador de usuário da cadeia
│   └── test-user.json     # Credenciais salvas (git ignored)
│
├── specs/                 # Arquivos de teste (ordem numérica = ordem de execução)
│   ├── 1-register.spec.ts # Teste E2E #1: Register User (CRIA usuário)
│   ├── 2-login.spec.ts    # Teste E2E #2: Login User (USA usuário)
│   ├── 3-profile.spec.ts  # Teste E2E #3: Update Profile
│   ├── 4-subscribe.spec.ts# Teste E2E #4: Subscribe Pro
│   ├── 5-upgrade.spec.ts  # Teste E2E #5: Upgrade to Ultra
│   ├── 6-downgrade.spec.ts# Teste E2E #6: Downgrade (UI)
│   └── 7-cancel.spec.ts   # Teste E2E #7: Cancel (UI)
│
├── scripts/               # Scripts utilitários
│   └── cleanup-pending-payments.ts  # Limpa cobranças órfãs no Asaas
│
├── config/                # Configurações dos testes
│   └── debug.ts           # Modo debug visual (pausas controladas)
│
├── run/                   # Scripts para executar testes (Windows .bat)
│   ├── all.bat            # Executa TODOS os testes
│   ├── all-debug.bat      # Executa TODOS com pausas visuais
│   ├── 1-register.bat     # Executa só Register
│   ├── 1-register-debug.bat
│   ├── 2-login.bat        # Executa só Login
│   ├── 2-login-debug.bat
│   ├── 3-profile.bat      # Executa só Profile
│   ├── 3-profile-debug.bat
│   ├── 4-subscribe.bat    # Executa só Subscribe
│   ├── 4-subscribe-debug.bat
│   ├── 5-upgrade.bat      # Executa só Upgrade
│   ├── 5-upgrade-debug.bat
│   ├── 6-downgrade.bat    # Executa só Downgrade
│   ├── 6-downgrade-debug.bat
│   ├── 7-cancel.bat       # Executa só Cancel
│   └── 7-cancel-debug.bat
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

## Cadeia Real de Testes

Os testes 1-5 formam uma **cadeia real** onde cada teste depende do anterior:

```
┌─────────────────────────────────────────────────────────────────┐
│  CADEIA REAL (testes 1-5)                                       │
│                                                                 │
│  1-register ──► 2-login ──► 3-profile ──► 4-subscribe ──► 5-upgrade
│       │                                                         │
│       │  Cria usuário via UI e salva credenciais                │
│       │                                                         │
│       ▼                                                         │
│  Se REGISTER falhar, TODOS os outros falham ✅                   │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│  TESTES DE UI (testes 6-7)                                      │
│                                                                 │
│  6-downgrade, 7-cancel                                          │
│  - Usam atalhos no banco para configurar ambiente               │
│  - Testam se a interface funciona                               │
│  - Aceitável porque testes 1-5 garantem fluxo real              │
└─────────────────────────────────────────────────────────────────┘
```

### Simulações justificáveis

| Simulação | Motivo | Onde |
|-----------|--------|------|
| Confirmação de email | Impossível clicar em email real | 1-register |
| Pagamento Asaas | Impossível cobrança real em teste | 4-subscribe, 5-upgrade |

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

## Executando Testes

### Scripts .bat (Windows) - Recomendado

Todos os scripts estão em `e2e/run/`:

**Modo Normal (rápido):**
```bash
e2e/run/all.bat        # Executa TODOS os testes
e2e/run/1-register.bat # Executa só Register
e2e/run/2-login.bat    # Executa só Login
e2e/run/3-profile.bat  # Executa só Profile
e2e/run/4-subscribe.bat# Executa só Subscribe
e2e/run/5-upgrade.bat  # Executa só Upgrade
e2e/run/6-downgrade.bat# Executa só Downgrade
e2e/run/7-cancel.bat   # Executa só Cancel
```

**Modo Debug Visual (com pausas):**
```bash
e2e/run/all-debug.bat        # TODOS com pausas visuais
e2e/run/1-register-debug.bat # Register com pausas
e2e/run/2-login-debug.bat    # Login com pausas
e2e/run/3-profile-debug.bat  # Profile com pausas
e2e/run/4-subscribe-debug.bat# Subscribe com pausas
e2e/run/5-upgrade-debug.bat  # Upgrade com pausas
e2e/run/6-downgrade-debug.bat# Downgrade com pausas
e2e/run/7-cancel-debug.bat   # Cancel com pausas
```

### Scripts NPM

```bash
npm run e2e          # Roda todos os testes (headless)
npm run e2e:ui       # Abre UI do Playwright
npm run e2e:headed   # Roda com browser visível
npm run e2e:debug    # Modo debug
npm run e2e:report   # Abre relatório
```

## Sistema de Relatórios HTML

Cada teste gera automaticamente um relatório HTML amigável ao final da execução.

### O que o relatório inclui

| Seção | Descrição |
|-------|-----------|
| **Header** | Nome do teste, status (passou/falhou), duração |
| **Usuário de Teste** | Email, senha, ID (com botão copiar) |
| **Asaas** | Customer ID com links diretos para o sandbox |
| **Faturas Antes** | Tabela com todas as faturas pendentes antes do teste |
| **Faturas Depois** | Tabela com faturas após o teste (para comparação) |
| **Ações Executadas** | Timeline cronológica de tudo que foi feito |
| **Notas** | Observações importantes do teste |

### Onde ficam os relatórios

```
e2e/reports/
├── 2026-01-27T10-30-45_1-register-spec-ts.html
├── 2026-01-27T10-31-20_2-login-spec-ts.html
└── ...
```

### Abertura automática

O relatório abre automaticamente no navegador quando:
- `E2E_DEBUG=true` (modo debug visual)
- `E2E_OPEN_REPORT=true` (forçar abertura)

**Via scripts .bat (recomendado):**
```bash
e2e/run/7-cancel-debug.bat  # Abre relatório automaticamente
```

**Via variável de ambiente:**
```bash
set E2E_OPEN_REPORT=true
npx playwright test e2e/specs/7-cancel.spec.ts
```

### Como usar no código

```typescript
import { test, expect } from '../fixtures/test-report';

test('meu teste', async ({ page, testReport }) => {
  // Configura usuário (aparece no relatório)
  testReport.setUser({ email: 'user@test.com', password: '123' });

  // Configura customer do Asaas (com links diretos)
  testReport.setAsaasCustomer({ id: 'cus_123456' });

  // Registra faturas antes do teste
  testReport.setInvoicesBefore([
    { id: 'pay_1', value: 49.90, status: 'PENDING', dueDate: '2026-02-01' }
  ]);

  // Adiciona ações executadas (aparecem na timeline)
  testReport.addAction('Login realizado', 'Usuário redirecionado para /home');
  testReport.addAction('Clicou em cancelar');

  // Registra faturas após o teste
  testReport.setInvoicesAfter([]);

  // Adiciona notas importantes
  testReport.addNote('Todas as cobranças foram canceladas no Asaas');
});
```

### Fixture `testReport`

A fixture é disponibilizada automaticamente quando você importa de `../fixtures/test-report`:

```typescript
// Antes (sem relatório)
import { test, expect } from '@playwright/test';

// Depois (com relatório)
import { test, expect } from '../fixtures/test-report';
```

O relatório é gerado automaticamente ao final do teste, independente de passar ou falhar.

---

## Modo Debug Visual

O modo debug adiciona **pausas controladas** nos testes para permitir visualização do que está acontecendo.

### Tempos de Pausa

| Tipo | Tempo | Quando usar |
|------|-------|-------------|
| `short` | 300ms | Após cliques, preenchimento de campos |
| `medium` | 800ms | Após navegação, mudança de página |
| `long` | 2.5s | Para ler mensagens, toasts, verificar estado |

### Como usar

**Via .bat (recomendado):**
```bash
e2e/run/2-login-debug.bat
```

**Via variável de ambiente:**
```bash
set E2E_DEBUG=true
npx playwright test --headed
```

### No código

```typescript
import { debugPause } from '../config/debug';

// Após clique
await loginPage.login(email, password);
await debugPause(page, 'short');

// Após navegação
await expectRedirect(page, '/home');
await debugPause(page, 'medium');

// Para ler toast
await expectSuccessToast(page, 'Sucesso!');
await debugPause(page, 'long');
```

### Quando desativado

Quando `E2E_DEBUG` não está definido, todas as pausas são **0ms** - sem impacto na performance.

## Ambientes

| Ambiente | Pode rodar testes? |
|----------|-------------------|
| Local/Dev | ✅ Sim |
| Staging/Homologação | ✅ Sim |
| Produção | ❌ NUNCA |

**Regra:** Testes E2E criam e modificam dados. NUNCA rodar em produção.

## Políticas de Teste

### Desktop vs Mobile

- Testes rodam apenas em viewport desktop (2560x1440)
- CSS responsivo não requer teste E2E separado
- Testar mobile separadamente **APENAS** se houver componentes ou fluxos diferentes

**Exemplos que NÃO precisam de teste mobile:**
- Layout que apenas reorganiza (grid → stack)
- Fontes/espaçamentos menores
- Mesmo fluxo, mesmos botões

**Exemplos que PRECISAM de teste mobile:**
- Menu hamburger no mobile vs sidebar no desktop
- Drawer/modal no mobile vs inline no desktop
- Fluxo em steps no mobile vs tudo visível no desktop
- Componentes condicionais (`isMobile ? <A /> : <B />`)

> **INSTRUÇÃO PARA IA:** Ao criar ou modificar componentes que tenham renderização condicional baseada em viewport/breakpoint (ex: `useMediaQuery`, `isMobile`, classes como `hidden md:block`), você DEVE notificar o desenvolvedor com a seguinte mensagem:
>
> "⚠️ **ATENÇÃO:** Este componente tem comportamento diferente no mobile vs desktop. Pode ser necessário criar um teste E2E separado para mobile. Verifique se o fluxo/interação muda significativamente."

## Plano de Testes

### Status Geral

| Teste | Arquivo | Fluxo Consolidado |
|-------|---------|-------------------|
| 1. Register User | `1-register.spec.ts` | 1 teste |
| 2. Login User | `2-login.spec.ts` | 2 testes |
| 3. Update Profile | `3-profile.spec.ts` | 1 teste |
| 4. Subscribe Pro | `4-subscribe.spec.ts` | 1 teste |
| 5. Upgrade Ultra | `5-upgrade.spec.ts` | 1 teste |
| 6. Downgrade | `6-downgrade.spec.ts` | 1 teste |
| 7. Cancel | `7-cancel.spec.ts` | 1 teste |

**Total: 8 testes (consolidados de 24)**

### Filosofia: Fluxos Consolidados

Cada teste representa um **fluxo completo** que o usuário faria, incluindo:
- Tentativas com dados inválidos → verifica erro
- Correção dos dados → verifica sucesso
- Navegação (voltar/avançar) quando aplicável

**Exemplo - Login:**
```
Email inválido → erro → corrige email, senha errada → erro → corrige senha → sucesso
```

**Benefícios:**
- Menos setup/teardown repetido
- Execução mais rápida (~2min vs ~5min)
- Mais parecido com fluxo real do usuário
- Código mais enxuto

### Descrição dos Testes

#### 1. Register User (`1-register.spec.ts`)
- Cadastro de novo usuário via UI
- Verifica criação no Supabase Auth e profile no banco
- **Salva credenciais** em `e2e/state/test-user.json`

#### 2. Login User (`2-login.spec.ts`)
**Teste 1 - Fluxo de validação e login:**
- Email inválido → erro
- Email correto, senha errada → erro
- Credenciais corretas → sucesso e redirecionamento

**Teste 2 - Proteção de rotas:**
- Acesso a rota protegida sem autenticação → redireciona para login

#### 3. Update Profile (`3-profile.spec.ts`)
**Fluxo completo:**
- Documento inválido → erro
- Nome incompleto → erro/sucesso (depende do backend)
- Dados válidos → sucesso e persistência

#### 4. Subscribe Pro (`4-subscribe.spec.ts`)
**Fluxo completo:**
- Documento inválido → erro
- Nome incompleto → erro
- Botão voltar → retorna para planos
- Dados válidos → cria assinatura real no Asaas

#### 5. Upgrade Ultra (`5-upgrade.spec.ts`)
**Fluxo completo:**
- Verifica opção de upgrade disponível
- Documento inválido → erro
- Botão voltar → retorna para planos
- Dados válidos → faz upgrade real no Asaas

#### 6. Downgrade (`6-downgrade.spec.ts`)
**Fluxo completo:**
- Verifica plano Pro disponível
- Abre modal de downgrade
- Cancela modal → permanece na página
- Reabre e confirma → agenda downgrade

#### 7. Cancel (`7-cancel.spec.ts`)
**Fluxo completo:**
- Verifica botão de cancelar visível
- Abre modal de cancelamento
- Fecha modal sem cancelar
- Reabre e confirma → cancela assinatura

### Testes Pendentes

#### Mobile: Profile (`3-profile.mobile.spec.ts`)
- **Status:** Pendente
- **Motivo:** O componente usa Drawer no mobile vs Dialog no desktop
- **Prioridade:** Média

#### 8-12. Webhooks, Trial e Payment Failure
**Não implementados** - considerados desnecessários:
- **Webhooks:** Já testados implicitamente nos testes de subscribe/upgrade
- **Trial Expiration:** Funciona automaticamente (14 dias ULTRA, depois FREE)
- **Payment Failure:** Gerenciado pelo Asaas, sistema apenas reage aos webhooks
