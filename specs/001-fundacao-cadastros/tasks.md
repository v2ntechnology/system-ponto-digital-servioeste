---

description: "Tarefas da feature 001: fundação e cadastros"
---

# Tarefas: Fundação e cadastros

**Entrada**: documentos de design em `specs/001-fundacao-cadastros/`

**Pré-requisitos**: plan.md, spec.md, research.md, data-model.md, contracts/openapi.yaml, quickstart.md

**Testes**: incluídos. O Princípio IX (testes antes do código para ARP, NSR e hash) e o SC-006 (teste
automatizado de imutabilidade) os exigem. O SC-002 exige teste de escopo em todas as rotas.

**Organização**: segue a "Ordem de implementação" do plano técnico (Princípio XII):

- **Parte A: frontend com dados simulados.** Setup → fundação do frontend → uma fase por história (US1 a US5)
  → **validação da equipe** (ponto de parada obrigatório).
- **Parte B: backend e integração.** Fundação do backend (ARP, NSR, auditoria, autenticação, escopo, com testes
  antes) → uma fase por história, ligando cada tela à API real → acabamento.

## Formato: `[ID] [P?] [História] Descrição`

- **[P]**: pode rodar em paralelo (arquivos diferentes, sem depender de tarefa pendente)
- **[US1]** estrutura da empresa · **[US2]** cadastro de funcionário · **[US3]** acesso por perfil ·
  **[US4]** feriados · **[US5]** desligamento

## Convenções de caminho

- Web: `system-ponto-digital-servioeste-front/src/`, testes em `system-ponto-digital-servioeste-front/tests/`
- API: `system-ponto-digital-servioeste-back/app/`, testes em `system-ponto-digital-servioeste-back/tests/`
- Contrato: `system-ponto-digital-servioeste-back/contracts/`
- Hub de referência: `../../automacoes-servioeste/System-servioeste-hub-web/` (chamado de **Hub** abaixo)

---

# PARTE A: FRONTEND COM DADOS SIMULADOS

## Fase 1: Setup (infraestrutura compartilhada)

**Objetivo**: criar o repositório único, o contrato e o esqueleto do app web no padrão do Hub.

