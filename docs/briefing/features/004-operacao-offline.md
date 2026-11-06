# 004: Operação sem internet

## Objetivo

Garantir que motoristas em áreas sem sinal e tablets sem conexão continuem registrando o ponto, sem perda de dados e com identificação verificável.

## Atores

Motorista, funcionário da sede e RH.

## Histórias

### P1: Motorista sem sinal

**Dado** um motorista sem internet, **quando** ele tira a selfie e confirma, **então** a marcação fica criptografada no aparelho, com a hora calculada e o GPS disponível, e o app avisa que ela ainda será enviada.

### P1: Sincronização

**Dado** um aparelho com marcações na fila, **quando** a conexão volta, **então** elas são enviadas sozinhas, sem duplicar, a hora original é preservada, e a verificação facial é feita nesse momento.

### P1: Tablet sem internet

**Dado** um tablet sem conexão, **quando** um funcionário vai bater ponto, **então** ele informa a matrícula, o tablet captura a foto, e a identidade é verificada ao sincronizar.

### P2: Verificação falhou depois do envio

**Dado** uma marcação offline cuja foto não confere, **quando** ela é sincronizada, **então** continua registrada e entra na fila de revisão do RH.

### P2: Aparelho parado

**Dado** um coletor com marcações sem enviar há muito tempo, **quando** o limite configurado é ultrapassado, **então** o RH vê o alerta no painel.

## Requisitos

- **FR-001:** Tratar o modo offline como exceção, identificando essas marcações em relatório.
- **FR-002:** Guardar a fila no aparelho com criptografia e resistência a fechamento do app ou desligamento.
- **FR-003:** Enviar no primeiro momento em que o coletor voltar a ficar online.
- **FR-004:** Tornar o envio idempotente, com identificador único gerado no aparelho.
- **FR-005:** Registrar separadamente a hora da marcação e a hora da gravação no servidor.
- **FR-006:** Calcular a hora offline a partir da última sincronização confiável. Mudança suspeita no relógio gera revisão, sem bloquear a marcação.
- **FR-007:** Atribuir o NSR no servidor, na gravação.
- **FR-008:** Disponibilizar o comprovante depois da sincronização, informando ao funcionário que ele ainda ficará disponível.
- **FR-009:** Mostrar quantas marcações estão pendentes de envio.
- **FR-010:** Remover os dados locais depois da confirmação de gravação.

## Critérios de sucesso

- Em teste com queda de conexão, nenhuma marcação é perdida nem duplicada.
- Após a conexão voltar, as marcações chegam ao servidor em até 1 minuto com o app aberto.
- Marcações offline ficam identificáveis no painel e em relatório.

## Fora de escopo

Reconhecimento facial 1:N dentro do tablet sem internet.

## Pendências

D-24 é provisória e deve ser revista se o tablet ficar offline com frequência (`RH-37`).
