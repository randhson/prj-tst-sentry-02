import { ArgumentsHost, Catch, HttpException, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import * as Sentry from '@sentry/node';

@Catch()
export class SentryFilter extends BaseExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Captura apenas erros de servidor (5xx) — ignora erros de cliente (4xx)
    if (status >= 500) {
      Sentry.captureException(exception);
    }

    super.catch(exception, host);
  }
}
