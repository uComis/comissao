import { test as base } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';

/**
 * Sistema de Relatório de Testes E2E
 *
 * Gera um HTML amigável ao final de cada teste com:
 * - Dados do usuário de teste
 * - Informações do Asaas (customer, faturas)
 * - Ações executadas
 * - Links para verificação manual
 */

// Tipos
interface TestUser {
  email: string;
  password: string;
  id?: string;
}

interface AsaasCustomer {
  id: string;
  name?: string;
}

interface AsaasInvoice {
  id: string;
  value: number;
  status: string;
  dueDate: string;
  url?: string;
  description?: string;
}

interface TestAction {
  timestamp: Date;
  description: string;
  details?: string;
}

interface ReportData {
  testName: string;
  testFile: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'passed' | 'failed';
  error?: string;
  user?: TestUser;
  asaasCustomer?: AsaasCustomer;
  invoicesBefore: AsaasInvoice[];
  invoicesAfter: AsaasInvoice[];
  actions: TestAction[];
  notes: string[];
}

export class TestReport {
  private data: ReportData;
  private reportsDir: string;

  constructor(testName: string, testFile: string) {
    this.data = {
      testName,
      testFile,
      startTime: new Date(),
      status: 'running',
      invoicesBefore: [],
      invoicesAfter: [],
      actions: [],
      notes: [],
    };
    this.reportsDir = path.join(process.cwd(), 'e2e', 'reports');

    // Garante que a pasta existe
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  // Adiciona usuário de teste
  setUser(user: TestUser) {
    this.data.user = user;
    this.addAction('Usuário de teste configurado', `Email: ${user.email}`);
  }

  // Adiciona customer do Asaas
  setAsaasCustomer(customer: AsaasCustomer) {
    this.data.asaasCustomer = customer;
    this.addAction('Customer Asaas identificado', `ID: ${customer.id}`);
  }

  // Adiciona faturas (antes ou depois)
  setInvoicesBefore(invoices: AsaasInvoice[]) {
    this.data.invoicesBefore = invoices;
    this.addAction(`Estado inicial: ${invoices.length} fatura(s) pendente(s)`);
  }

  setInvoicesAfter(invoices: AsaasInvoice[]) {
    this.data.invoicesAfter = invoices;
    this.addAction(`Estado final: ${invoices.length} fatura(s) pendente(s)`);
  }

  // Adiciona uma ação executada
  addAction(description: string, details?: string) {
    this.data.actions.push({
      timestamp: new Date(),
      description,
      details,
    });
  }

  // Adiciona nota/observação
  addNote(note: string) {
    this.data.notes.push(note);
  }

  // Finaliza o relatório
  finish(status: 'passed' | 'failed', error?: string) {
    this.data.endTime = new Date();
    this.data.status = status;
    this.data.error = error;
    this.generateHtml();
  }

  // Gera o HTML
  private generateHtml() {
    const timestamp = this.data.startTime.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const safeName = this.data.testFile.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 80);
    const filename = `${timestamp}_${safeName}.html`;
    const filepath = path.join(this.reportsDir, filename);

    const html = this.buildHtml();
    fs.writeFileSync(filepath, html, 'utf-8');

    console.log(`\n📋 Relatório gerado: e2e/reports/${filename}`);

    // Abre automaticamente se E2E_OPEN_REPORT=true ou em modo debug
    const shouldOpen = process.env.E2E_OPEN_REPORT === 'true' || process.env.E2E_DEBUG === 'true';
    if (shouldOpen) {
      this.openReport(filepath);
    }
  }

  // Abre o relatório no navegador padrão
  private openReport(filepath: string) {
    const platform = process.platform;
    let command: string;

    if (platform === 'win32') {
      command = `start "" "${filepath}"`;
    } else if (platform === 'darwin') {
      command = `open "${filepath}"`;
    } else {
      command = `xdg-open "${filepath}"`;
    }

    exec(command, (error) => {
      if (error) {
        console.log(`⚠️ Não foi possível abrir o relatório automaticamente`);
      }
    });
  }

