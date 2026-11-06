# Pesquisa (Fase 0): Fundação e cadastros

Cada item segue o formato Decisão / Motivo / Alternativas. Fontes do projeto: `docs/briefing/plano-tecnico.md`,
`docs/briefing/layout.md`, `docs/briefing/decisoes.md` e o Servioeste Hub
(`../automacoes-servioeste/System-servioeste-hub-web`).

## R1. Organização do repositório único

- **Decisão** (revista em 2026-11-06 a pedido do usuário): tudo do frontend em `system-ponto-digital-servioeste-front` (painel e portal, Vite) e
  tudo do backend em `system-ponto-digital-servioeste-back` (FastAPI), incluindo o contrato em `system-ponto-digital-servioeste-back/contracts` (OpenAPI + tipos TypeScript
  gerados). `infra/` (Docker Compose e Caddy) e `Makefile` na raiz. Workspace pnpm com `system-ponto-digital-servioeste-front` e `system-ponto-digital-servioeste-back/contracts`.
  A pasta do app mobile e do tablet será definida na feature 002/003.
- **Motivo:** nomes que deixam claro o que é front e o que é back; `infra/` e `Makefile` repetem o Hub.
- **Alternativas:** `apps/web` + `services/api` + `packages/contracts` (estrutura inicial, trocada a pedido do
  usuário); contrato numa pasta própria na raiz ou dentro do front (rejeitadas: o back é dono da API);
  repositórios separados para front e back (rejeitada pelo usuário); Turborepo/Nx (rejeitada: Princípio X).

## R2. Contratos primeiro (`system-ponto-digital-servioeste-back/contracts`)

- **Decisão:** contrato escrito à mão em **OpenAPI 3.1** (`system-ponto-digital-servioeste-back/contracts/openapi.yaml`), fonte da verdade.
  Tipos TypeScript gerados com **openapi-typescript** (`pnpm contracts:gen`). No backend, um teste de contrato
  compara rotas e métodos da API com o YAML e valida as respostas dos testes com **openapi-core**.
- **Motivo:** o plano técnico exige contrato antes do frontend (passo 1) e o frontend simulado antes do backend
  (Princípio XII). Gerar o contrato a partir do FastAPI inverteria essa ordem.
- **Alternativas:** tipos TS escritos à mão (rejeitada: divergiriam do Python); gerar o OpenAPI pelo FastAPI
  (rejeitada: exige backend antes); zod compartilhado (rejeitada: não chega ao Python).

## R3. Dados simulados no frontend

- **Decisão:** **MSW (Mock Service Worker)** em `system-ponto-digital-servioeste-front/src/mocks/`, com handlers que seguem os tipos gerados.
  Liga só com `VITE_MOCK=true` em `pnpm dev`, por `import()` dinâmico dentro de `if (import.meta.env.DEV)`.
  Dados fictícios gerados à mão (CPFs válidos de teste, nomes inventados), sem foto.
- **Motivo:** o frontend chama a mesma `/api` que chamará em produção; trocar simulado por real é desligar a flag
  (passo 5 do plano). O código simulado some do build de produção.
- **Garantia (Princípio XII):** teste de CI que faz o build de produção e falha se encontrar `msw` ou
  `mockServiceWorker` no `dist/`.
- **Alternativas:** JSON estático importado nas telas (rejeitada: exige reescrever a camada de dados depois);
  json-server (rejeitada: outro processo, não cobre erros nem regras).

## R4. Autenticação do painel (reaproveitada do Hub)

- **Decisão:** copiar do Hub `core/security.py`, `api/deps.py`, `routes/auth.py`, `services/rate_limit.py` e
  `services/audit.py` como ponto de partida: argon2 para senha; sessão em tabela guardando só o SHA-256 do token;
  cookie httpOnly + SameSite=Lax (+ Secure em produção); CSRF por checagem de `Origin`; limite de tentativas em
  tabela do Postgres (sem Redis).
