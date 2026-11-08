import {
  BadGatewayException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer, { type Transporter } from 'nodemailer';

export type MensagemEmail = {
  para: string;
  assunto: string;
  html: string;
  texto: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly transporte: Transporter | null;
  private readonly remetente: string;
  private readonly teste: boolean;

  constructor(config: ConfigService) {
    const usuario = config.get<string>('GMAIL_USER');
    const senha = config.get<string>('GMAIL_APP_PASSWORD')?.replace(/\s/g, '');
    this.remetente = usuario ?? '';
    this.teste = config.get<string>('NODE_ENV') === 'test';
    this.transporte =
      this.teste || !usuario || !senha
        ? null
        : nodemailer.createTransport({
            service: 'gmail',
            auth: { user: usuario, pass: senha },
          });
  }

  async enviar(mensagem: MensagemEmail) {
    if (this.teste) return;
    if (!this.transporte) {
      throw new ServiceUnavailableException('Envio de e-mail não configurado.');
    }
    try {
      await this.transporte.sendMail({
        from: this.remetente,
        to: mensagem.para,
        subject: mensagem.assunto,
        html: mensagem.html,
        text: mensagem.texto,
      });
    } catch (erro) {
      const detalhe = erro instanceof Error ? erro.message : String(erro);
      this.logger.error(`Falha ao enviar e-mail para ${mensagem.para}: ${detalhe}`);
      throw new BadGatewayException('Não foi possível enviar o e-mail.');
    }
  }
}
