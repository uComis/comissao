const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';

export interface AsaasCustomerInput {
  name: string;
  email: string;
  cpfCnpj?: string;
  phone?: string;
  mobilePhone?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
  province?: string;
  postalCode?: string;
  externalReference?: string;
  notificationDisabled?: boolean;
}

export interface AsaasSubscriptionInput {
  customer: string;
  billingType: 'BOLETO' | 'CREDIT_CARD' | 'PIX' | 'UNDEFINED';
  value: number;
  nextDueDate: string;
  cycle: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY' | 'ANNUALLY';
  description?: string;
  externalReference?: string;
  discount?: {
    value: number;
    dueDateLimitDays: number;
    type: 'FIXED' | 'PERCENTAGE';
  };
  fine?: {
    value: number;
  };
  interest?: {
    value: number;
  };
}

export interface AsaasCustomer {
  id: string;
  name: string;
  email: string;
  cpfCnpj?: string;
  deleted?: boolean;
  externalReference?: string;
  // Adicione outros campos se necessário
}

export interface AsaasSubscription {
  id: string;
  customer: string;
  value: number;
  status: string;
  invoiceUrl?: string;
  lastInvoiceUrl?: string;
  externalReference?: string;
}

export interface AsaasListResponse<T> {
  object: string;
  hasMore: boolean;
  totalCount: number;
  limit: number;
  offset: number;
  data: T[];
}

export interface AsaasPayment {
  id: string;
  customer: string;
  subscription?: string;
  installment?: string;
  paymentLink?: string;
  dueDate: string;
  value: number;
  netValue: number;
  billingType: string;
  status: string;
  invoiceUrl: string;
  invoiceNumber: string;
  description?: string;
  externalReference?: string;
  deleted: boolean;
}

export class AsaasService {
  private static getApiKey() {
    let apiKey = process.env.ASAAS_API_KEY;
    
    if (!apiKey) {
      console.error('ERRO: ASAAS_API_KEY não está definida no .env');
      throw new Error('Configuração de API do Asaas ausente.');
    }

    // Remove aspas caso o processo as tenha lido como parte da string
    apiKey = apiKey.replace(/^["']|["']$/g, '');
    
    // TRATAMENTO PARA O SÍMBOLO $:
    // Se a chave vier com [S] (placeholder para evitar erro do Next.js), trocamos de volta para $
    apiKey = apiKey.replaceAll('[S]', '$');
    
    return apiKey;
  }

  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${ASAAS_API_URL}${endpoint}`;
    const apiKey = this.getApiKey();

    const response = await fetch(url, {
      ...options,
      headers: {
        'access_token': apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Asaas API Error Details:', {
        status: response.status,
        endpoint,
        error: data
      });
      throw new Error(data.errors?.[0]?.description || 'Erro na comunicação com Asaas');
    }

    return data as T;
  }

  /**
   * Cria um novo cliente no Asaas.
   */
  static async createCustomer(input: AsaasCustomerInput): Promise<AsaasCustomer> {
    return this.request<AsaasCustomer>('/customers', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * Atualiza um cliente no Asaas.
   */
  static async updateCustomer(customerId: string, input: Partial<AsaasCustomerInput>) {
    return this.request<AsaasCustomer>(`/customers/${customerId}`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  /**
   * Busca um cliente pelo email.
   */
  static async findCustomerByEmail(email: string): Promise<AsaasCustomer | null> {
    const data = await this.request<AsaasListResponse<AsaasCustomer>>(`/customers?email=${encodeURIComponent(email)}`, {
      method: 'GET',
    });
    return data.data?.[0] || null;
  }

  /**
   * Busca um cliente pelo CPF/CNPJ.
   */
  static async findCustomerByCpfCnpj(cpfCnpj: string): Promise<AsaasCustomer | null> {
    const cleanCpfCnpj = cpfCnpj.replace(/\D/g, '');
    const data = await this.request<AsaasListResponse<AsaasCustomer>>(`/customers?cpfCnpj=${cleanCpfCnpj}`, {
      method: 'GET',
    });
    return data.data?.[0] || null;
  }

  /**
   * Busca um cliente pelo ID.
   */
  static async getCustomer(customerId: string): Promise<AsaasCustomer | null> {
    try {
      return await this.request<AsaasCustomer>(`/customers/${customerId}`, {
        method: 'GET',
      });
    } catch (err) {
      console.error(`Error fetching customer ${customerId}:`, err);
      return null;
    }
  }

  /**
   * Cria uma nova assinatura.
   */
  static async createSubscription(input: AsaasSubscriptionInput): Promise<AsaasSubscription> {
    const response = await this.request<AsaasSubscription>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    console.log('Asaas Subscription Response:', JSON.stringify(response, null, 2));
    return response;
  }

  /**
   * Busca assinaturas de um cliente.
   */
  static async getCustomerSubscriptions(customerId: string): Promise<AsaasListResponse<AsaasSubscription>> {
    return this.request<AsaasListResponse<AsaasSubscription>>(`/subscriptions?customer=${customerId}`, {
      method: 'GET',
    });
  }

  /**
   * Busca as cobranças de uma assinatura.
   */
  static async getSubscriptionPayments(subscriptionId: string): Promise<AsaasListResponse<AsaasPayment>> {
    return this.request<AsaasListResponse<AsaasPayment>>(`/payments?subscription=${subscriptionId}`, {
      method: 'GET',
    });
  }

  /**
   * Busca todas as cobranças de um cliente.
   */
  static async getCustomerPayments(customerId: string): Promise<AsaasListResponse<AsaasPayment>> {
    return this.request<AsaasListResponse<AsaasPayment>>(`/payments?customer=${customerId}`, {
      method: 'GET',
    });
  }

  /**
   * Busca cobranças pendentes de um cliente.
   */
  static async getCustomerPendingPayments(customerId: string): Promise<AsaasListResponse<AsaasPayment>> {
    return this.request<AsaasListResponse<AsaasPayment>>(`/payments?customer=${customerId}&status=PENDING`, {
      method: 'GET',
    });
  }

  /**
   * Busca uma cobrança pelo ID.
   */
  static async getPayment(paymentId: string): Promise<AsaasPayment> {
    return this.request<AsaasPayment>(`/payments/${paymentId}`, {
      method: 'GET',
    });
  }

  /**
   * Cancela uma assinatura.
   */
  static async cancelSubscription(subscriptionId: string): Promise<AsaasSubscription> {
    return this.request<AsaasSubscription>(`/subscriptions/${subscriptionId}`, {
      method: 'DELETE',
    });
  }
}
