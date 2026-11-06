# Referência de layout

O painel do RH e o portal do funcionário seguem a linguagem visual dos sistemas internos da Servioeste, para parecerem da mesma família:

1. **Servioeste Hub** (`../../automacoes-servioeste/System-servioeste-hub-web`): **referência principal**, por ser a mais atualizada.
2. **Radar Servioeste** (`../../automacoes-servioeste/System-servioeste-prospecta-web`): referência secundária. Em caso de divergência, vale o Hub.

Use `/speckit-plan` com este arquivo junto do `plano-tecnico.md`. Antes de criar uma tela, abra o componente equivalente do Hub (`frontend/src/`) e reaproveite o padrão.

## Direção de design

- **Minimalista.** Tema claro com fundo **branco** e tema escuro com fundo **preto**. Também há a opção "sistema", com a escolha salva no navegador.
- **Verde Servioeste** como cor de ação e destaque, sempre chapado: `#6ca33c` no claro e `#7fb84e` no escuro, com texto `#0a0a0a`.
  - Usado em botão principal, item ativo da navegação, item selecionado, ícones de título de seção, anel de foco, ponto de status e seleção de texto.
  - **Sem brilhos, degradês ou "pontos de luz" verdes**, e sem verde como fundo de tela inteira.
- Superfícies chapadas com borda (`rounded-xl border`, `bg-card`). KPIs só com borda. Raio base `0.75rem`.
- Fonte **Rubik** (`@fontsource/rubik`). Ícones **lucide-react**. Favicon "S" verde.
- Interface em português do Brasil.

## Tokens de cor (copiar de `frontend/src/index.css` do Hub)

| Token | Claro | Escuro |
|---|---|---|
| `--background` | `#ffffff` | `#000000` |
| `--foreground` | `#0a0a0a` | `#fafafa` |
| `--card` | `#fafafa` | `#0d0d0d` |
| `--muted` / `--secondary` / `--accent` | `#f4f4f5` | `#161616` / `#1a1a1a` |
| `--muted-foreground` | `#71717a` | `#a1a1aa` |
| `--border` | `#e4e4e7` | `#222222` |
| `--primary` / `--brand` / `--ring` | `#6ca33c` | `#7fb84e` |
| `--destructive` | `#dc2626` | `#f87171` |

Paleta secundária do site, para estados e gráficos: `#8bc34a`, `#1b5e20`, `#33691e`, `#f1f8e9`, `#dcedc8`, `#263238`, `#616161`.

## Estrutura das telas (padrão do Hub)

- **Shell das telas logadas** (`HubShell`): `TopBar` em cima e um painel principal `rounded-2xl border bg-card` com rolagem sem barra visível (`.no-scrollbar`). **Sem barra lateral.**
- **TopBar:** à esquerda, pessoa com avatar, nome e subtítulo; no meio, navegação em pílulas (`rounded-full bg-foreground/5`, item ativo `bg-brand`); à direita, informações rápidas, relógio e menu hambúrguer (`UserMenu`) com perfil, configurações, tema e sair.
- **Login:** painel visual de um lado (foto da Servioeste escurecida + quadrado do "S" + nome do sistema) e formulário limpo do outro, com traço verde sob "Entrar".
- **Componentes base** no estilo shadcn/ui (`new-york`, `baseColor: neutral`, CSS variables): `button`, `input`, `label`, `avatar`, utilitário `cn` (`clsx` + `tailwind-merge`), variantes com `class-variance-authority`.
- Estados de carregamento, erro e vazio em todas as telas (Princípio XII).

## Arquivos para reaproveitar do Hub

| O quê | Onde no Hub |
|---|---|
| Tokens, tema e utilitários CSS | `frontend/src/index.css` |
| Tema claro/escuro/sistema | `frontend/src/lib/theme.tsx`, `components/layout/ThemeToggle.tsx` |
| Moldura e barra do topo | `components/layout/HubShell.tsx`, `TopBar.tsx`, `UserMenu.tsx`, `Brand.tsx` |
| Componentes base | `components/ui/` |
| Login | `pages/LoginPage.tsx`, `features/auth/LoginVisual.tsx` |
| Marca (logo, favicon, ícones, fonte) | `docs/img/servioeste/`, `frontend/public/` |
| Referências visuais | `docs/img/design/` |
| Configuração do editor | `.vscode/settings.json`, `.vscode/extensions.json` |

## O que é específico do Ponto Digital

- O nome no `Brand` passa a ser "Servioeste **Ponto**".
- A navegação do RH e a do portal do funcionário são diferentes (perfis Administrador, RH, Gestor e Funcionário).
- Tablet e app (Expo) não seguem este arquivo diretamente, mas usam os mesmos tokens de cor e a mesma fonte.
