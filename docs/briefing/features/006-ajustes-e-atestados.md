# 006: Ajustes, abonos e atestados

## Objetivo

Corrigir a jornada sem tocar na marcação original e receber atestados pelo sistema, com controle de quem vê e quem aprova.

## Atores

Funcionário, RH e Gestor.

## Histórias

### P1: Ajuste de marcação

**Dado** uma marcação esquecida, **quando** o RH lança o ajuste com motivo, **então** a marcação original continua intacta, e o espelho mostra a batida original e o ajuste.

### P1: Revisão de batidas pendentes

**Dado** uma batida por PIN ou offline com verificação falha, **quando** o RH a analisa, **então** registra a decisão e o motivo.

### P1: Envio de atestado

**Dado** um funcionário afastado, **quando** ele envia a foto do atestado pelo app ou pelo portal, **então** o RH recebe o documento para análise, e o funcionário acompanha o status.

### P1: Análise de atestado

**Dado** um atestado enviado, **quando** o RH aprova, **então** o abono é lançado no período informado, sem nenhum abono automático.

### P2: Privacidade

**Dado** um gestor, **quando** ele consulta um afastamento, **então** vê somente o status e as datas.

## Requisitos

- **FR-001:** Ajustes são registros separados, com tipo, motivo, autor, data e vínculo com a marcação ou dia.
- **FR-002:** Motivo é obrigatório, e anexo pode ser exigido por tipo.
- **FR-003:** Cadastrar tipos de falta, abono e afastamento.
- **FR-004:** Funcionário não altera marcações nem ajustes.
- **FR-005:** Atestado aceita foto ou PDF, com datas de início e fim.
- **FR-006:** Estados do atestado: enviado, em análise, aprovado, recusado, com motivo.
- **FR-007:** Apenas RH autorizado abre atestados. Cada abertura gera auditoria.
- **FR-008:** Atestados ficam criptografados e seguem prazo de retenção configurável.
- **FR-009:** Ajustes recalculam a jornada apenas em período aberto; em período fechado, exigem reabertura.
- **FR-010:** Exibir marcações originais, ajustadas e pré-assinaladas de acordo com o que o espelho e o AEJ exigem.

## Critérios de sucesso

- Nenhum ajuste altera dados do ARP, comprovado por teste automatizado.
- Todo atestado tem histórico completo.
- O gestor não consegue baixar nem visualizar atestados por nenhum caminho.

## Fora de escopo

Validação automática de autenticidade do atestado, leitura automática do CID e integração com o médico do trabalho.

## Pendências

`RH-18`, `RH-19`, `RH-20`, `RH-21`, `RH-29`.
