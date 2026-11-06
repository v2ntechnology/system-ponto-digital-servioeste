# Ponto Digital Servioeste: pacote para o Spec Kit

Sistema de ponto próprio (REP-P, Portaria 671/2021), feito do zero para substituir a folha de papel. Piloto na unidade de São Cristóvão, com expansão para as 18 unidades.

## O que tem aqui

| Arquivo | Para que serve | Onde usar |
|---|---|---|
| `constitution.md` | Princípios que nenhuma feature pode violar | `/speckit.constitution` |
| `features/001` a `009` | O que construir e por quê, sem tecnologia | `/speckit.specify` (uma por vez) |
| `plano-tecnico.md` | Stack, arquitetura e restrições técnicas | `/speckit.plan` (em cada feature) |
| `decisoes.md` | Registro de todas as decisões tomadas | Consulta |
| `pendencias.md` | Perguntas abertas, com os mesmos códigos do `.docx` para o RH | `/speckit.clarify` e consulta |
| `glossario.md` | Conceitos explicados em linguagem simples (NSR, ARP, AFD…) | Consulta e tela de conceitos em `/dev` |
| `layout.md` | Referência visual (Servioeste Hub e Radar) | `/speckit.plan` (telas) |

Coloque esta pasta em `docs/briefing/` do repositório. Não use a pasta `specs/` da raiz, porque o Spec Kit gera os arquivos dele lá.

## Como usar

1. Inicie o Spec Kit na raiz do repositório:

   ```bash
   specify init . --ai claude
   ```

   Troque `claude` pelo agente que vocês forem usar.

2. Crie a constituição uma única vez:

   ```text
   /speckit.constitution Use docs/briefing/constitution.md como fonte. Preserve os princípios e os termos em português.
   ```

3. Para cada feature, na ordem abaixo:

   ```text
   /speckit.specify  Use docs/briefing/features/001-fundacao-e-cadastros.md como fonte. Escreva em português.
   /speckit.clarify
   /speckit.plan     Siga docs/briefing/plano-tecnico.md e docs/briefing/layout.md, e consulte decisoes.md e pendencias.md.
   /speckit.tasks    Comece pelo frontend com dados simulados e só depois inclua o backend, conforme a "Ordem de implementação" do plano técnico.
   /speckit.analyze
   /speckit.implement
   ```

Pendência sem resposta vira `[NEEDS CLARIFICATION]` na spec. Se ela travar a feature, implemente como regra configurável ou use o valor provisório indicado, sem fixar nada no código.

## Ordem das features

| Ordem | Feature | Depende de |
|---|---|---|
| 001 | Fundação e cadastros | Nenhuma |
| 002 | Reconhecimento facial e cadastro biométrico | 001 |
| 003 | Registro de ponto e comprovante | 001, 002 |
| 004 | Operação sem internet | 003 |
| 005 | Escalas e cálculo de jornada | 001, 003 |
| 006 | Ajustes, abonos e atestados | 005 |
| 007 | Painel do RH e fechamento | 005, 006 |
| 008 | Portal do funcionário | 003, 006, 007 |
| 009 | Arquivos legais e exportação para a folha | 003, 005, 007 |

## Antes de começar

- **Facial:** o motor ainda não foi escolhido. A feature 002 foi escrita para funcionar com qualquer um, e os testes comparativos fazem parte dela.
- **Legislação:** a conferência usou a redação do Anexo IX e as Perguntas e Respostas do Ministério publicadas em fontes secundárias. Antes de implementar os leiautes, baixe a versão vigente da Portaria 671 e dos Anexos V, VI, VII e IX em gov.br.
- **LGPD:** a facial obrigatória para todos precisa de validação jurídica antes de qualquer cadastro real (ver `RH-25`).