  private buildHtml(): string {
    const statusEmoji = this.data.status === 'passed' ? '✅' : '❌';
    const statusColor = this.data.status === 'passed' ? '#22c55e' : '#ef4444';
    const statusText = this.data.status === 'passed' ? 'PASSOU' : 'FALHOU';

    const duration = this.data.endTime
      ? ((this.data.endTime.getTime() - this.data.startTime.getTime()) / 1000).toFixed(1)
      : '?';

    const asaasBaseUrl = 'https://sandbox.asaas.com';

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Relatório: ${this.data.testName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f5f5f5;
      padding: 20px;
      line-height: 1.6;
    }
    .container { max-width: 900px; margin: 0 auto; }
    .card {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 20px;
      overflow: hidden;
    }
    .card-header {
      padding: 16px 20px;
      border-bottom: 1px solid #eee;
      font-weight: 600;
      font-size: 14px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .card-body { padding: 20px; }
    .header-card {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white;
    }
    .header-card .card-body { padding: 30px; }
    .test-name { font-size: 24px; font-weight: 700; margin-bottom: 8px; }
    .test-file { opacity: 0.7; font-size: 14px; }
    .status-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 20px;
      font-weight: 600;
      font-size: 14px;
      margin-top: 16px;
    }
    .meta-row {
      display: flex;
      gap: 30px;
      margin-top: 20px;
      font-size: 14px;
      opacity: 0.8;
    }
    .info-grid {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 12px;
      font-size: 14px;
    }
    .info-label { color: #666; font-weight: 500; }
    .info-value { color: #1a1a1a; font-family: monospace; }
    .copy-btn {
      background: #f0f0f0;
      border: none;
      padding: 4px 8px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
      margin-left: 8px;
    }
    .copy-btn:hover { background: #e0e0e0; }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      border-radius: 6px;
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      transition: all 0.2s;
    }
    .btn-primary { background: #3b82f6; color: white; }
    .btn-primary:hover { background: #2563eb; }
    .btn-secondary { background: #f0f0f0; color: #333; }
    .btn-secondary:hover { background: #e0e0e0; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th, td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    th {
      background: #f8f8f8;
      font-weight: 600;
      color: #666;
      font-size: 12px;
      text-transform: uppercase;
    }
    .status-pending { color: #f59e0b; }
    .status-paid { color: #22c55e; }
    .status-canceled { color: #ef4444; }
    .timeline {
      position: relative;
      padding-left: 24px;
    }
    .timeline::before {
      content: '';
      position: absolute;
      left: 7px;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #e0e0e0;
    }
    .timeline-item {
      position: relative;
      padding-bottom: 16px;
    }
    .timeline-item::before {
      content: '';
      position: absolute;
      left: -20px;
      top: 6px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #3b82f6;
    }
    .timeline-time {
      font-size: 11px;
      color: #999;
      font-family: monospace;
    }
    .timeline-desc { font-size: 14px; margin-top: 2px; }
    .timeline-details { font-size: 12px; color: #666; margin-top: 2px; }
    .error-box {
      background: #fef2f2;
      border: 1px solid #fecaca;
      border-radius: 8px;
      padding: 16px;
      color: #dc2626;
      font-family: monospace;
      font-size: 13px;
      white-space: pre-wrap;
    }
    .note {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      margin-bottom: 8px;
      font-size: 13px;
    }
    .empty-state {
      text-align: center;
      padding: 30px;
      color: #999;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="card header-card">
      <div class="card-body">
        <div class="test-name">${this.data.testName}</div>
        <div class="test-file">${this.data.testFile}</div>
        <div class="status-badge" style="background: ${statusColor}">
          ${statusEmoji} ${statusText}
        </div>
        <div class="meta-row">
          <span>📅 ${this.formatDate(this.data.startTime)}</span>
          <span>⏱️ ${duration}s</span>
        </div>
      </div>
    </div>

    ${this.data.error ? `
    <!-- Erro -->
    <div class="card">
      <div class="card-header">❌ Erro</div>
      <div class="card-body">
        <div class="error-box">${this.escapeHtml(this.data.error)}</div>
      </div>
    </div>
    ` : ''}

    <!-- Usuário de Teste -->
    ${this.data.user ? `
    <div class="card">
      <div class="card-header">👤 Usuário de Teste</div>
      <div class="card-body">
        <div class="info-grid">
          <div class="info-label">Email:</div>
          <div class="info-value">
            ${this.data.user.email}
            <button class="copy-btn" onclick="navigator.clipboard.writeText('${this.data.user.email}')">Copiar</button>
          </div>
          <div class="info-label">Senha:</div>
          <div class="info-value">
            ${this.data.user.password}
            <button class="copy-btn" onclick="navigator.clipboard.writeText('${this.data.user.password}')">Copiar</button>
          </div>
          ${this.data.user.id ? `
          <div class="info-label">User ID:</div>
          <div class="info-value">${this.data.user.id}</div>
          ` : ''}
        </div>
        <div style="margin-top: 16px;">
          <a href="http://localhost:4000/login" target="_blank" class="btn btn-primary">
            🔐 Fazer Login
          </a>
        </div>
      </div>
    </div>
    ` : ''}

    <!-- Asaas -->
    ${this.data.asaasCustomer ? `
    <div class="card">
      <div class="card-header">💳 Asaas (Sandbox)</div>
      <div class="card-body">
        <div class="info-grid">
          <div class="info-label">Customer ID:</div>
          <div class="info-value">
            ${this.data.asaasCustomer.id}
            <button class="copy-btn" onclick="navigator.clipboard.writeText('${this.data.asaasCustomer.id}')">Copiar</button>
          </div>
        </div>
        <div style="margin-top: 16px; display: flex; gap: 8px;">
          <a href="${asaasBaseUrl}/customers/${this.data.asaasCustomer.id}" target="_blank" class="btn btn-secondary">
            👤 Ver Cliente
          </a>
          <a href="${asaasBaseUrl}/payment/list?customerPublicId=${this.data.asaasCustomer.id}" target="_blank" class="btn btn-secondary">
            📄 Ver Cobranças
          </a>
        </div>
      </div>
    </div>
    ` : ''}

    <!-- Faturas Antes -->
    ${this.data.invoicesBefore.length > 0 ? `
    <div class="card">
      <div class="card-header">📋 Faturas (Antes do Teste)</div>
      <div class="card-body">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${this.data.invoicesBefore.map(inv => `
            <tr>
              <td style="font-family: monospace; font-size: 11px;">${inv.id}</td>
              <td>${inv.description || '-'}</td>
              <td>R$ ${inv.value.toFixed(2)}</td>
              <td>${inv.dueDate}</td>
              <td class="status-${inv.status.toLowerCase()}">${this.formatStatus(inv.status)}</td>
              <td>
                ${inv.url ? `<a href="${inv.url}" target="_blank" class="btn btn-secondary" style="padding: 4px 8px;">Ver</a>` : '-'}
              </td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
    ` : ''}

    <!-- Faturas Depois -->
    ${this.data.invoicesAfter.length > 0 ? `
    <div class="card">
      <div class="card-header">📋 Faturas (Após o Teste)</div>
      <div class="card-body">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Vencimento</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            ${this.data.invoicesAfter.map(inv => `
            <tr>
              <td style="font-family: monospace; font-size: 11px;">${inv.id}</td>
              <td>${inv.description || '-'}</td>
              <td>R$ ${inv.value.toFixed(2)}</td>
              <td>${inv.dueDate}</td>
              <td class="status-${inv.status.toLowerCase()}">${this.formatStatus(inv.status)}</td>
              <td>
                ${inv.url ? `<a href="${inv.url}" target="_blank" class="btn btn-secondary" style="padding: 4px 8px;">Ver</a>` : '-'}
              </td>
            </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
    ` : ''}

    <!-- Ações Executadas -->
    <div class="card">
      <div class="card-header">📝 Ações Executadas</div>
      <div class="card-body">
        ${this.data.actions.length > 0 ? `
        <div class="timeline">
          ${this.data.actions.map(action => `
          <div class="timeline-item">
            <div class="timeline-time">${this.formatTime(action.timestamp)}</div>
            <div class="timeline-desc">${action.description}</div>
            ${action.details ? `<div class="timeline-details">${action.details}</div>` : ''}
          </div>
          `).join('')}
        </div>
        ` : `
        <div class="empty-state">Nenhuma ação registrada</div>
        `}
      </div>
    </div>

    <!-- Notas -->
    ${this.data.notes.length > 0 ? `
    <div class="card">
      <div class="card-header">📌 Notas</div>
      <div class="card-body">
        ${this.data.notes.map(note => `<div class="note">${note}</div>`).join('')}
      </div>
    </div>
    ` : ''}

  </div>
</body>
</html>`;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  private formatTime(date: Date): string {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  private formatStatus(status: string): string {
    const map: Record<string, string> = {
      'PENDING': '⏳ Pendente',
      'OVERDUE': '⚠️ Vencida',
      'RECEIVED': '✅ Paga',
      'CONFIRMED': '✅ Confirmada',
      'CANCELED': '❌ Cancelada',
    };
    return map[status] || status;
  }

  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}

// Fixture do Playwright
type TestReportFixture = {
  testReport: TestReport;
};

export const test = base.extend<TestReportFixture>({
  testReport: async ({ }, use, testInfo) => {
    const report = new TestReport(testInfo.title, testInfo.titlePath.join(' > '));

    await use(report);

    // Após o teste, finaliza o relatório
    const status = testInfo.status === 'passed' ? 'passed' : 'failed';
    const error = testInfo.error?.message;
    report.finish(status, error);
  },
});

export { expect } from '@playwright/test';
