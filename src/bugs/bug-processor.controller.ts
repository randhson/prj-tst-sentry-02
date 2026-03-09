import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';

import { AutomationPayload, BugProcessorService } from './bug-processor.service';
import { BugMonitorService } from './bug-monitor.service';

@ApiTags('bugs')
@Controller('api')
export class BugProcessorController {
  constructor(
    private readonly processorService: BugProcessorService,
    private readonly monitorService: BugMonitorService,
  ) {}

  /**
   * BUG-001 — Dispara quando metadata.source está ausente no payload.
   * A app retorna status "degraded" mas segue funcionando normalmente.
   */
  @Post('process-automation')
  @ApiOperation({
    summary: '[BUG-001] Processa payload de automação',
    description:
      'Envia sem o campo `metadata.source` para disparar o BUG-001 no Sentry. ' +
      'A app retorna status degraded mas continua operacional.',
  })
  @ApiBody({
    schema: {
      example: {
        workflowId: 'wf-abc123',
        taskName: 'send-alert',
        triggeredBy: 'n8n',
        metadata: {},
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Processado (ok ou degraded)' })
  processAutomation(@Body() payload: AutomationPayload) {
    return this.processorService.safeProcess(payload);
  }

  /**
   * BUG-001 — Atalho GET para facilitar testes rápidos via browser ou curl.
   */
  @Get('process-automation')
  @ApiOperation({
    summary: '[BUG-001] Dispara BUG-001 via GET (teste rápido)',
    description: 'Sempre dispara o BUG-001 pois envia metadata vazio.',
  })
  @ApiQuery({ name: 'workflowId', required: false, example: 'wf-test-001' })
  @ApiQuery({ name: 'triggeredBy', required: false, example: 'n8n' })
  processAutomationGet(
    @Query('workflowId') workflowId?: string,
    @Query('triggeredBy') triggeredBy?: string,
  ) {
    return this.processorService.safeProcess({
      workflowId: workflowId ?? 'wf-test-001',
      taskName: 'triggered-via-get',
      triggeredBy: triggeredBy ?? 'manual',
      metadata: {}, // source ausente → dispara BUG-001
    });
  }

  /**
   * BUG-002 — Força uma verificação imediata da fila de agentes.
   * Sem isso precisaria aguardar o intervalo do monitor em background.
   */
  @Get('trigger-monitor')
  @ApiOperation({
    summary: '[BUG-002] Força verificação da fila de agentes (trigger manual)',
    description:
      'Dispara o BUG-002 imediatamente sem esperar o intervalo do monitor. ' +
      'Se pendingJobs > threshold ou failedJobs > 0, o bug é disparado e enviado ao Sentry.',
  })
  @ApiResponse({ status: 200, description: 'Resultado da verificação' })
  triggerMonitor() {
    return this.monitorService.triggerCheck();
  }
}
