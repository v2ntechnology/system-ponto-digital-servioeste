# Atalhos do Ponto Digital Servioeste. Rode `make help` para ver todos.
# Pastas independentes: system-ponto-digital-servioeste-front (painel e portal, Node)
# e system-ponto-digital-servioeste-back (API em Python e o contrato openapi.yaml). A raiz não tem nada de Node.
# Portas de dev: Postgres 5434, API 8002, Vite 5175 (não batem com Radar e Hub).

FRONT := system-ponto-digital-servioeste-front
COMPOSE = docker compose -f infra/docker-compose.yml --env-file .env

.DEFAULT_GOAL := help
.PHONY: help install contracts front front-mock build-front check-no-mocks test-front lint-front \
        up down logs ps test test-back lint lint-back admin admin-reset-mfa

help: ## lista os comandos
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  make %-16s %s\n", $$1, $$2}'

.env:
	cp .env.example .env

# ------------------------------------------------------------------ front-end
install: ## instala as dependências do front-end
	cd $(FRONT) && pnpm install

contracts: ## gera os tipos do front a partir de system-ponto-digital-servioeste-back/contracts/openapi.yaml
	cd $(FRONT) && pnpm contracts

front: ## front-end ligado à API real em http://localhost:5175
	cd $(FRONT) && pnpm dev

front-mock: ## front-end com dados simulados (MSW) em http://localhost:5175
	cd $(FRONT) && pnpm dev:mock

build-front: ## build de produção do front-end ($(FRONT)/dist)
	cd $(FRONT) && pnpm build

check-no-mocks: ## falha se o build de produção tiver dados simulados ou a área de desenvolvimento
	./scripts/check-no-mocks.sh

test-front: ## testes do front-end (Vitest)
	cd $(FRONT) && pnpm test

lint-front: ## eslint no front-end
	cd $(FRONT) && pnpm lint

# ------------------------------------------------------------------ back-end (Docker)
up: .env ## sobe Postgres (:5434) e API (:8002), aplicando as migrações
	$(COMPOSE) up -d --build

down: .env ## desliga tudo (os dados ficam no volume)
	$(COMPOSE) down

logs: .env ## acompanha os logs da API
	$(COMPOSE) logs -f api

ps: .env ## mostra o que está rodando
	$(COMPOSE) ps

test-back: .env ## testes do back-end contra Postgres real (banco ponto_test, recriado a cada rodada)
	$(COMPOSE) run --rm api pytest

lint-back: .env ## ruff no back-end
	$(COMPOSE) run --rm --no-deps api ruff check --no-cache app tests alembic

test: test-back test-front build-front check-no-mocks ## tudo: back-end, front-end, build e checagem de simulados

lint: lint-back lint-front ## ruff + eslint

admin: .env ## cria o primeiro administrador (pede e-mail, nome, CPF e senha)
	@read -p "E-mail: " email; read -p "Nome: " nome; read -p "CPF: " cpf; \
	$(COMPOSE) exec api python -m app.cli create-admin --email "$$email" --nome "$$nome" --cpf "$$cpf"

admin-reset-mfa: .env ## redefine o segundo fator de alguém (ex.: o único administrador perdeu o celular)
	@read -p "E-mail: " email; $(COMPOSE) exec api python -m app.cli reset-mfa --email "$$email"
