import { mkdirSync } from 'node:fs';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { Injectable, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ArquivoAdapter implements OnModuleInit {
  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    mkdirSync(this.diretorio(), { recursive: true });
  }

  diretorio() {
    return join(process.cwd(), this.config.getOrThrow<string>('UPLOAD_DIR'));
  }

  caminho(chaveArquivo: string) {
    return join(this.diretorio(), chaveArquivo);
  }

  async remover(chaveArquivo: string) {
    await rm(this.caminho(chaveArquivo), { force: true });
  }
}
