# Quickstart: validar a feature 001

Guia de validação. Os detalhes de dados estão em [data-model.md](data-model.md) e as rotas em
[contracts/openapi.yaml](contracts/openapi.yaml).

## Pré-requisitos

- Docker e Docker Compose
- Node 24 e pnpm
- Portas livres: 5434 (Postgres), 8002 (API), 5175 (Vite)

## Etapa A: frontend com dados simulados (antes do backend)

```bash
make install           # pnpm install no workspace (system-ponto-digital-servioeste-front + system-ponto-digital-servioeste-back/contracts)
make contracts         # gera os tipos TypeScript a partir do openapi.yaml
make front-mock        # VITE_MOCK=true pnpm --filter front dev -> http://localhost:5175
```

Usuários simulados (senha `senha-de-teste`, código MFA simulado `000000`):

| E-mail | Perfil | Escopo |
|---|---|---|
| `admin@exemplo.test` | Administrador | tudo |
| `rh@exemplo.test` | RH | São Cristóvão |
| `gestor@exemplo.test` | Gestor | Setor Operacional de São Cristóvão |

Roteiro de validação com a equipe (Princípio XII):

1. Entrar como `admin@exemplo.test`: pede o código MFA; navegação mostra Funcionários, Estrutura, Feriados,
   Usuários e Auditoria.
2. Estrutura: cadastrar empresa → estabelecimento → unidade (escolhendo o estabelecimento) → setor.
3. Funcionários: cadastrar um da sede (tablet) e um motorista (app); CPF inválido e CPF repetido mostram erro
   no campo.
4. Transferir o motorista de setor; a ficha mostra a lotação antiga encerrada e a nova.
5. Desligar um funcionário; ele sai da lista "Ativos", aparece em "Desligados" com "portal até".
6. Entrar como `gestor@exemplo.test`: entra sem MFA, vê só o setor dele, sem botões de editar; abrir
   `/funcionarios/<id de outro setor>` mostra "não encontrado".
7. Conferir estados de carregando, vazio e erro em cada lista (o MSW tem cenários `?cenario=vazio` e
   `?cenario=erro`).
8. Tema claro, escuro e sistema; layout em 375 px de largura sem rolagem horizontal.

Garantia de que o simulado não vai para produção:

```bash
make build-front         # build de produção
make check-no-mocks    # falha se "msw" ou "mockServiceWorker" estiverem em system-ponto-digital-servioeste-front/dist
```

## Etapa B: backend

```bash
make up                # Postgres + API (cria .env a partir de .env.example)
make admin             # cria o primeiro administrador (pede e-mail, nome, CPF e senha)
make test              # pytest contra Postgres real + build do front
make lint              # ruff + eslint
```

Testes que precisam passar (escritos antes do código, Princípio IX):

| Teste | Prova |
|---|---|
| `tests/arp/test_imutabilidade.py` | `UPDATE`/`DELETE` em `arp_eventos` e `auditoria` falham, inclusive com SQL direto pelo papel da aplicação (SC-006) |
| `tests/arp/test_nsr.py` | NSR começa em 1, sem lacunas, por estabelecimento, inclusive com 20 inclusões concorrentes |
| `tests/arp/test_hash.py` | Alterar uma linha (como superusuário) quebra a verificação da cadeia |
| `tests/test_escopo.py` | Gestor e RH de fora do escopo recebem 404/403 em **todas** as rotas de funcionários (SC-002) |
| `tests/test_funcionarios.py` | CPF único entre ativos, matrícula única, recontratação, transferência, desligamento |
| `tests/test_mfa.py` | Administrador/RH sem código não acessam nada além de `/auth/mfa/*`; código reutilizado é recusado |
| `tests/test_logs.py` | Erro com CPF no corpo não escreve o CPF no log |
| `tests/test_contrato.py` | Rotas e respostas batem com `system-ponto-digital-servioeste-back/contracts/openapi.yaml` |

## Etapa C: integração

```bash
make up && make front  # front sem VITE_MOCK, apontando para a API real em :8002
```

Repetir o roteiro da Etapa A com a API real e conferir em Auditoria:
- uma linha por cadastro, alteração, ficha aberta e acesso negado;
- em `/arp/eventos` do estabelecimento: NSR 1 = inclusão do empregador, seguido das inclusões de empregados,
  alteração e exclusão, com hashes encadeados.

Critério de pronto: roteiro A completo com a API real, `make test` e `make lint` verdes, `check-no-mocks` verde.
