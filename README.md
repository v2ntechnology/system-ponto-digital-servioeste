# system-ponto-digital-servioeste

Sistema de ponto digital próprio da Servioeste (REP-P, Portaria MTP 671/2021).

- Briefing, decisões e pendências: [`docs/briefing/`](docs/briefing/README.md)
- Especificações geradas pelo Spec Kit: [`specs/`](specs/)

## Estrutura

```text
system-ponto-digital-servioeste-front/   Todo o frontend: painel do RH e portal do funcionário
                                         (React + Vite + TypeScript, visual do Servioeste Hub)
system-ponto-digital-servioeste-back/    Todo o backend: API (FastAPI + PostgreSQL) e o contrato
  └── contracts/openapi.yaml            Contrato da API (fonte da verdade); o front gera os tipos dele
infra/                                   Docker Compose e Caddy (a partir da Parte B da feature 001)
docs/briefing/                           Briefing, decisões, pendências, plano técnico e layout
specs/                                   Especificações do Spec Kit
```

## Desenvolvimento

Pré-requisitos: Node 24 e pnpm 9 (e, a partir do backend, Docker).

Front e back são independentes: a raiz não tem `package.json` nem `node_modules`. Os comandos do Node rodam
dentro de `system-ponto-digital-servioeste-front` (`npm run dev:mock`, `npm test`…) ou pelos atalhos do `make` na raiz.

```bash
make install       # dependências do front-end
make contracts     # regenera os tipos a partir de system-ponto-digital-servioeste-back/contracts/openapi.yaml
make front-mock    # front-end com dados simulados em http://localhost:5175 (ou: npm run dev:mock)
make front         # front-end ligado à API real (ou: npm run dev)
make test-front    # testes do front-end
make lint-front    # eslint
make build-front && make check-no-mocks   # build de produção sem nada simulado
```

Portas de desenvolvimento: Postgres **5434**, API **8002**, Vite **5175**. Não colidem com o Radar
(5432/8000/5173) nem com o Hub (5433/8001/5174), então os três rodam juntos.

`make help` lista todos os comandos.

## Área de desenvolvimento

Rodando localmente (`npm run dev` ou `npm run dev:mock`), abra http://localhost:5175/dev. Não precisa de login e não
existe no build de produção.

| Tela | O que mostra | De onde vem |
|---|---|---|
| Plano | As 9 features, a etapa no Spec Kit e o andamento das fases | `docs/briefing/features/`, `specs/*/tasks.md` |
| Board | Tarefas em A fazer, Em andamento e Feito | `specs/*/tasks.md` (marcar `[X]` move para Feito) |
| Histórico | Commits como nova funcionalidade, atualizado, apagado… | `git log` |
| Dúvidas do RH | As perguntas `RH-xx`, com campo para anotar a resposta | `docs/briefing/pendencias.md` (a resposta é gravada no arquivo) |
| Conceitos | Glossário (NSR, ARP, AFD, escopo…) | `docs/briefing/glossario.md` |
