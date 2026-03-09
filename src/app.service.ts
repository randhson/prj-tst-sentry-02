import { Injectable } from '@nestjs/common';

export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
  uptime: number;
  version: string;
}

export interface IntegrationStatus {
  name: string;
  configured: boolean;
}

export interface AppInfo {
  name: string;
  version: string;
  description: string;
  environment: string;
  integrations: IntegrationStatus[];
  docs: string;
}

@Injectable()
export class AppService {
  getHealth(): HealthStatus {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(process.uptime()),
      version: '0.1.0',
    };
  }

  getInfo(): AppInfo {
    return {
      name: 'prj-tst-sentry-02',
      version: '0.1.0',
      description:
        'Projeto para teste de integração com Sentry e orquestração de agentes',
      environment: process.env.NODE_ENV ?? 'development',
      integrations: [
        { name: 'Sentry', configured: !!process.env.SENTRY_DSN },
        { name: 'GitHub', configured: !!process.env.GITHUB_TOKEN },
        { name: 'N8N', configured: !!process.env.N8N_URL },
        { name: 'Groq LLM', configured: !!process.env.GROQ_API_KEY },
        { name: 'Slack', configured: !!process.env.SLACK_WEBHOOK_URL },
      ],
      docs: '/docs',
    };
  }
}
