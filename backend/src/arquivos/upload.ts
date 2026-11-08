import { randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { extname, join } from 'node:path';
import { BadRequestException } from '@nestjs/common';
import type { Request } from 'express';
import { diskStorage } from 'multer';

export const EXTENSOES_IMAGEM = ['.jpg', '.jpeg', '.png', '.webp'];
export const EXTENSOES_DOCUMENTO = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
export const TIPOS_IMAGEM = ['image/jpeg', 'image/png', 'image/webp'];
export const TIPOS_DOCUMENTO = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export function destinoUpload(permitidas: string[]) {
  return diskStorage({
    destination: (_req, _file, callback) => {
      const diretorio = join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
      mkdirSync(diretorio, { recursive: true });
      callback(null, diretorio);
    },
    filename: (_req, file, callback) => {
      const extensao = extname(file.originalname).toLowerCase();
      callback(null, `${randomUUID()}${permitidas.includes(extensao) ? extensao : ''}`);
    },
  });
}

export function aceitarArquivo(tipos: string[], mensagem: string) {
  return (
    _req: Request,
    file: { mimetype: string },
    callback: (error: Error | null, aceito: boolean) => void,
  ) => {
    if (!tipos.includes(file.mimetype)) {
      callback(new BadRequestException(mensagem), false);
      return;
    }
    callback(null, true);
  };
}
