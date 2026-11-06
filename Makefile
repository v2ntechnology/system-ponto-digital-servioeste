# Atalhos do Ponto Digital Servioeste. Rode `make help` para ver todos.
# Portas de dev: Postgres 5434, API 8002, Vite 5175 (não batem com Radar e Hub).

.DEFAULT_GOAL := help
.PHONY: help install contracts front front-mock build-web check-no-mocks test-web lint-web

help: ## lista os comandos
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  make %-15s %s\n", $$1, $$2}'

install: ## instala as dependências do workspace (apps/web + packages/contracts)
	pnpm install

contracts: ## gera os tipos TypeScript a partir de packages/contracts/openapi.yaml
	pnpm contracts

front: ## front-end ligado à API real em http://localhost:5175
	pnpm dev:web

front-mock: ## front-end com dados simulados (MSW) em http://localhost:5175
	VITE_MOCK=true pnpm dev:web

build-web: ## build de produção do front-end (apps/web/dist)
	pnpm build:web

check-no-mocks: ## falha se o build de produção tiver código de dados simulados
	./scripts/check-no-mocks.sh

test-web: ## testes do front-end (Vitest)
	pnpm test:web

lint-web: ## eslint no front-end
	pnpm lint:web
