import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { ZodValidationException } from 'nestjs-zod';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Erro interno.';

    if (exception instanceof ZodValidationException) {
      status = exception.getStatus();
      const zodError = exception.getZodError();
      if (
        zodError &&
        typeof zodError === 'object' &&
        'issues' in zodError &&
        Array.isArray((zodError as { issues: unknown }).issues)
      ) {
        message = (zodError as { issues: { message: string }[] }).issues.map(
          (issue) => issue.message,
        );
      } else {
        message = 'Dados inválidos.';
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (typeof body === 'object' && body && 'message' in body) {
        message = (body as { message: string | string[] }).message;
      }
    } else {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
