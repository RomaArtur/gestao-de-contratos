import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { utilities as nestWinstonUtilities, WinstonModule } from 'nest-winston';
import { ZodValidationPipe } from 'nestjs-zod';
import * as winston from 'winston';
import { AuditModule } from './audit/audit.module.js';
import { AuthModule } from './auth/auth.module.js';
import { ArquivosModule } from './arquivos/arquivos.module.js';
import { ClienteModule } from './clientes/cliente.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { CryptoModule } from './common/crypto/crypto.module.js';
import { validateEnv } from './config/env.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthModule } from './health/health.module.js';
import { ImovelModule } from './imoveis/imovel.module.js';
import { ProprietarioModule } from './proprietarios/proprietario.module.js';
import { ContratoModule } from './contratos/contrato.module.js';
import { PropostaModule } from './propostas/proposta.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonUtilities.format.nestLike('GestaoApi', {
              colors: true,
              prettyPrint: true,
            }),
          ),
        }),
      ],
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ name: 'default', ttl: 60_000, limit: 100 }],
    }),
    DatabaseModule,
    AuditModule,
    CryptoModule,
    ArquivosModule,
    AuthModule,
    ProprietarioModule,
    ClienteModule,
    ImovelModule,
    PropostaModule,
    ContratoModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
