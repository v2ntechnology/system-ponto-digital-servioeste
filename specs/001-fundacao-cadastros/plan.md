# Plano de Implementação: Fundação e cadastros

**Branch**: `main` | **Data**: 2026-11-06 | **Spec**: [spec.md](spec.md)

**Entrada**: especificação em `specs/001-fundacao-cadastros/spec.md`, mais `docs/briefing/plano-tecnico.md`,
`docs/briefing/layout.md`, `docs/briefing/decisoes.md` e `docs/briefing/pendencias.md`.

## Resumo

Criar a base do repositório único e a primeira fatia funcional: estrutura da empresa (empresa → estabelecimento →
unidade → setor), cadastro de funcionários com lotação e local de prestação com vigência, feriados por
abrangência, usuários do painel com perfis, escopo e segundo fator, trilha de auditoria e o ARP com NSR por
estabelecimento e hash encadeado. A ordem segue o plano técnico: contrato OpenAPI em `packages/contracts` →
telas em `apps/web` com dados simulados (MSW) no visual do Servioeste Hub → validação da equipe → API em
`services/api` com testes primeiro nas áreas do Princípio IX → integração e remoção do simulado do fluxo de
produção.

## Contexto Técnico

**Linguagem/Versão**: Python 3.12 (API); TypeScript 5.8 + React 19 (web)

**Dependências principais**:
- API: FastAPI, Pydantic 2, pydantic-settings, SQLAlchemy 2 async + asyncpg, Alembic, argon2-cffi (como no
  Hub); **pyotp** (TOTP) e **cryptography** (Fernet) para o segundo fator.
- Web: Vite 6, Tailwind 4, componentes no estilo shadcn/ui (`new-york`), lucide-react, @fontsource/rubik,
  TanStack Query, React Router 7 (como no Hub); **msw** (dev), **openapi-typescript** (dev), **qrcode**.

**Armazenamento**: PostgreSQL 16 com extensões nativas `btree_gist`, `pg_trgm` e `citext`

**Testes**: pytest + pytest-asyncio contra Postgres real em contêiner; openapi-core (contrato); Vitest +
Testing Library (web); ruff e eslint

**Plataforma alvo**: navegador (desktop e celular) para o painel; API em Linux via Docker + Caddy

**Tipo de projeto**: aplicação web (SPA + API) dentro de repositório único com `apps/`, `services/` e
`packages/`

**Metas de desempenho**: cadastro de funcionário em menos de 2 min (SC-004); busca de funcionário em menos de
10 s (SC-005), com listas paginadas e resposta da API abaixo de 500 ms para a base do piloto

**Restrições**: ARP e auditoria só inserção (gatilho + permissão de banco); NSR sem lacunas por estabelecimento;
CPF fora de logs; MFA obrigatório para Administrador e RH; dados simulados nunca no build de produção; zero
custo (D-08)

**Escala/Escopo**: 100 funcionários no piloto, ~2.000 com 18 unidades; ~10 usuários do painel; ~12 telas

## Verificação da Constituição

*GATE: precisa passar antes da Fase 0 e de novo depois da Fase 1.*

| Princípio | Como o plano atende | Situação |
|---|---|---|
| I. Conformidade legal | Dados do empregador conforme Anexo IX; eventos de empregador/empregado no ARP com NSR (R6); conferência do Anexo V vigente registrada como pendência antes da feature 009 | ✅ |
| II. Marcação nunca bloqueada | Sem marcação nesta feature. O desligamento só tira o funcionário da lista de aptos; o bloqueio de marcação de desligado será revisado na 003 à luz deste princípio | ✅ |
| III. Registro imutável | `arp_eventos` e `auditoria` com gatilho contra `UPDATE`/`DELETE` e papel `ponto_app` sem essas permissões; cadastros nunca apagados, só desativados; vigências em vez de sobrescrita | ✅ |
| IV. Tudo rastreável | Auditoria de leituras de dados pessoais, ações administrativas e acessos negados, com hash encadeado (R7) | ✅ |
| V. Dados mínimos | CPF mascarado para Gestor e em logs (R10); segredo MFA cifrado; nenhuma biometria nesta feature, só sinalização no desligamento | ✅ |
| VI. Regras com vigência | Lotação, unidade→estabelecimento, local de prestação e configurações com vigência; tipos de vínculo e permissões como dados | ✅ |
| VII. Fronteiras isoladas | Sem facial, assinatura ou folha nesta feature; REP (ARP/NSR) em módulo `rep/` separado do restante | ✅ |
| VIII. Coletores offline | Não se aplica a esta feature | ➖ |
| IX. Testes antes | Imutabilidade, NSR sem lacunas e cadeia de hash escritos antes do código (quickstart, etapa B) | ✅ |
| X. Simples | Mesma stack e padrões do Hub; 6 dependências novas, todas gratuitas e justificadas abaixo; sem Redis, sem worker | ✅ |
| XI. Papel só sai com critérios | Não afetado | ➖ |
| XII. Frontend primeiro | Ordem contrato → web com MSW → validação → API → integração; `check-no-mocks` no CI | ✅ |

**Resultado**: passa. Sem violações.

**Revisão pós-design (Fase 1)**: modelo de dados e contrato conferidos contra a tabela acima. O contrato devolve
404 (não 403) para funcionário fora do escopo, para não revelar existência (V). Nenhuma nova violação.

## Estrutura do Projeto

### Documentação (desta feature)

```text
specs/001-fundacao-cadastros/
├── spec.md
├── plan.md              # este arquivo
├── research.md          # Fase 0
├── data-model.md        # Fase 1
├── quickstart.md        # Fase 1
├── contracts/
│   └── openapi.yaml     # Fase 1 (copiado para packages/contracts)
├── checklists/
│   └── requirements.md
└── tasks.md             # Fase 2 (/speckit-tasks)
```

