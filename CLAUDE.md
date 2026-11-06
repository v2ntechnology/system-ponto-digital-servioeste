# Ponto Digital Servioeste

Sistema de ponto REP-P (Portaria 671/2021). Briefing completo em `docs/briefing/` (leia o `README.md` de lá antes de qualquer feature). A constituição do projeto fica em `.specify/memory/constitution.md` e prevalece sobre specs, planos e tarefas.

## Fluxo de trabalho

- Usamos o Spec Kit: `/speckit-constitution`, `/speckit-specify`, `/speckit-clarify`, `/speckit-plan`, `/speckit-tasks`, `/speckit-analyze`, `/speckit-implement`.
- As specs geradas ficam em `specs/`. Nunca coloque o briefing lá.
- Documentação, specs e textos da interface em português do Brasil.

## Regras de commit

- Conventional Commits: prefixo em inglês e descrição em português depois dos dois-pontos.
  - Ex.: `feat: adiciona cadastro de unidades`, `fix: corrige cálculo de tolerância`, `docs: atualiza pendências do RH`, `chore: configura spec kit`.
  - Prefixos: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`, `perf`, `build`, `ci`.
- **Nunca** adicionar `Co-Authored-By` (Claude, Codex, Cursor ou qualquer ferramenta de IA) nem rodapés de "Generated with" em commits ou PRs.
- **Nunca** commitar nada sensível: `.env`, certificados e chaves (`.pfx`, `.p12`, `.pem`, `.key`), dumps de banco, fotos, templates faciais, atestados, CPFs reais ou documentos do RH. Confira `git status` antes de cada commit.
