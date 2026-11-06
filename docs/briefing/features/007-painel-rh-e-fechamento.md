# 007: Painel do RH e fechamento

## Objetivo

Concentrar o trabalho diário do RH e fechar cada período com segurança, sem depender de papel.

## Atores

RH, Gestor e Administrador.

## Histórias

### P1: Início do dia

**Dado** um usuário do RH, **quando** ele entra no painel, **então** vê batidas pendentes de revisão, marcações faltando, faltas, atrasos, horas extras, banco de horas e alertas de jornada.

### P1: Fechamento

**Dado** um período definido pelo RH, **quando** ele inicia o fechamento, **então** o sistema lista as pendências, permite resolvê-las e, ao confirmar, bloqueia o período e salva os cálculos.

### P1: Reabertura

**Dado** um período fechado, **quando** o RH o reabre com motivo, **então** a ação fica auditada e o período volta a aceitar ajustes.

### P2: Acompanhamento do gestor

**Dado** um gestor, **quando** ele acessa o painel, **então** vê apenas pendências e informações da sua equipe, sem poder fechar períodos.

### P2: Resumo diário

**Dado** um usuário que ativou o resumo, **quando** o dia termina, **então** ele recebe por e-mail o total de pendências, sem dados sensíveis.

## Requisitos

- **FR-001:** Filtrar por período, unidade, setor e funcionário.
- **FR-002:** Definir períodos por datas de início e fim, sem assumir mês fechado.
- **FR-003:** Mostrar o espelho por funcionário dentro do painel.
- **FR-004:** Não permitir fechar um período com pendências sem decisão explícita, registrada e justificada.
- **FR-005:** Bloquear alterações em período fechado e preservar uma cópia dos resultados.
- **FR-006:** Permitir reabertura apenas pelo perfil autorizado, com motivo.
- **FR-007:** Reunir a geração de relatórios, espelho, AFD, AEJ e arquivo da folha por período e unidade.
- **FR-008:** Registrar a ciência do funcionário conforme regra definida.
- **FR-009:** Exibir alertas no painel e, opcionalmente, em resumo diário.
- **FR-010:** Mostrar o andamento do período com ciência e pendências.

## Critérios de sucesso

- O RH completa um fechamento do piloto sem usar planilha paralela para o cálculo.
- Nenhuma alteração passa por um período fechado sem reabertura.
- A tela inicial carrega em até 3 segundos para a base do piloto.

## Fora de escopo

Painéis analíticos avançados e aplicativo próprio para gestores.

## Pendências

`RH-10`, `RH-22`, `RH-23`.
