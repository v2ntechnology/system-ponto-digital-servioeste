# 003: Registro de ponto e comprovante

## Objetivo

Permitir que cada funcionário registre o ponto de forma rápida, confiável e válida para a Portaria 671, recebendo acesso ao comprovante.

## Atores

Funcionário da sede (tablet) e motorista ou equipe externa (app).

## Histórias

### P1: Batida no tablet

**Dado** um funcionário cadastrado na sede, **quando** ele olha para o tablet, **então** o sistema mostra o nome, ele confirma, e a marcação é gravada com hora confiável.

### P1: Batida no app

**Dado** um motorista com o celular da empresa, **quando** ele tira uma selfie e confirma, **então** a marcação é gravada com a localização daquele momento.

### P1: Rosto não reconhecido

**Dado** um rosto não reconhecido depois de algumas tentativas, **quando** a pessoa informa matrícula e PIN, **então** a marcação é gravada com foto e fica pendente de revisão do RH.

### P1: Comprovante

**Dado** uma marcação gravada, **quando** ela é concluída, **então** o funcionário consegue acessar o comprovante em PDF sem solicitar nem depender de autorização.

### P2: Eventos do motorista

**Dado** um motorista em jornada, **quando** ele muda de atividade, **então** consegue registrar início e fim de direção, espera e descanso, além de entrada, saída e intervalos.

### P2: Tablet como quiosque

**Dado** um tablet na entrada, **quando** ele está em uso normal, **então** fica preso ao aplicativo e identificado como coletor.

## Requisitos

- **FR-001:** Nunca bloquear a marcação por horário, escala, local ou resultado do reconhecimento.
- **FR-002:** Exibir relógio digital com horas, minutos e segundos no momento da marcação.
- **FR-003:** Obter data e hora de fonte sincronizada com a Hora Legal Brasileira, com variação máxima de 30 segundos.
- **FR-004:** Gravar no ARP: NSR, CPF, data e hora da marcação com fuso, data e hora da gravação com fuso, identificação do coletor e hash SHA-256.
- **FR-005:** Numerar o NSR em sequência própria por estabelecimento, em incrementos de 1.
- **FR-006:** Não permitir alteração nem exclusão de marcações.
- **FR-007:** Coletar GPS apenas no momento da marcação do app, sem rastreamento e sem restrição por local.
- **FR-008:** Se o GPS estiver indisponível, gravar a marcação e registrar a ausência da localização.
- **FR-009:** Disponibilizar comprovante em PDF com os campos do art. 79, incluindo hash, e assinatura eletrônica PAdES.
- **FR-010:** Permitir extrair os comprovantes das últimas 48 horas, no mínimo.
- **FR-011:** Permitir que o motorista registre os tipos de evento definidos na feature 005.
- **FR-012:** Guardar o resultado do reconhecimento e o método usado (rosto ou PIN) em dados complementares ao ARP.
- **FR-013:** Evitar duplicidade por toque repetido, sem impedir marcações legítimas próximas.

## Critérios de sucesso

- Uma batida normal no tablet leva menos de 10 segundos.
- Nenhuma marcação confirmada ao funcionário se perde.
- 100% das marcações geram comprovante acessível.
- Todas as batidas com PIN aparecem na fila de revisão.

## Fora de escopo

Cerca virtual, alerta de local, rastreamento durante a jornada e comprovante impresso.

## Pendências

`RH-17`, `RH-31`, `RH-37`, `RH-38`.
