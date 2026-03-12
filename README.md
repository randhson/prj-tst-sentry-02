# prj-tst-sentry-02

Aplicação NestJS para validação de um ambiente de orquestração de agentes e automações, integrando **Sentry**, **GitHub**, **N8N**, **Groq LLM** e **Slack**.

## Objetivo

Servir como ponto central de disparo de eventos de erro monitorados pelo Sentry.
Quando um issue é criado no Sentry, o fluxo de orquestração é acionado:

```
App dispara bug
    ↓
Sentry cria Issue + envia Webhook
    ↓
N8N recebe e formata os dados
    ↓
N8N chama Groq LLM para análise
    ↓
N8N envia resultado para o Slack
```

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | NestJS 10 + TypeScript |
| Monitoramento | Sentry (self-hosted) |
| Proxy reverso | Traefik |
| Automação | N8N (self-hosted) |
| LLM | Groq |
| Notificação | Slack Incoming Webhooks |
| Deploy | Docker + Docker Compose |
| CI/CD | GitHub Actions |

## Endpoints

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/` | Status page visual |
| `GET` | `/health` | Health check JSON |
| `GET` | `/info` | Info da app e status das integrações |
| `GET` | `/docs` | Swagger UI |
| `GET` | `/debug/sentry-test` | Dispara erro de teste no Sentry |
| `GET/POST` | `/api/process-automation` | **BUG-001** — payload parser crash |
| `GET` | `/api/trigger-monitor` | **BUG-002** — queue monitor crash (manual) |

## Bugs implementados

### BUG-001 — AutomationPayloadError

Simula um webhook de automação chegando sem o campo `metadata.source`.
A app retorna `status: degraded` mas **segue funcionando**.

Tags no Sentry: `bug_id=BUG-001`, `component=automation-payload-parser`, `severity=high`

```bash
curl https://dash.autoflux.tech/api/process-automation
```

### BUG-002 — AgentQueueOverflowError

Serviço de background que monitora uma fila de agentes e tenta acionar um `alertHandler` não instanciado.
Roda automaticamente a cada `MONITOR_INTERVAL_MS` (padrão 60s).
A app **não é interrompida**.

Tags no Sentry: `bug_id=BUG-002`, `component=agent-queue-monitor`, `severity=medium`

```bash
# Disparo manual (sem esperar o intervalo)
curl https://dash.autoflux.tech/api/trigger-monitor
```

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha:

```bash
cp .env.example .env
```

| Variável | Descrição |
|----------|-----------|
| `PORT` | Porta da aplicação (padrão: 3000) |
| `NODE_ENV` | Ambiente (`development` / `production`) |
| `APP_HOST` | Domínio público (usado nas labels do Traefik) |
| `TRAEFIK_CERT_RESOLVER` | Nome do resolver do Traefik (ex: `letsencrypt`) |
| `SENTRY_DSN` | DSN do projeto Sentry (`https://<key>@sentry.dominio.com/<id>`) |
| `GITHUB_TOKEN` | Personal access token do GitHub |
| `N8N_URL` | URL do N8N self-hosted |
| `N8N_API_KEY` | API key do N8N |
| `GROQ_API_KEY` | API key da Groq |
| `SLACK_WEBHOOK_URL` | Incoming Webhook URL do Slack |
| `MONITOR_INTERVAL_MS` | Intervalo do monitor BUG-002 (padrão: `60000`) |

## Rodando localmente

```bash
npm install
npm run start:dev
```

Acesse `http://localhost:3000`

## Deploy

### Pré-requisitos no servidor

- Docker + Docker Compose
- Traefik configurado com a rede `n8n-net`
- Repositório clonado no servidor

### Manual

```bash
cp .env.example .env
# edite o .env com os valores reais
docker compose up -d --build
```

### Automático (GitHub Actions)

A cada push na branch `main`, o workflow `deploy.yml` faz deploy via SSH.

Configure os seguintes secrets no GitHub (**Repo → Settings → Secrets → Actions**):

| Secret | Valor |
|--------|-------|
| `SERVER_HOST` | IP ou hostname do servidor |
| `SERVER_USER` | Usuário SSH (ex: `ubuntu`, `root`) |
| `SERVER_SSH_KEY` | Conteúdo da chave SSH privada |
| `APP_DIR` | Caminho do projeto no servidor (ex: `/opt/prj-tst-sentry-02`) |

## Configurando o Webhook do Sentry para o N8N

1. No Sentry self-hosted, acesse **Projeto → Settings → Integrations → Webhooks**
2. Adicione a URL: `https://wflow.autoflux.tech/webhook/sentry`
3. Marque o evento **Issue** (created)
4. Salve e clique em **Send Test** para validar