- [X] T001 Criar `pnpm-workspace.yaml` com `system-ponto-digital-servioeste-front` e `system-ponto-digital-servioeste-back/contracts` e `package.json` na raiz (privado, scripts `dev`, `dev:mock`, `contracts`, `build:front`, `lint:front`, `test:front`) *(revisto em 2026-11-06: front e back independentes, sem workspace na raiz; os tipos ficam em `system-ponto-digital-servioeste-front/src/contracts/`)*
- [X] T002 [P] Criar `system-ponto-digital-servioeste-back/contracts/` com `package.json` (nome `@ponto/contracts`, devDependency `openapi-typescript`, script `gen` que gera `src/schema.d.ts`) e copiar `specs/001-fundacao-cadastros/contracts/openapi.yaml` para `system-ponto-digital-servioeste-back/contracts/openapi.yaml`
- [X] T003 Gerar e versionar `system-ponto-digital-servioeste-back/contracts/src/schema.d.ts` e criar `system-ponto-digital-servioeste-back/contracts/src/index.ts` exportando aliases legíveis (`Empresa`, `Estabelecimento`, `Unidade`, `Setor`, `Funcionario`, `FuncionarioResumo`, `Feriado`, `Usuario`, `Eu`, `Erro`, `RegistroAuditoria`, `EventoArp`)
- [X] T004 Criar `system-ponto-digital-servioeste-front` com Vite 6 + React 19 + TypeScript 5.8, copiando do Hub `frontend/package.json` (renomear para `web`, adicionar `@ponto/contracts: workspace:*`, `msw`, `qrcode`, `vitest`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`), `tsconfig*.json`, `eslint.config.js`, `components.json` e `index.html` (título "Servioeste Ponto") *(revisto em 2026-11-06: front e back independentes, sem workspace na raiz; os tipos ficam em `system-ponto-digital-servioeste-front/src/contracts/`)*
- [X] T005 Configurar `system-ponto-digital-servioeste-front/vite.config.ts` como o do Hub, com porta **5175**, proxy `/api` → `http://127.0.0.1:8002`, alias `@` → `src`, e bloco `test` do Vitest (`environment: "jsdom"`, setup em `system-ponto-digital-servioeste-front/tests/setup.ts`)
- [X] T006 [P] Copiar do Hub para `system-ponto-digital-servioeste-front/public/`: `favicon.svg`, `logo-servioeste.svg`, `apple-touch-icon.png` e `login-servioeste.webp`
- [X] T007 [P] Copiar do Hub `frontend/src/index.css` para `system-ponto-digital-servioeste-front/src/index.css` sem alterar os tokens (`--primary #6ca33c`/`#7fb84e`, fundo `#ffffff`/`#000000`, raio `0.75rem`, `.no-scrollbar`)
- [X] T008 [P] Copiar do Hub `lib/utils.ts`, `lib/theme.tsx` (trocar a chave do localStorage para `ponto-tema`) e `lib/format.ts` para `system-ponto-digital-servioeste-front/src/lib/`
- [X] T009 [P] Criar `Makefile` na raiz com `help`, `install`, `contracts`, `front`, `front-mock` (`VITE_MOCK=true`), `build-front`, `check-no-mocks`, `test-front`, `lint-front` (os alvos do backend entram na T080)
- [X] T010 [P] Criar `scripts/check-no-mocks.sh` que falha se `system-ponto-digital-servioeste-front/dist` contiver `msw` ou `mockServiceWorker`, e ligá-lo em `make check-no-mocks`
- [X] T011 [P] Criar `.github/workflows/ci.yml` com o job `web`: `pnpm install`, `pnpm contracts` (falha se `schema.d.ts` mudar), `pnpm lint:front`, `pnpm test:front`, `pnpm build:front`, `make check-no-mocks` *(revisto em 2026-11-06: front e back independentes, sem workspace na raiz; os tipos ficam em `system-ponto-digital-servioeste-front/src/contracts/`)*
- [X] T012 [P] Atualizar o `README.md` da raiz com os comandos de desenvolvimento (`make install`, `make front-mock`) e as portas 5434/8002/5175

**Ponto de controle**: `make front-mock` abre uma página em branco com o tema do Hub em http://localhost:5175.

---

## Fase 2: Fundação do frontend (bloqueia todas as histórias)

**Objetivo**: componentes base, moldura, cliente da API, login com segundo fator e o MSW funcionando.

**⚠️ Nenhuma tela de história começa antes desta fase.**

- [X] T013 [P] Copiar do Hub `components/ui/button.tsx`, `input.tsx`, `label.tsx` e `avatar.tsx` para `system-ponto-digital-servioeste-front/src/components/ui/`
- [X] T014 [P] Criar no estilo shadcn `new-york` (mesmos tokens) `system-ponto-digital-servioeste-front/src/components/ui/table.tsx`, `dialog.tsx`, `select.tsx`, `badge.tsx`, `tabs.tsx`, `textarea.tsx`, `checkbox.tsx` e `toast.tsx`
- [X] T015 [P] Criar `system-ponto-digital-servioeste-front/src/components/ui/estados.tsx` com `Carregando`, `Vazio` (ícone, título, ação opcional) e `ErroCarga` (mensagem + "Tentar de novo"), usados em todas as listas
- [X] T016 Copiar o `lib/api.ts` do Hub para `system-ponto-digital-servioeste-front/src/lib/api.ts`, mantendo `api<T>()` e `ApiError`, ler `codigo` e `campo` do schema `Erro` e usar os tipos de `@ponto/contracts` (remover os tipos do Hub)
- [X] T017 [P] Criar `system-ponto-digital-servioeste-front/src/lib/cpf.ts` com `validarCpf` (dígitos verificadores, recusa sequências repetidas), `formatarCpf` (`000.000.000-00`) e `mascararCpf` (`***.456.789-**`), e o teste `system-ponto-digital-servioeste-front/tests/cpf.test.ts`
- [X] T018 [P] Criar `system-ponto-digital-servioeste-front/src/lib/permissoes.ts` com `pode(eu, permissao)` e o hook `usePermissao`, a partir de `Eu.permissoes`
- [X] T019 Criar `system-ponto-digital-servioeste-front/src/mocks/dados.ts` com o banco simulado em memória: 1 empresa, 1 estabelecimento, unidades "São Cristóvão" e "Unidade Teste", setores "Administrativo" e "Operacional", 12 funcionários fictícios (CPFs válidos de teste, sem foto), 3 tipos de vínculo, feriados nacionais de 2026/2027 e os usuários `admin@exemplo.test`, `rh@exemplo.test` e `gestor@exemplo.test` (escopos do quickstart)
- [X] T020 Criar `system-ponto-digital-servioeste-front/src/mocks/browser.ts` (`setupWorker`) e `system-ponto-digital-servioeste-front/src/mocks/handlers/index.ts`, com suporte a `?cenario=vazio` e `?cenario=erro` e atraso de 300 ms para mostrar o carregamento
- [X] T021 Criar `system-ponto-digital-servioeste-front/src/mocks/handlers/auth.ts` para `POST /auth/login` (devolve `mfa` = `verificar`, `cadastrar` ou `nao_exigido` conforme o perfil), `POST /auth/logout`, `GET /auth/me`, `POST /auth/senha`, `POST /auth/mfa/cadastro` (URI `otpauth://` fictícia) e `POST /auth/mfa/verificar` (aceita `000000`)
- [X] T022 Criar `system-ponto-digital-servioeste-front/src/main.tsx` como o do Hub (QueryClient, ThemeProvider, Router), iniciando o MSW só quando `import.meta.env.DEV && import.meta.env.VITE_MOCK === "true"`, por `import()` dinâmico; rodar `npx msw init system-ponto-digital-servioeste-front/public` e ignorar `mockServiceWorker.js` no build de produção
- [X] T023 Criar `system-ponto-digital-servioeste-front/src/features/auth/useAuth.ts` (`useEu`, `useLogin`, `useLogout`, `useVerificarMfa`, `useCadastrarMfa`) com TanStack Query
- [X] T024 Copiar e adaptar do Hub `pages/LoginPage.tsx` e `features/auth/LoginVisual.tsx` para `system-ponto-digital-servioeste-front/src/pages/LoginPage.tsx` e `system-ponto-digital-servioeste-front/src/features/auth/LoginVisual.tsx` (texto "Servioeste Ponto", sem o clima), redirecionando para `/mfa` quando `mfa != nao_exigido`
- [X] T025 Criar `system-ponto-digital-servioeste-front/src/pages/MfaPage.tsx`: no modo `cadastrar`, mostra o QR (lib `qrcode`) e o campo de 6 dígitos; no modo `verificar`, só o campo; o erro do código aparece no campo
- [X] T026 Criar `system-ponto-digital-servioeste-front/src/features/auth/RequireAuth.tsx` (sem sessão → `/login`; `mfa_pendente` → `/mfa`) e `system-ponto-digital-servioeste-front/src/components/layout/RequirePermissao.tsx` (sem permissão → página "Sem acesso")
- [X] T027 Copiar do Hub `HubShell.tsx`, `TopBar.tsx`, `UserMenu.tsx`, `Brand.tsx` e `ThemeToggle.tsx` para `system-ponto-digital-servioeste-front/src/components/layout/`, renomeando `HubShell` para `AppShell`, Brand "Servioeste **Ponto**", retirando apps/presença da `TopBar` e montando as pílulas por permissão: Funcionários, Estrutura, Feriados, Usuários, Auditoria
- [X] T028 Criar `system-ponto-digital-servioeste-front/src/App.tsx` com as rotas `/login`, `/mfa`, `/funcionarios`, `/funcionarios/novo`, `/funcionarios/:id`, `/estrutura`, `/feriados`, `/usuarios`, `/auditoria`, `/configuracoes` e `*` (copiar `ErrorPage.tsx` do Hub); `/` redireciona para `/funcionarios`
- [X] T029 Copiar do Hub `pages/SettingsPage.tsx` para `system-ponto-digital-servioeste-front/src/pages/ConfiguracoesPage.tsx`, com tema e troca de senha (sem foto de perfil)
- [X] T030 [P] Criar `system-ponto-digital-servioeste-front/tests/auth.test.tsx`: login de RH vai para `/mfa`, código `000000` libera, gestor entra direto; rota protegida sem sessão volta ao login

**Ponto de controle**: com `make front-mock`, os três usuários simulados entram, o RH e o administrador passam pelo segundo fator e a barra do topo mostra só as pílulas permitidas.

---

## Fase 3: História 1, estrutura da empresa (P1) 🎯 MVP (frontend)

**Objetivo**: o administrador cadastra empresa → estabelecimento → unidade → setor e altera os dados.

**Teste independente**: como `admin@exemplo.test`, cadastrar a empresa, um estabelecimento, a unidade São Cristóvão e dois setores e ver tudo na árvore; como `rh@exemplo.test`, os botões de editar não aparecem.

- [X] T031 [P] [US1] Criar `system-ponto-digital-servioeste-front/src/mocks/handlers/estrutura.ts` para `GET/POST /empresas`, `PATCH /empresas/{id}`, `GET/POST /estabelecimentos`, `PATCH /estabelecimentos/{id}`, `GET/POST /unidades`, `PATCH /unidades/{id}` e `GET/POST /setores`, `PATCH /setores/{id}`, validando "identificador: só dígitos; CNPJ/CPF válidos pelos dígitos verificadores", nome de unidade "único por empresa" e setor "único por unidade" (409 com `codigo`), e devolvendo 403 para quem não tem `estrutura.editar`
- [X] T032 [P] [US1] Criar `system-ponto-digital-servioeste-front/src/lib/cnpj.ts` (`validarCnpj`, `formatarCnpj`) e `system-ponto-digital-servioeste-front/src/components/form/EnderecoCampos.tsx` (logradouro, número, complemento, bairro, cidade, UF com 2 letras, CEP com 8 dígitos)
- [X] T033 [US1] Criar `system-ponto-digital-servioeste-front/src/features/estrutura/api.ts` com as consultas e mutações das quatro entidades
- [X] T034 [US1] Criar `system-ponto-digital-servioeste-front/src/features/estrutura/EmpresaForm.tsx` (tipo `cnpj` ou `cpf`, identificador, razão social) e `EstabelecimentoForm.tsx` (tipo `cnpj`, `cpf`, `caepf` ou `cno`, identificador, razão social, endereço), em diálogo
- [X] T035 [US1] Criar `system-ponto-digital-servioeste-front/src/features/estrutura/UnidadeForm.tsx` (nome, estabelecimento vinculado, endereço, código IBGE do município com 7 dígitos) com a opção "trocar estabelecimento a partir de" (data), e `SetorForm.tsx`
- [X] T036 [US1] Criar `system-ponto-digital-servioeste-front/src/pages/EstruturaPage.tsx` com a árvore empresa → estabelecimentos → unidades → setores, mostrando o selo "inativo", botões de cadastrar/editar/desativar só com `estrutura.editar` e os estados carregando, vazio e erro
- [X] T037 [P] [US1] Criar `system-ponto-digital-servioeste-front/tests/estrutura.test.tsx`: administrador cadastra a cadeia completa; CNPJ inválido mostra erro no campo; RH não vê os botões de edição

**Ponto de controle**: história 1 navegável com dados simulados.

---

## Fase 4: História 2, cadastro de funcionário (P1) (frontend)

**Objetivo**: o RH cadastra, busca, abre, altera e transfere funcionários e registra o local de prestação.

**Teste independente**: como `rh@exemplo.test`, cadastrar um funcionário da sede (tablet) e um motorista (app), achá-los pela busca, transferir o motorista de setor e ver o histórico de lotação na ficha.

- [X] T038 [P] [US2] Criar `system-ponto-digital-servioeste-front/src/mocks/handlers/funcionarios.ts` para `GET/POST /funcionarios` (busca por nome, CPF ou matrícula; filtros `unidade_id`, `setor_id`, `situacao`, `tipo_registro`; paginação de 50), `GET/PATCH /funcionarios/{id}`, `POST /funcionarios/{id}/lotacoes` e `POST /funcionarios/{id}/locais-prestacao`, aplicando "CPF único entre ativos" (409 `cpf_ja_ativo`, com `funcionario_id` só se o existente estiver no escopo), "matrícula única por empresa" (409 `matricula_em_uso`), CPF inválido (400 `cpf_invalido`) e filtro por escopo do usuário (404 fora do escopo)
- [X] T039 [P] [US2] Criar `system-ponto-digital-servioeste-front/src/mocks/handlers/tipos-vinculo.ts` para `GET/POST /tipos-vinculo`
- [X] T040 [US2] Criar `system-ponto-digital-servioeste-front/src/features/funcionarios/api.ts` com lista paginada, ficha, criação, alteração, transferência e local de prestação
- [X] T041 [US2] Criar `system-ponto-digital-servioeste-front/src/pages/FuncionariosPage.tsx` com busca (com debounce), filtros por unidade, setor, situação (`ativo`, `desligado`, `todos`) e tipo de registro, tabela com nome, CPF mascarado, matrícula, unidade, setor e tipo de registro, paginação e estados carregando, vazio e erro
- [X] T042 [US2] Criar `system-ponto-digital-servioeste-front/src/features/funcionarios/FuncionarioForm.tsx` com nome (mínimo 3 caracteres), CPF (validação local), matrícula, data de admissão, tipo de vínculo, tipo de registro (`tablet` ou `app`), e-mail opcional e lotação inicial (unidade → setor da unidade); erros 409/400 aparecem no campo correto; "CPF já ativo" leva ao funcionário existente quando a resposta trouxer o id, e senão mostra "CPF já cadastrado em outra unidade, procure o administrador"
- [X] T043 [US2] Criar `system-ponto-digital-servioeste-front/src/pages/FuncionarioNovoPage.tsx` (rota `/funcionarios/novo`) usando o formulário, e voltar para a ficha ao salvar
- [X] T044 [US2] Criar `system-ponto-digital-servioeste-front/src/pages/FuncionarioPage.tsx` com abas Dados, Lotações (histórico com início e fim) e Locais de prestação; CPF completo só com `funcionario.editar` (senão mascarado); edição em diálogo
- [X] T045 [US2] Criar `system-ponto-digital-servioeste-front/src/features/funcionarios/TransferenciaDialog.tsx` (nova unidade, setor e data de início; aviso de que a lotação atual termina no dia anterior)
- [X] T046 [US2] Criar `system-ponto-digital-servioeste-front/src/features/funcionarios/LocalPrestacaoDialog.tsx` (descrição, tomador opcional com tipo e identificador, endereço, início e fim)
- [X] T047 [P] [US2] Criar `system-ponto-digital-servioeste-front/tests/funcionarios.test.tsx`: cadastro válido aparece na lista; CPF repetido mostra o erro no campo; transferência fecha a lotação anterior na ficha

**Ponto de controle**: histórias 1 e 2 navegáveis com dados simulados.

---

## Fase 5: História 3, acesso respeita o perfil (P1) (frontend)

**Objetivo**: o administrador gerencia usuários, perfis, escopos e segundo fator e consulta a auditoria e o ARP; o gestor vê só a própria equipe.

**Teste independente**: como `gestor@exemplo.test`, a lista mostra só o setor Operacional, não há botão de edição e `/funcionarios/<id de outro setor>` mostra "não encontrado"; como administrador, criar um gestor com escopo e ver a ação na auditoria.

- [X] T048 [P] [US3] Criar `system-ponto-digital-servioeste-front/src/mocks/handlers/usuarios.ts` para `GET/POST /usuarios`, `PATCH /usuarios/{id}` (409 ao desativar o último administrador ativo) e `POST /usuarios/{id}/mfa/redefinir`, validando o CPF como obrigatório para `administrador` e `rh` e o escopo por perfil (gestor sem `todas_unidades`)
- [X] T049 [P] [US3] Criar `system-ponto-digital-servioeste-front/src/mocks/handlers/auditoria.ts` para `GET /auditoria` (filtros `acao`, `usuario_id`, `objeto_id`, `resultado`, `antes_de`) e `GET /arp/eventos`, e fazer os outros handlers acrescentarem linhas de auditoria e eventos do ARP simulados (NSR crescente por estabelecimento)
- [X] T050 [US3] Criar `system-ponto-digital-servioeste-front/src/features/usuarios/api.ts` e `system-ponto-digital-servioeste-front/src/features/usuarios/EscopoCampos.tsx` (gestor: escolher setores e/ou unidades inteiras; RH: escolher unidades ou marcar "todas as unidades"; administrador: sem escopo)
- [X] T051 [US3] Criar `system-ponto-digital-servioeste-front/src/features/usuarios/UsuarioForm.tsx` (e-mail, nome, CPF quando o perfil for administrador ou RH, perfil, senha inicial com mínimo de 10 caracteres, escopo)
- [X] T052 [US3] Criar `system-ponto-digital-servioeste-front/src/pages/UsuariosPage.tsx` com a tabela (nome, e-mail, perfil, escopo resumido, ativo, "segundo fator cadastrado"), ações editar, desativar e redefinir segundo fator (com confirmação), protegida por `usuario.gerenciar`
- [X] T053 [US3] Criar `system-ponto-digital-servioeste-front/src/pages/AuditoriaPage.tsx` com as abas Auditoria (filtros, selo "negado" em vermelho, paginação por `antes_de`) e Eventos do ARP (escolher estabelecimento; NSR, tipo, data, responsável, resumo e hash abreviado), protegida por `auditoria.ler`
- [X] T054 [US3] Ajustar `FuncionariosPage.tsx` e `FuncionarioPage.tsx` para esconder ações sem `funcionario.editar`/`funcionario.desligar` e mostrar "Funcionário não encontrado" no 404
- [X] T055 [P] [US3] Criar `system-ponto-digital-servioeste-front/tests/acesso.test.tsx`: gestor vê só o próprio setor e recebe "não encontrado" fora do escopo; RH de uma unidade não vê funcionários de outra; administrador cria gestor e a linha aparece na auditoria

**Ponto de controle**: histórias 1 a 3 (todas as P1) navegáveis.

---

## Fase 6: História 4, feriados por unidade (P2) (frontend)

**Objetivo**: o RH mantém feriados nacionais, estaduais, municipais e por unidade.

**Teste independente**: cadastrar um feriado municipal de São Cristóvão e ver que a "Unidade Teste" (em outro município) não o lista.

- [X] T056 [P] [US4] Criar `system-ponto-digital-servioeste-front/src/mocks/handlers/feriados.ts` para `GET /feriados?ano=&unidade_id=` (nacionais + estaduais da UF + municipais do município + os da unidade, só ativos), `POST /feriados` (exigir `uf` se `estadual`, `municipio_ibge` se `municipal` e `unidade_id` se `unidade`) e `PATCH /feriados/{id}`, aplicando a mesma regra de escopo do RH da T114
- [X] T057 [US4] Criar `system-ponto-digital-servioeste-front/src/features/feriados/api.ts` e `system-ponto-digital-servioeste-front/src/features/feriados/FeriadoForm.tsx` (data, nome, abrangência e o campo condicional correspondente)
- [X] T058 [US4] Criar `system-ponto-digital-servioeste-front/src/pages/FeriadosPage.tsx` com o seletor de ano e de unidade ("todas" ou uma), a lista por mês com selo de abrangência, desativar em vez de excluir, protegida por `feriado.editar` para edição
- [X] T059 [P] [US4] Criar `system-ponto-digital-servioeste-front/tests/feriados.test.tsx`: o municipal aparece só para a unidade do município; o nacional aparece para todas

---

## Fase 7: História 5, desligamento (P2) (frontend)

**Objetivo**: o RH registra o desligamento; o funcionário sai dos ativos e o histórico continua consultável.

**Teste independente**: desligar um funcionário, que some de "Ativos", aparece em "Desligados" com "portal até", e a ficha continua abrindo.

- [X] T060 [P] [US5] Acrescentar `POST /funcionarios/{id}/desligamento` em `system-ponto-digital-servioeste-front/src/mocks/handlers/funcionarios.ts` (400 se a data for anterior à admissão; preencher `portal_acesso_ate` = data + 1825 dias; gerar evento `empregado_exclusao`) e aceitar `vinculo_anterior_id` no cadastro para recontratação
- [X] T061 [US5] Criar `system-ponto-digital-servioeste-front/src/features/funcionarios/DesligamentoDialog.tsx` (data de desligamento, confirmação explicando que as marcações ficam guardadas e a biometria entra no fluxo de exclusão, confirmação extra se a data estiver no futuro; data a mais de 90 dias no futuro é recusada)
- [X] T062 [US5] Mostrar na `FuncionarioPage.tsx` o selo "Desligado", a data e "acesso ao portal até", e o botão "Recontratar" que abre o `FuncionarioForm` com os dados copiados, nova matrícula e `vinculo_anterior_id`
- [X] T063 [P] [US5] Criar `system-ponto-digital-servioeste-front/tests/desligamento.test.tsx`: desligado sai do filtro "ativo"; recontratação com o mesmo CPF é aceita

---

## Fase 8: Validação da equipe ⛔ PONTO DE PARADA

**Objetivo**: as duas pessoas da equipe revisam os fluxos antes de começar o backend (passo 3 do plano técnico).

- [X] T064 Percorrer o roteiro da Etapa A de `specs/001-fundacao-cadastros/quickstart.md` (itens 1 a 8), incluindo tema claro/escuro e largura de 375 px, e registrar os ajustes em `specs/001-fundacao-cadastros/validacao-frontend.md`
- [X] T065 Aplicar os ajustes aprovados; se algum mudar o contrato, atualizar `system-ponto-digital-servioeste-back/contracts/openapi.yaml` e `specs/001-fundacao-cadastros/contracts/openapi.yaml` juntos e regerar os tipos
- [X] T066 Rodar `make build-front && make check-no-mocks` e confirmar que o build de produção não tem nada simulado

**Ponto de controle**: telas aprovadas pela equipe. Só então começa a Parte B.

---

# PARTE B: BACKEND E INTEGRAÇÃO

## Fase 9: Fundação do backend (bloqueia a integração de todas as histórias)

**Objetivo**: API, banco, registros imutáveis, autenticação com segundo fator, permissões e escopo, com testes antes do código (Princípio IX).

### Estrutura

- [X] T067 Criar `system-ponto-digital-servioeste-back/pyproject.toml` a partir do Hub (`backend/pyproject.toml`), com nome `ponto-api` e as dependências extras `pyotp`, `cryptography` e `openapi-core`; mesma configuração do ruff (120 colunas, regras `E F I B UP S`)
- [X] T068 [P] Copiar do Hub `backend/Dockerfile` e `.dockerignore` para `system-ponto-digital-servioeste-back/`
- [X] T069 [P] Criar `infra/docker-compose.yml` a partir do Hub, com projeto `servioeste-ponto`, Postgres 16 na porta **5434** e API na **8002**, contexto `../system-ponto-digital-servioeste-back`, portas presas em `127.0.0.1`
- [X] T070 [P] Criar `.env.example` com `POSTGRES_*`, `DATABASE_URL` (papel `ponto_app`), `DATABASE_OWNER_URL` (papel `ponto_owner`, só para migrações), `MFA_ENCRYPTION_KEY` (vazio, com a instrução para gerar com Fernet), `COOKIE_SECURE`, `ALLOWED_ORIGINS` e `TZ=America/Sao_Paulo`, sem nenhum valor real
- [X] T071 Copiar do Hub `core/config.py` e `core/db.py` para `system-ponto-digital-servioeste-back/app/core/`, acrescentando `mfa_encryption_key` e `database_owner_url`
- [X] T072 [P] Criar `system-ponto-digital-servioeste-back/app/core/logging.py` com o filtro que mascara CPF (11 dígitos seguidos e o formato `000.000.000-00`) em todos os handlers, desligando o log de corpo das requisições
- [X] T073 Criar `system-ponto-digital-servioeste-back/app/main.py` (FastAPI com prefixo `/api`, docs só em dev, tratador de erros que devolve o schema `Erro` sem dados pessoais) e `system-ponto-digital-servioeste-back/app/api/routes/health.py`
- [X] T074 Configurar o Alembic em `system-ponto-digital-servioeste-back/alembic.ini` e `system-ponto-digital-servioeste-back/alembic/env.py`, rodando com `DATABASE_OWNER_URL`

### Migração inicial

- [X] T075 Criar `system-ponto-digital-servioeste-back/alembic/versions/0001_fundacao.py` com as extensões `btree_gist`, `pg_trgm` e `citext`, os papéis `ponto_owner` e `ponto_app`, e todas as tabelas de `data-model.md`: `empresas`, `estabelecimentos`, `unidades`, `unidade_estabelecimentos` (`EXCLUDE USING gist (unidade_id WITH =, daterange(inicio, fim, '[]') WITH &&)`), `setores`, `tipos_vinculo`, `funcionarios` (CPF único com índice parcial `WHERE desligado_em IS NULL`; matrícula única por empresa; `desligado_em >= admitido_em`; `biometria_exclusao_pendente bool default false`), `lotacoes` e `locais_prestacao` (com `EXCLUDE` por funcionário), `feriados`, `usuarios`, `usuario_escopos`, `perfil_permissoes`, `sessoes`, `tentativas_login`, `configuracoes`, `nsr_contadores`, `arp_eventos` (`UNIQUE (estabelecimento_id, nsr)`) e `auditoria`
- [X] T076 Na mesma migração, criar o gatilho `BEFORE UPDATE OR DELETE` que lança erro em `arp_eventos` e `auditoria`, dar a `ponto_app` só `INSERT, SELECT` nessas duas tabelas (sem `UPDATE`, `DELETE`, `TRUNCATE`) e criar o índice trigram em `funcionarios.nome`
- [X] T077 Na mesma migração, semear `perfil_permissoes` conforme a matriz de `data-model.md`, `tipos_vinculo` (CLT, Estágio, Aprendiz, Temporário) e `configuracoes` (`portal_dias_pos_desligamento = 1825`, `sessao_inatividade_min_admin_rh = 30`, `sessao_max_horas = 8`)
- [X] T078 [P] Criar os modelos SQLAlchemy em `system-ponto-digital-servioeste-back/app/models/estrutura.py`, `funcionario.py`, `feriado.py`, `usuario.py`, `auditoria.py` e `system-ponto-digital-servioeste-back/app/rep/models.py` (`NsrContador`, `ArpEvento`)
- [X] T079 Criar `system-ponto-digital-servioeste-back/tests/conftest.py` com o Postgres de teste (banco novo por sessão, migração aplicada com o papel dono, sessões de teste conectadas como `ponto_app`) e fábricas de empresa, estabelecimento, unidade, setor, funcionário e usuário
- [X] T080 Completar o `Makefile` com `up`, `down`, `logs`, `ps`, `test` (pytest no contêiner + `make test-front` + `make build-front`), `lint` (ruff + eslint), `admin` (pede e-mail, nome, CPF e senha) e `admin-reset-mfa`, e acrescentar o job `api` em `.github/workflows/ci.yml` (Postgres como service, ruff, pytest)

### Testes antes do código (Princípio IX): escrever, ver falhar e só então implementar

- [X] T081 [P] Escrever `system-ponto-digital-servioeste-back/tests/arp/test_imutabilidade.py`: `UPDATE` e `DELETE` em `arp_eventos` e `auditoria`, pelo ORM e por SQL direto como `ponto_app`, falham; o gatilho também barra o papel dono (SC-006)
- [X] T082 [P] Escrever `system-ponto-digital-servioeste-back/tests/arp/test_nsr.py`: o NSR começa em 1, cresce de 1 em 1 por estabelecimento, é independente entre estabelecimentos e não tem lacunas com 20 gravações concorrentes nem com transação desfeita
- [X] T083 [P] Escrever `system-ponto-digital-servioeste-back/tests/arp/test_hash.py`: o primeiro evento tem `hash_anterior` com 64 zeros; cada `hash` = SHA-256(`hash_anterior` + JSON canônico com chaves ordenadas); `verificar_cadeia()` detecta uma linha alterada pelo superusuário com o gatilho desligado
- [X] T084 [P] Escrever `system-ponto-digital-servioeste-back/tests/test_auditoria_cadeia.py` com a mesma prova de encadeamento para `auditoria`, incluindo 20 gravações simultâneas que precisam terminar com `seq` sem lacunas e a cadeia íntegra
- [X] T085 [P] Escrever `system-ponto-digital-servioeste-back/tests/test_logs.py`: uma requisição com CPF no corpo que gera erro não escreve o CPF em nenhum log

### Implementação

- [X] T086 Implementar `system-ponto-digital-servioeste-back/app/rep/nsr.py` (`proximo_nsr(sessao, estabelecimento_id)` com `SELECT ... FOR UPDATE` em `nsr_contadores`, na transação de quem chama) até a T082 passar
- [X] T087 Implementar `system-ponto-digital-servioeste-back/app/rep/arp.py` (`gravar_evento(sessao, estabelecimento_id, tipo, responsavel, dados)` com JSON canônico, `hash_anterior` do mesmo estabelecimento e `verificar_cadeia(estabelecimento_id)`) até as T081 e T083 passarem
- [X] T088 Implementar `system-ponto-digital-servioeste-back/app/services/audit.py` a partir do Hub (`registrar(acao, objeto, resultado, detalhes)` com hash encadeado global, mascarando CPF em `detalhes`): pegar `pg_advisory_xact_lock` com a chave fixa da auditoria, ler a última linha, calcular `seq + 1` e o hash e inserir na mesma transação; implementar até a T084 passar
- [X] T089 [P] Copiar do Hub `core/security.py` e `services/rate_limit.py` para `system-ponto-digital-servioeste-back/app/core/security.py` e `system-ponto-digital-servioeste-back/app/services/rate_limit.py`
- [X] T090 [P] Criar `system-ponto-digital-servioeste-back/app/core/mfa.py` (gerar segredo, URI `otpauth://` com emissor "Servioeste Ponto", cifrar/decifrar com Fernet, validar com janela de ±1 passo, recusar passo `<= mfa_ultimo_passo`)
- [X] T091 [P] Criar `system-ponto-digital-servioeste-back/app/services/cpf.py` (validação de CPF e CNPJ por dígito verificador, `mascarar`)
- [X] T092 Criar `system-ponto-digital-servioeste-back/app/api/deps.py` a partir do Hub: sessão pelo cookie `ponto_sessao`, checagem de `Origin`, `exige_mfa_concluido` (com `mfa_pendente` só as rotas `/auth/mfa/*`, `/auth/me` e `/auth/logout` respondem) e `exige(permissao)` que registra `acesso.negado` na auditoria e devolve 403
- [X] T093 Criar `system-ponto-digital-servioeste-back/app/services/escopo.py` com `filtrar_funcionarios(query, usuario, data)` (lotação vigente cuja unidade ou setor está em `usuario_escopos`; administrador e RH com `todas_unidades` sem filtro) e `garantir_no_escopo(usuario, funcionario_id)` (404 + auditoria `acesso.negado`)
- [X] T094 Criar `system-ponto-digital-servioeste-back/app/api/routes/auth.py` a partir do Hub (sessão expira após 30 min sem uso para administrador e RH e após 8 h no máximo para todos, valores em `configuracoes`) com `POST /auth/login` (resposta `LoginResultado.mfa`), `/auth/logout`, `GET /auth/me` (`Eu` com permissões e escopo) e `POST /auth/senha`
- [X] T095 Criar `system-ponto-digital-servioeste-back/app/api/routes/mfa.py` com `POST /auth/mfa/cadastro` e `POST /auth/mfa/verificar` (com limite de tentativas)
- [X] T096 [P] Escrever `system-ponto-digital-servioeste-back/tests/test_mfa.py`: administrador e RH sem código recebem 401 em `/funcionarios`; código certo libera; o mesmo código usado duas vezes é recusado; gestor não passa por segundo fator
- [X] T097 Criar `system-ponto-digital-servioeste-back/app/cli.py` com `create-admin` (e-mail, nome, CPF, senha; cria o administrador com escopo vazio) e `reset-mfa --email`
- [X] T098 [P] Escrever `system-ponto-digital-servioeste-back/tests/test_contrato.py`: as rotas e métodos do app batem com `system-ponto-digital-servioeste-back/contracts/openapi.yaml`, e um fixture `validar_resposta` (openapi-core) fica disponível para os testes das histórias

**Ponto de controle**: `make test` verde com T081 a T085, T096 e T098; `make admin` cria o primeiro administrador.

---

## Fase 10: História 1, estrutura da empresa (backend + integração)

- [ ] T099 [P] [US1] Escrever `system-ponto-digital-servioeste-back/tests/test_estrutura.py`: o administrador cria a cadeia e cada criação/alteração gera evento no ARP (`empregador_inclusao` ao criar estabelecimento; `empregador_alteracao` em cada estabelecimento ao alterar a empresa) e linha de auditoria; RH e Gestor recebem 403 e a tentativa é auditada; troca de estabelecimento da unidade fecha a vigência e abre outra sem sobreposição; uma segunda unidade em outro estabelecimento entra sem mudar nada e tem NSR independente (SC-003); respostas validadas pelo contrato
- [ ] T100 [US1] Implementar `system-ponto-digital-servioeste-back/app/api/routes/empresas.py` e `estabelecimentos.py` (criar estabelecimento inicia `nsr_contadores` e grava `empregador_inclusao` na mesma transação; desativar em vez de apagar)
- [ ] T101 [US1] Implementar `system-ponto-digital-servioeste-back/app/api/routes/unidades.py` (GET filtrado pelo escopo; `novo_estabelecimento` fecha a vigência no dia anterior e abre outra) e `setores.py`
- [ ] T102 [US1] Ligar `system-ponto-digital-servioeste-front/src/features/estrutura/` à API real, conferir com `make front` sem `VITE_MOCK` e corrigir divergências

**Ponto de controle**: história 1 funcionando de ponta a ponta. **MVP mínimo.**

---

## Fase 11: História 2, cadastro de funcionário (backend + integração)

- [ ] T103 [P] [US2] Escrever `system-ponto-digital-servioeste-back/tests/test_funcionarios.py`: cadastro válido grava `empregado_inclusao` no ARP do estabelecimento da unidade; CPF inválido → 400 `cpf_invalido`; CPF de ativo repetido → 409 `cpf_ja_ativo`; matrícula repetida na empresa → 409 `matricula_em_uso`; alteração grava `empregado_alteracao`; transferência fecha a lotação no dia anterior sem sobreposição; local de prestação com vigência; busca por nome, CPF e matrícula; abrir ficha gera auditoria `funcionario.ver` e listar/buscar gera `funcionario.listar` (sem CPF em `detalhes`); CPF repetido de funcionário fora do escopo devolve 409 sem `funcionario_id`; respostas validadas pelo contrato
- [ ] T104 [US2] Implementar `system-ponto-digital-servioeste-back/app/api/routes/tipos_vinculo.py`
- [ ] T105 [US2] Implementar `system-ponto-digital-servioeste-back/app/api/routes/funcionarios.py` com `GET` (sempre via `filtrar_funcionarios`, busca trigram, paginação, CPF mascarado no resumo, auditoria `funcionario.listar`), conflito de CPF que só devolve `funcionario_id` quando o existente está no escopo, `POST` (funcionário + lotação inicial + evento no ARP na mesma transação), `GET/PATCH /{id}` (via `garantir_no_escopo`; CPF completo só com `funcionario.editar`), `POST /{id}/lotacoes` e `POST /{id}/locais-prestacao`
- [ ] T106 [US2] Ligar `system-ponto-digital-servioeste-front/src/features/funcionarios/` à API real e conferir a busca com 100 funcionários fictícios carregados por `make seed-dev` (alvo novo no `Makefile`, só para dev)

---

## Fase 12: História 3, acesso respeita o perfil (backend + integração)

- [ ] T107 [P] [US3] Escrever `system-ponto-digital-servioeste-back/tests/test_escopo.py`, parametrizado sobre **todas** as rotas de funcionários e estrutura: gestor de outro setor e RH de outra unidade recebem 404/403, a tentativa aparece na auditoria com `resultado = negado`, e a busca nunca devolve funcionário fora do escopo (SC-002)
- [ ] T108 [P] [US3] Escrever `system-ponto-digital-servioeste-back/tests/test_usuarios.py`: só o administrador gerencia usuários; CPF é obrigatório para administrador e RH; gestor não aceita `todas_unidades`; desativar o último administrador ativo → 409; redefinir o segundo fator apaga o segredo e fica auditado; usuário promovido a RH precisa cadastrar o segundo fator no próximo acesso e, sem CPF, a promoção é recusada com 400
- [ ] T109 [US3] Implementar `system-ponto-digital-servioeste-back/app/api/routes/usuarios.py` (CRUD com escopo, redefinir segundo fator)
- [ ] T110 [US3] Implementar `system-ponto-digital-servioeste-back/app/api/routes/auditoria.py` (`GET /auditoria` com filtros e paginação por `antes_de`) e `system-ponto-digital-servioeste-back/app/api/routes/arp.py` (`GET /arp/eventos` com resumo sem CPF)
- [ ] T111 [US3] Garantir no código, além da tabela, que o gestor nunca recebe `atestado.abrir` (FR-013), com teste em `system-ponto-digital-servioeste-back/tests/test_permissoes.py`
- [ ] T112 [US3] Ligar `system-ponto-digital-servioeste-front/src/features/usuarios/` e `AuditoriaPage.tsx` à API real e repetir o item 6 do roteiro do quickstart

---

## Fase 13: História 4, feriados por unidade (backend + integração)

- [ ] T113 [P] [US4] Escrever `system-ponto-digital-servioeste-back/tests/test_feriados.py`: `GET /feriados?unidade_id=` soma nacionais, estaduais da UF, municipais do município e os da unidade, só ativos; campos condicionais obrigatórios por abrangência; desativar não apaga; RH com escopo de uma unidade cria feriado municipal do seu município e da sua unidade, mas recebe 403 em nacional, estadual e municipal de outro município
- [ ] T114 [US4] Implementar `system-ponto-digital-servioeste-back/app/api/routes/feriados.py`, aplicando o escopo do RH (nacional e estadual só para administrador ou RH com `todas_unidades`; municipal só de municípios das unidades do escopo; `unidade` só de unidades do escopo)
- [ ] T115 [US4] Ligar `system-ponto-digital-servioeste-front/src/features/feriados/` à API real

---

## Fase 14: História 5, desligamento (backend + integração)

- [ ] T116 [P] [US5] Escrever `system-ponto-digital-servioeste-back/tests/test_desligamento.py`: o desligamento grava `empregado_exclusao` no ARP e marca `biometria_exclusao_pendente`; o funcionário sai de `situacao=ativo`; `portal_acesso_ate` = data + `portal_dias_pos_desligamento`; data anterior à admissão → 400; a lotação vigente é encerrada na data; recontratação com o mesmo CPF e nova matrícula é aceita e liga `vinculo_anterior_id`; nenhum dado é apagado
- [ ] T117 [US5] Implementar `POST /funcionarios/{id}/desligamento` em `system-ponto-digital-servioeste-back/app/api/routes/funcionarios.py` (recusa data anterior à admissão ou a mais de 90 dias no futuro; marca `biometria_exclusao_pendente = true`; encerra a lotação vigente; grava `empregado_exclusao` no ARP; tudo na mesma transação)
- [ ] T118 [US5] Ligar `DesligamentoDialog.tsx` e a recontratação à API real

---

## Fase 15: Acabamento e transversais

- [ ] T119 Remover o simulado do fluxo de produção: confirmar que `make front` (sem `VITE_MOCK`) não carrega o MSW, que `make check-no-mocks` passa no CI e que `system-ponto-digital-servioeste-front/src/mocks/` só é importado dentro do bloco `import.meta.env.DEV`
- [ ] T120 [P] Criar `infra/docker-compose.prod.yml` e `infra/Caddyfile` a partir do Hub (HTTPS automático, cabeçalhos de segurança, `/api/*` → api, SPA estática de `system-ponto-digital-servioeste-front/dist`, `COOKIE_SECURE=true`)
- [ ] T121 [P] Medir com 2.000 funcionários fictícios a busca (meta: resultado em menos de 1 s na tela, SC-005) e registrar em `specs/001-fundacao-cadastros/validacao-backend.md`
- [ ] T122 [P] Medir com um usuário do RH o cadastro completo de um funcionário (meta: menos de 2 min, SC-004) e registrar no mesmo arquivo
- [ ] T123 Rodar o roteiro completo da Etapa C de `quickstart.md` com a API real e conferir a auditoria e os eventos do ARP (NSR 1 = inclusão do empregador, seguido das inclusões, alteração e exclusão de empregados)
- [ ] T124 [P] Atualizar `README.md` e `docs/briefing/pendencias.md` (marcar que a conferência dos registros 2 e 5 do Anexo V fica para a feature 009)
- [ ] T125 Rodar `/speckit-analyze` e resolver as divergências antes de considerar a feature pronta

---

## Dependências e ordem de execução

### Dependências entre fases

- **Fase 1 (Setup)**: sem dependências.
- **Fase 2 (fundação do frontend)**: depende da 1. Bloqueia as fases 3 a 7.
- **Fases 3 a 7 (telas por história)**: dependem da 2. Podem ir em paralelo; na ordem de prioridade: 3 → 4 → 5 → 6 → 7.
- **Fase 8 (validação)**: depende das fases 3 a 7 que forem entrar nesta entrega. **Bloqueia toda a Parte B.**
- **Fase 9 (fundação do backend)**: depende da 8. Bloqueia as fases 10 a 14.
- **Fases 10 a 14 (backend por história)**: dependem da 9.
- **Fase 15 (acabamento)**: depende das histórias entregues.

### Dependências entre histórias

- **US1** (estrutura): independente.
- **US2** (funcionários): usa unidades e setores da US1; no simulado, os dados de `mocks/dados.ts` permitem fazê-la antes da US1.
- **US3** (acesso): o filtro de escopo (T093) é da fundação; a US3 traz as telas de usuários e auditoria e a prova de que o filtro vale em tudo.
- **US4** (feriados): usa unidades da US1.
- **US5** (desligamento): estende a ficha da US2.

### Dentro de cada história

- Simulado (handlers) → api.ts → formulários → página → teste de tela.
- No backend: teste primeiro (deve falhar) → rota → integração da tela.

### Oportunidades de paralelismo

- Setup: T002, T006, T007, T008, T009, T010, T011 e T012 em paralelo depois de T001.
- Fundação do frontend: T013, T014, T015, T017 e T018 em paralelo.
- Cada história: handlers de mock e utilitários (marcados [P]) em paralelo com o teste da tela.
- Fundação do backend: T081 a T085 (testes) em paralelo; T089, T090 e T091 em paralelo.
- Com duas pessoas: uma faz US1 + US4, a outra US2 + US5; a US3 fecha a parte P1.

---

## Exemplo de paralelismo: História 2

```bash
# Em paralelo (arquivos diferentes):
Tarefa: "T038 handlers de funcionários em system-ponto-digital-servioeste-front/src/mocks/handlers/funcionarios.ts"
Tarefa: "T039 handlers de tipos de vínculo em system-ponto-digital-servioeste-front/src/mocks/handlers/tipos-vinculo.ts"
Tarefa: "T047 teste de tela em system-ponto-digital-servioeste-front/tests/funcionarios.test.tsx"

# No backend, primeiro o teste (deve falhar), depois a rota:
Tarefa: "T103 system-ponto-digital-servioeste-back/tests/test_funcionarios.py"
Tarefa: "T105 system-ponto-digital-servioeste-back/app/api/routes/funcionarios.py"
```

---

## Estratégia de implementação

### MVP primeiro

1. Fases 1 e 2 (setup e fundação do frontend).
2. Fases 3, 4 e 5 (as três histórias P1) com dados simulados.
3. **Fase 8: validar com a equipe.**
4. Fase 9 (fundação do backend com testes antes).
5. Fases 10, 11 e 12 (P1 de ponta a ponta). **Esse é o MVP da feature.**

### Entrega incremental

- Depois do MVP: Fases 6/13 (feriados) e 7/14 (desligamento), que podem ser validadas juntas numa segunda rodada
  da Fase 8.
- Cada história integrada é demonstrável sozinha; nenhuma desfaz a anterior.

### Com duas pessoas

1. Juntas: Fases 1, 2, 8 e 9.
2. Em paralelo: pessoa A com US1 e US4; pessoa B com US2 e US5.
3. Juntas: US3 e a Fase 15.

---

## Notas

- Commits por tarefa ou grupo lógico, no padrão `<prefixo em inglês>: <descrição em português>`, sem co-author.
- Nunca commitar `.env`, chaves, dumps ou dados reais de funcionários.
- Nenhuma foto real e nenhum CPF real nos dados simulados ou de teste.
- Nos testes do backend, confirmar que falham antes de implementar.
