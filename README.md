# system-ponto-digital-servioeste

Sistema de ponto digital próprio da Servioeste (REP-P, Portaria MTP 671/2021).

- Briefing, decisões e pendências: [`docs/briefing/`](docs/briefing/README.md)
- Especificações geradas pelo Spec Kit: [`specs/`](specs/)

## Estrutura

```text
apps/web            Painel do RH e portal do funcionário (React + Vite + TypeScript, visual do Servioeste Hub)
packages/contracts  Contrato da API (openapi.yaml) e tipos TypeScript gerados
services/api        API (FastAPI + PostgreSQL), a partir da Parte B da feature 001
infra/              Docker Compose e Caddy
```

## Desenvolvimento

Pré-requisitos: Node 24 e pnpm 9 (e, a partir do backend, Docker).

```bash
make install       # dependências do workspace
make contracts     # regenera os tipos a partir de packages/contracts/openapi.yaml
make front-mock    # front-end com dados simulados em http://localhost:5175
make front         # front-end ligado à API real
make test-web      # testes do front-end
make lint-web      # eslint
make build-web && make check-no-mocks   # build de produção sem nada simulado
```

Portas de desenvolvimento: Postgres **5434**, API **8002**, Vite **5175**. Não colidem com o Radar
(5432/8000/5173) nem com o Hub (5433/8001/5174), então os três rodam juntos.

`make help` lista todos os comandos.