- **Motivo:** já testado e em uso pela equipe; Princípio X. Não há SSO com o Hub (D-56).
- **Alternativas:** JWT em localStorage (rejeitada: exposto a XSS); provedor externo (rejeitada: custo e D-56).

## R5. Segundo fator (Administrador e RH)

- **Decisão:** **TOTP (RFC 6238)** com **pyotp** (MIT), compatível com Google Authenticator, Microsoft
  Authenticator e Aegis. Segredo cifrado no banco com **cryptography/Fernet**, chave em variável de ambiente
  (`MFA_ENCRYPTION_KEY`). QR code gerado no frontend (lib `qrcode`, MIT) a partir da URI `otpauth://`.
  A sessão nasce com `mfa_pendente = true`; só rotas de MFA respondem até o código ser validado. Janela de
  ±1 passo (30 s) e bloqueio de reuso do mesmo código. Redefinição por outro administrador, auditada. Recuperação
  do único administrador por comando `make admin-reset-mfa` no servidor (fora do painel).
- **Motivo:** gratuito (D-08), sem SMS, padrão de mercado. Spec FR-016a.
- **Alternativas:** e-mail com código (rejeitada: depende de e-mail confiável e cai na mesma senha); WebAuthn
  (rejeitada no MVP: mais complexo de implementar e recuperar); códigos de recuperação (adiada: redefinição por
  admin cobre o piloto).

## R6. ARP e numeração NSR nesta feature

- **Decisão:** a tabela `arp_eventos` nasce aqui, porque FR-003 exige gravar inclusão/alteração do empregador e
  inclusão/alteração/exclusão de empregado. No leiaute do AFD (Anexo V) esses eventos são registros próprios
  (tipo 2: empregador; tipo 5: empregado) e **consomem o mesmo NSR** das marcações do estabelecimento. Portanto:
  - NSR por **estabelecimento**, em tabela `nsr_contadores` atualizada com `SELECT ... FOR UPDATE` na mesma
    transação da gravação (sem `SEQUENCE`, que pode pular números).
  - Evento de empregador grava no estabelecimento afetado; alteração de dados da empresa grava um evento em cada
    estabelecimento dela.
  - Evento de empregado grava no estabelecimento da unidade em que ele está lotado.
  - Cada linha guarda `hash_anterior` e `hash` (SHA-256 sobre o conteúdo canônico + hash anterior) por
    estabelecimento.
- **Imutabilidade (Princípio III):** gatilho `BEFORE UPDATE OR DELETE` que lança erro; o papel de banco da
  aplicação (`ponto_app`) não tem `UPDATE`/`DELETE`/`TRUNCATE` em `arp_eventos` e `auditoria`; migrações rodam
  com outro papel (`ponto_owner`).
- **Pendência:** conferir no Anexo V vigente os campos exatos dos registros 2 e 5 antes da feature 009. Nesta
  feature o evento guarda os dados em JSON canônico, suficiente para gerar o AFD depois.
- **Alternativas:** guardar só na auditoria e montar o AFD depois (rejeitada: NSR precisa nascer sequencial no
  momento do evento); NSR global (rejeitada: a Portaria pede por estabelecimento).

## R7. Trilha de auditoria

- **Decisão:** tabela `auditoria`, só inserção, com hash encadeado global, gatilho contra alteração e o mesmo
  bloqueio de permissões do ARP. A gravação é serializada com `pg_advisory_xact_lock` antes de ler a última linha,
  para que gravações simultâneas não usem o mesmo `hash_anterior` (o que quebraria a cadeia e acusaria uma
  adulteração que não houve). Registra: usuário, ação, tipo e id do objeto, resultado (`permitido`/`negado`),
  data e hora, IP e diferenças (sem CPF em texto: o CPF é mascarado `***.456.789-**`).
  Leituras de dados pessoais também geram linha: abrir ficha (`funcionario.ver`) e listar/buscar funcionários
  (`funcionario.listar`, com os filtros usados e sem o texto de busca quando ele for um CPF).
