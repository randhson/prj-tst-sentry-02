import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AppService, HealthStatus, AppInfo } from './app.service';

@ApiTags('status')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check da aplicação' })
  @ApiResponse({ status: 200, description: 'Aplicação funcionando corretamente' })
  getHealth(): HealthStatus {
    return this.appService.getHealth();
  }

  @Get('info')
  @ApiOperation({ summary: 'Informações e status das integrações' })
  @ApiResponse({ status: 200, description: 'Informações da aplicação e integrações' })
  getInfo(): AppInfo {
    return this.appService.getInfo();
  }

  @Get('debug/sentry-test')
  @ApiOperation({
    summary: 'Dispara um erro de teste para validar integração com Sentry',
  })
  @ApiResponse({ status: 500, description: 'Erro intencional enviado ao Sentry' })
  sentryTest(): never {
    throw new Error('[TESTE] Erro intencional — integração Sentry funcionando!');
  }
}
