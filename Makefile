# Atalhos do Ponto Digital Servioeste. Rode `make help` para ver todos.
# Pastas independentes: system-ponto-digital-servioeste-front (painel e portal, Node)
# e system-ponto-digital-servioeste-back (API em Python e o contrato openapi.yaml). A raiz não tem nada de Node.
# Portas de dev: Postgres 5434, API 8002, Vite 5175 (não batem com Radar e Hub).

FRONT := system-ponto-digital-servioeste-front

.DEFAULT_GOAL := help
.PHONY: help install contracts front front-mock build-front check-no-mocks test-front lint-front

help: ## lista os comandos
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  make %-15s %s\n", $$1, $$2}'

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

check-no-mocks: ## falha se o build de produção tiver código de dados simulados
	./scripts/check-no-mocks.sh

test-front: ## testes do front-end (Vitest)
	cd $(FRONT) && pnpm test

lint-front: ## eslint no front-end
	cd $(FRONT) && pnpm lint
