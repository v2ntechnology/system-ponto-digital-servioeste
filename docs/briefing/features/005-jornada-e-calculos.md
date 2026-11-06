# 005: Escalas e cálculo de jornada

## Objetivo

Transformar marcações em jornada tratada, com horas trabalhadas, extras, faltas, atrasos, adicional noturno e banco de horas, usando regras configuráveis pelo RH.

## Atores

RH.

## Histórias

### P1: Cadastro de escala

**Dado** um usuário do RH, **quando** ele cadastra uma escala como horário comercial, 12x36 ou turno da noite, **então** pode vinculá-la a funcionários com data de início e fim.

### P1: Troca de escala sem afetar o passado

**Dado** um funcionário que mudou de escala, **quando** o RH cria um novo vínculo, **então** os períodos anteriores continuam calculados pela escala antiga.

### P1: Cálculo do dia

**Dado** as marcações de um dia, **quando** o sistema processa a jornada, **então** apresenta horas trabalhadas, faltas, atrasos, extras e adicional noturno, aplicando as regras do grupo do funcionário.

### P1: Regra configurável

**Dado** uma regra de tolerância ou percentual, **quando** o RH cria uma nova versão com vigência, **então** ela vale somente a partir da data definida.

### P2: Banco de horas

**Dado** um grupo com banco de horas, **quando** um período é calculado, **então** o sistema mostra créditos, débitos, saldo e vencimentos.

### P2: Controle do motorista

**Dado** um motorista com eventos detalhados, **quando** a jornada é calculada, **então** direção, espera e descanso aparecem separados.

## Requisitos

- **FR-001:** Cadastrar escalas fixas e cíclicas, com jornadas que atravessem a meia-noite.
- **FR-002:** Vincular funcionário e escala com vigência.
- **FR-003:** Definir por escala se o intervalo é registrado ou pré-assinalado.
- **FR-004:** Configurar regras por grupo: tolerância, percentuais de hora extra, adicional noturno, hora noturna reduzida, feriados, descanso semanal e banco de horas.
- **FR-005:** Usar valores iniciais da CLT até a confirmação do RH, como 5 minutos por marcação e 10 minutos por dia.
- **FR-006:** Versionar regras por data de vigência.
- **FR-007:** Considerar feriados da unidade.
- **FR-008:** Oferecer os tipos de evento do motorista: entrada, saída, intervalo, direção, espera e descanso. Novos tipos não exigem mudar o modelo de dados.
- **FR-009:** Gerar alertas de jornada, como descanso insuficiente entre turnos e intervalo não cumprido.
- **FR-010:** Recalcular períodos abertos quando houver ajuste, mantendo períodos fechados intactos.
- **FR-011:** Mostrar como cada resultado foi obtido, com regras e versões aplicadas.

## Critérios de sucesso

- Casos reais de todas as escalas de São Cristóvão têm testes automatizados.
- Em pelo menos um fechamento em paralelo com o papel, as diferenças são zero ou explicadas.
- Alterar uma regra não muda nenhum período fechado.

## Fora de escopo

Cálculo de salário e geração da folha.

## Pendências

`RH-10`, `RH-11`, `RH-12`, `RH-13`, `RH-14`, `RH-15`, `RH-16`, `RH-17`.
