import * as fs from 'fs'
import * as path from 'path'

/**
 * Gerenciador de estado compartilhado entre testes E2E
 *
 * Este módulo garante que os testes formem uma CADEIA REAL:
 * Register → Login → Profile → Subscribe → Upgrade
 *
 * Se Register não rodar primeiro, os outros testes FALHAM.
 * Isso garante que testamos o fluxo completo do usuário.
 */

const STATE_FILE = path.join(__dirname, 'test-user.json')

export interface SharedTestUser {
  id: string
  email: string
  password: string
  plan?: 'free' | 'pro' | 'ultra'
  createdAt: string
}

/**
 * Salva as credenciais do usuário criado pelo teste de Register
 * APENAS o teste de Register deve chamar esta função
 */
export function saveTestUser(user: Omit<SharedTestUser, 'createdAt'>): void {
  const data: SharedTestUser = {
    ...user,
    createdAt: new Date().toISOString(),
  }

  fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2))
  console.log(`[SharedUser] Usuário salvo: ${user.email}`)
}

/**
 * Atualiza o plano do usuário compartilhado
 * Chamado após Subscribe ou Upgrade
 */
export function updateTestUserPlan(plan: 'free' | 'pro' | 'ultra'): void {
  const user = getTestUser()
  if (user) {
    user.plan = plan
    fs.writeFileSync(STATE_FILE, JSON.stringify(user, null, 2))
    console.log(`[SharedUser] Plano atualizado para: ${plan}`)
  }
}

/**
 * Obtém as credenciais do usuário criado pelo teste de Register
 * Se não existir, FALHA - significa que Register não rodou
 */
export function getTestUser(): SharedTestUser | null {
  if (!fs.existsSync(STATE_FILE)) {
    return null
  }

  try {
    const data = fs.readFileSync(STATE_FILE, 'utf-8')
    return JSON.parse(data) as SharedTestUser
  } catch {
    return null
  }
}

/**
 * Obtém o usuário ou lança erro se não existir
 * Use esta função nos testes que DEPENDEM do Register
 */
export function requireTestUser(): SharedTestUser {
  const user = getTestUser()

  if (!user) {
    throw new Error(
      '\n\n' +
      '❌ ERRO: Nenhum usuário de teste encontrado!\n\n' +
      'Os testes E2E formam uma CADEIA REAL:\n' +
      '  Register → Login → Profile → Subscribe → Upgrade\n\n' +
      'O teste de REGISTER deve rodar PRIMEIRO para criar o usuário.\n' +
      'Execute: npm run e2e\n' +
      '(Os testes rodam em ordem alfabética/configurada)\n\n'
    )
  }

  // Verifica se o usuário não é muito antigo (mais de 1 hora)
  const createdAt = new Date(user.createdAt)
  const now = new Date()
  const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

  if (hoursDiff > 1) {
    console.log(`[SharedUser] ⚠️ Usuário tem ${hoursDiff.toFixed(1)}h - considere rodar Register novamente`)
  }

  console.log(`[SharedUser] Usando usuário: ${user.email} (plano: ${user.plan || 'free'})`)
  return user
}

/**
 * Limpa o estado do usuário compartilhado
 * Chamado antes de uma nova execução completa
 */
export function clearTestUser(): void {
  if (fs.existsSync(STATE_FILE)) {
    fs.unlinkSync(STATE_FILE)
    console.log('[SharedUser] Estado limpo')
  }
}

/**
 * Verifica se existe um usuário válido
 */
export function hasValidTestUser(): boolean {
  const user = getTestUser()
  if (!user) return false

  // Considera válido se foi criado há menos de 1 hora
  const createdAt = new Date(user.createdAt)
  const now = new Date()
  const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

  return hoursDiff < 1
}
