import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { cleanupOpenApiDoc } from 'nestjs-zod';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const config = app.get(ConfigService);
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: config.getOrThrow<string>('FRONTEND_ORIGIN'),
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Gestão Imobiliária')
    .setDescription('API do sistema de gestão imobiliária e contratos')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, cleanupOpenApiDoc(document));

  await app.listen(config.getOrThrow<number>('PORT'));
}

await bootstrap();
