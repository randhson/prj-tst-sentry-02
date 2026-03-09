import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/node';

export interface AutomationPayload {
  workflowId?: string;
  taskName?: string;
  triggeredBy?: string;
  metadata?: Record<string, unknown>;
}

export interface ProcessResult {
  status: 'ok' | 'degraded';
  workflowId: string;
  normalizedTask?: string;
  message?: string;
}

@Injectable()
export class BugProcessorService {
  private readonly logger = new Logger(BugProcessorService.name);

  process(payload: AutomationPayload): ProcessResult {
    this.logger.log(`Processing automation payload: workflowId=${payload.workflowId}`);

    // BUG-001: quando taskName não é informado, metadata.source é undefined
    // → TypeError: Cannot read properties of undefined (reading 'toUpperCase')
    const normalizedTask = (payload.metadata as any).source.toUpperCase();

    return {
      status: 'ok',
      workflowId: payload.workflowId ?? 'unknown',
      normalizedTask,
    };
  }

  safeProcess(payload: AutomationPayload): ProcessResult {
    try {
      return this.process(payload);
    } catch (err) {
      Sentry.withScope((scope) => {
        scope.setTag('bug_id', 'BUG-001');
        scope.setTag('component', 'automation-payload-parser');
        scope.setTag('severity', 'high');
        scope.setContext('payload', {
          workflowId: payload.workflowId ?? null,
          taskName: payload.taskName ?? null,
          triggeredBy: payload.triggeredBy ?? null,
          metadataPresent: !!payload.metadata,
        });
        scope.setContext('pipeline', {
          step: 'normalize',
          stage: 'payload-parsing',
          expected: 'metadata.source must be a non-null string',
        });
        Sentry.captureException(err);
      });

      this.logger.error(`BUG-001 capturado e enviado ao Sentry: ${(err as Error).message}`);

      return {
        status: 'degraded',
        workflowId: payload.workflowId ?? 'unknown',
        message: 'Payload malformado — erro registrado no Sentry. App continua operacional.',
      };
    }
  }
}
