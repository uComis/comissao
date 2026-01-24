import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export interface SendTemplatedEmailParams {
  to: string | string[];
  subject: string;
  react: React.ReactElement;
  from?: string;
}

/**
 * Serviço de email usando Resend
 * Responsável apenas pela integração com a API, sem regras de negócio
 */
export class EmailService {
  private static readonly DEFAULT_FROM = `uComis <${process.env.UCOMIS_EMAIL || 'contato@ucomis.com'}>`;

  /**
   * Envia email HTML simples
   */
  static async sendEmail(params: SendEmailParams): Promise<{ id: string }> {
    const { to, subject, html, from = this.DEFAULT_FROM } = params;

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });

    if (error) {
      throw new Error(`Erro ao enviar email: ${error.message}`);
    }

    return { id: data?.id || '' };
  }

  /**
   * Envia email usando template React
   */
  static async sendTemplatedEmail(params: SendTemplatedEmailParams): Promise<{ id: string }> {
    const { to, subject, react, from = this.DEFAULT_FROM } = params;

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      react,
    });

    if (error) {
      throw new Error(`Erro ao enviar email: ${error.message}`);
    }

    return { id: data?.id || '' };
  }
}
