import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as Sentry from '@sentry/node';

interface QueueMetrics {
  pendingJobs: number;
  failedJobs: number;
  processedToday: number;
  threshold: number;
}

interface AlertHandler {
  notify: (message: string) => void;
}

@Injectable()
export class BugMonitorService implements OnModuleInit {
  private readonly logger = new Logger(BugMonitorService.name);
  private checkCount = 0;

  onModuleInit() {
    const intervalMs = parseInt(process.env.MONITOR_INTERVAL_MS ?? '60000', 10);
    this.logger.log(`Agent queue monitor iniciado — intervalo: ${intervalMs}ms`);
    setInterval(() => this.checkAgentQueue(), intervalMs);
  }

  private checkAgentQueue(): void {
    this.checkCount++;
    const metrics = this.getQueueMetrics();

    this.logger.log(
      `[Monitor #${this.checkCount}] pending=${metrics.pendingJobs} ` +
        `failed=${metrics.failedJobs} threshold=${metrics.threshold}`,
    );

    try {
      if (metrics.pendingJobs > metrics.threshold || metrics.failedJobs > 0) {
        // BUG-002: handler nunca é instanciado — sempre undefined
        // Simula o cenário real onde o alertHandler depende de uma config
        // externa (Slack/PagerDuty) que não foi carregada corretamente
        const alertHandler: AlertHandler = this.resolveAlertHandler();
        alertHandler.notify(
          `Queue overflow: ${metrics.pendingJobs} pending, ${metrics.failedJobs} failed`,
        );
      }
    } catch (err) {
      Sentry.withScope((scope) => {
        scope.setTag('bug_id', 'BUG-002');
        scope.setTag('component', 'agent-queue-monitor');
        scope.setTag('severity', 'medium');
        scope.setTag('check_count', String(this.checkCount));
        scope.setContext('queue_metrics', metrics as unknown as Record<string, unknown>);
        scope.setContext('monitor', {
          checkCount: this.checkCount,
          intervalMs: process.env.MONITOR_INTERVAL_MS ?? '60000',
          alertHandlerResolved: false,
        });
        Sentry.captureException(err);
      });

      this.logger.error(`BUG-002 capturado e enviado ao Sentry: ${(err as Error).message}`);
    }
  }

  private getQueueMetrics(): QueueMetrics {
    // Simula variação realista de carga na fila
    return {
      pendingJobs: Math.floor(Math.random() * 20),
      failedJobs: Math.random() > 0.4 ? Math.floor(Math.random() * 5) : 0,
      processedToday: Math.floor(Math.random() * 200),
      threshold: 10,
    };
  }

  private resolveAlertHandler(): AlertHandler {
    // BUG-002: retorna undefined intencionalmente
    // Simula falha ao carregar handler de alerta externo
    return undefined as unknown as AlertHandler;
  }

  // Endpoint de trigger manual para não precisar esperar o intervalo
  triggerCheck(): Record<string, unknown> {
    const metrics = this.getQueueMetrics();
    this.logger.log('[Monitor] Check manual disparado');

    try {
      if (metrics.pendingJobs > metrics.threshold || metrics.failedJobs > 0) {
        const alertHandler: AlertHandler = this.resolveAlertHandler();
        alertHandler.notify('manual trigger check');
      }

      return { triggered: true, metrics, bugFired: false };
    } catch (err) {
      Sentry.withScope((scope) => {
        scope.setTag('bug_id', 'BUG-002');
        scope.setTag('component', 'agent-queue-monitor');
        scope.setTag('severity', 'medium');
        scope.setTag('trigger', 'manual');
        scope.setContext('queue_metrics', metrics as unknown as Record<string, unknown>);
        Sentry.captureException(err);
      });

      this.logger.error(`BUG-002 (manual) enviado ao Sentry: ${(err as Error).message}`);
      return { triggered: true, metrics, bugFired: true, sentryReported: true };
    }
  }
}
