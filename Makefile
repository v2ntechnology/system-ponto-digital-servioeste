# Atalhos do Ponto Digital Servioeste. Rode `make help` para ver todos.
# Pastas: system-ponto-digital-servioeste-front (painel e portal) e system-ponto-digital-servioeste-back (API e contrato).
# Portas de dev: Postgres 5434, API 8002, Vite 5175 (não batem com Radar e Hub).

.DEFAULT_GOAL := help
.PHONY: help install contracts front front-mock build-front check-no-mocks test-front lint-front

help: ## lista os comandos
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  make %-15s %s\n", $$1, $$2}'

install: ## instala as dependências (front + contrato do back)
	pnpm install

contracts: ## gera os tipos TypeScript a partir de system-ponto-digital-servioeste-back/contracts/openapi.yaml
	pnpm contracts

front: ## front-end ligado à API real em http://localhost:5175
	pnpm dev

front-mock: ## front-end com dados simulados (MSW) em http://localhost:5175
	pnpm dev:mock

build-front: ## build de produção do front-end (system-ponto-digital-servioeste-front/dist)
	pnpm build:front

check-no-mocks: ## falha se o build de produção tiver código de dados simulados
	./scripts/check-no-mocks.sh

test-front: ## testes do front-end (Vitest)
	pnpm test:front

lint-front: ## eslint no front-end
	pnpm lint:front