### Código-fonte (raiz do repositório)

```text
Makefile                         # up, down, test, lint, admin, install, contracts, front, front-mock, check-no-mocks
package.json                     # workspace pnpm (scripts de conveniência)
pnpm-workspace.yaml              # apps/web, packages/*
.env.example                     # sem segredos reais
infra/
├── docker-compose.yml           # dev: postgres (5434) + api (8002)
├── docker-compose.prod.yml      # caddy + api + postgres (homologação/produção)
└── Caddyfile
packages/
└── contracts/
    ├── openapi.yaml             # fonte da verdade
    ├── package.json
    └── src/schema.d.ts          # gerado (openapi-typescript), versionado
apps/
└── web/
    ├── index.html
    ├── vite.config.ts           # porta 5175, proxy /api -> 8002, alias @
    ├── components.json          # shadcn new-york, neutral
    ├── public/                  # favicon.svg, logo-servioeste.svg, login-servioeste.webp (do Hub)
    ├── src/
    │   ├── main.tsx             # liga MSW só se DEV && VITE_MOCK
    │   ├── index.css            # tokens do Hub
    │   ├── lib/                 # api.ts, theme.tsx, utils.ts, format.ts (cpf, datas), permissoes.ts
    │   ├── components/
    │   │   ├── ui/              # button, input, label, avatar, table, dialog, select, badge, tabs, toast
    │   │   └── layout/          # AppShell, TopBar, UserMenu, Brand ("Servioeste Ponto"), RequirePermissao
    │   ├── features/
    │   │   ├── auth/            # login, MFA (cadastro com QR e verificação), useAuth
    │   │   ├── estrutura/       # empresas, estabelecimentos, unidades, setores
    │   │   ├── funcionarios/    # lista, ficha, formulário, transferência, local de prestação, desligamento
    │   │   ├── feriados/
    │   │   ├── usuarios/        # perfis, escopo, redefinir MFA
    │   │   └── auditoria/       # auditoria + eventos do ARP
    │   ├── pages/               # LoginPage, MfaPage, FuncionariosPage, FuncionarioPage, EstruturaPage,
    │   │                        # FeriadosPage, UsuariosPage, AuditoriaPage, ConfiguracoesPage, ErrorPage
    │   └── mocks/               # browser.ts, handlers/*.ts, dados.ts (só dev)
    └── tests/                   # Vitest + Testing Library
services/
└── api/
    ├── Dockerfile
    ├── pyproject.toml
    ├── alembic.ini
    ├── alembic/versions/        # 0001_fundacao.py (tabelas, extensões, gatilhos, papéis, sementes)
    ├── app/
    │   ├── main.py
    │   ├── cli.py               # create-admin, reset-mfa
    │   ├── core/                # config, db, security (do Hub), mfa, logging (máscara de CPF)
    │   ├── models/              # estrutura, funcionario, feriado, usuario, auditoria
    │   ├── rep/                 # arp.py (gravação com NSR + hash), nsr.py  -- fronteira do REP
    │   ├── services/            # audit, escopo (filtro único), permissoes, rate_limit, cpf
    │   ├── schemas.py
    │   └── api/
    │       ├── deps.py          # sessão, exige(permissao), MFA concluído
    │       └── routes/          # auth, mfa, empresas, estabelecimentos, unidades, setores,
    │                            # tipos_vinculo, funcionarios, feriados, usuarios, auditoria, arp, health
    └── tests/
        ├── conftest.py          # Postgres de teste, papel ponto_app
        ├── arp/                 # test_imutabilidade, test_nsr, test_hash
        └── test_*.py            # escopo, funcionarios, estrutura, feriados, usuarios, mfa, logs, contrato
.github/workflows/ci.yml         # lint, testes (Postgres service), build web, check-no-mocks
```

**Decisão de estrutura**: repositório único conforme o plano técnico (`apps/web`, `services/api`,
`packages/contracts`), com `infra/` e `Makefile` no padrão do Servioeste Hub. `apps/mobile` fica para as
features 002/003. O módulo `services/api/app/rep/` concentra ARP e NSR desde já, para manter a separação REP ×
PTRP exigida pelo plano técnico.

## Dependências novas (Princípio X)

| Dependência | Para quê | Por que vale o custo |
|---|---|---|
| pyotp | Gerar e validar TOTP | Padrão RFC 6238, pequena, MIT; implementar à mão é arriscado |
| cryptography | Cifrar o segredo MFA | Já será necessária para assinatura (feature 009) |
| msw | Dados simulados no navegador | Troca simulado → real sem reescrever telas (Princípio XII); só em dev |
| openapi-typescript | Tipos TS a partir do contrato | Evita divergência entre web e API; só em dev |
| openapi-core | Testar respostas contra o contrato | Só em testes |
| qrcode | Desenhar o QR do MFA | Pequena, MIT |

## Pendências que não travam esta feature

- `RH-01`/`RH-02`: volume real (usamos 100 → 2.000).
- `RH-03`: CNPJ por unidade (o modelo atende os dois casos).
- `RH-04`: municípios das unidades (necessários só para carregar feriados municipais reais).
- `RH-05`/`RH-06`: local de prestação e tipos de vínculo (cadastráveis).
- `RH-23`: quem serão os usuários do RH e gestores (cadastrados pelo administrador quando definidos).
- Anexo V vigente: campos exatos dos registros 2 e 5 do AFD, antes da feature 009.

## Acompanhamento de complexidade

Sem violações da constituição a justificar.