- **Motivo:** Princípio IV e FR-007; o Hub tem auditoria sem hash, que aqui é ampliada.
- **Alternativas:** log em arquivo (rejeitada: não é consultável nem encadeado).

## R8. Vigências sem sobreposição

- **Decisão:** lotação, ligação unidade → estabelecimento e local de prestação usam `inicio` (date) e `fim`
  (date, nulo = em aberto). Sobreposição bloqueada no banco com `EXCLUDE USING gist` (extensão `btree_gist`,
  nativa do PostgreSQL).
- **Motivo:** Princípio VI; o banco garante a regra mesmo com bug no código.
- **Alternativas:** validação só na aplicação (rejeitada: condição de corrida).

## R9. Escopo e permissões configuráveis

- **Decisão:** permissões como texto (`funcionario.criar`, `estrutura.editar`, `atestado.abrir`...) em tabela
  `perfil_permissoes`, semeada pela migração. Escopo em `usuario_escopos` (unidade e/ou setor, ou
  `todas_unidades`). Todo endpoint usa uma dependência `exige(permissao)` e todo SELECT de funcionários passa por
  um filtro único de escopo (`filtrar_por_escopo`). Teste parametrizado percorre todas as rotas com um gestor de
  fora do escopo (SC-002).
- **Motivo:** FR-006, FR-012, FR-012a; um só ponto de filtro evita esquecer uma tela.
- **Alternativas:** RBAC de biblioteca externa (rejeitada: Princípio X); checagem em cada rota (rejeitada: fácil
  esquecer).

## R10. CPF e dados pessoais fora dos logs

- **Decisão:** filtro de logging que mascara sequências de 11 dígitos e o formato `000.000.000-00`; desligar o log
  de corpo de requisição do uvicorn; exceções retornam mensagens sem dados. Teste que provoca erro com CPF e
  verifica o log.
- **Motivo:** Princípio V, FR-019.

## R11. Testes

- **Decisão:**
  - Backend: pytest + pytest-asyncio contra **PostgreSQL real** em contêiner (`make test`), porque gatilhos,
    permissões de papel e `EXCLUDE` não existem no SQLite que o Hub usa. Testes de imutabilidade e NSR escritos
    antes do código (Princípio IX).
  - Frontend: **Vitest** + Testing Library para componentes e fluxos com MSW.
  - Contrato: openapi-core nos testes do backend; `tsc` falha se o frontend divergir dos tipos gerados.
- **Alternativas:** Playwright ponta a ponta (adiada para a feature 003, quando houver fluxo de marcação).

## R12. Layout

- **Decisão:** copiar do Hub `index.css` (tokens), `lib/theme.tsx`, `components/ui/*`, `components/layout/*`
  (`HubShell` → `AppShell`, `TopBar`, `UserMenu`, `Brand` com "Servioeste **Ponto**"), `lib/api.ts` e o
  `LoginPage`/`LoginVisual`. Navegação em pílulas por perfil: Funcionários, Estrutura, Feriados, Usuários,
  Auditoria. Tabelas e formulários seguem os padrões shadcn (`table`, `dialog`, `select`, `badge`, `tabs`),
  adicionados com o mesmo estilo `new-york`.
- **Motivo:** `docs/briefing/layout.md`.

## R13. Portas de desenvolvimento

- **Decisão:** Postgres 5434, API 8002, Vite 5175.
- **Motivo:** não colidir com Radar (5432/8000/5173) nem Hub (5433/8001/5174), que rodam na mesma máquina.

## R14. Volume

- **Decisão:** dimensionar para 100 funcionários no piloto e ~2.000 com as 18 unidades (D-02 provisório,
  `RH-01`). Listas paginadas no servidor (50 por página) e busca com índice trigram (`pg_trgm`) em nome.
- **Motivo:** SC-005 (achar funcionário em menos de 10 s) sem depender do tamanho real.
