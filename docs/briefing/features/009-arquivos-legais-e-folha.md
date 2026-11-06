# 009: Arquivos legais e exportação para a folha

## Objetivo

Gerar os documentos exigidos pela fiscalização e entregar os dados de jornada para a folha de pagamento.

## Atores

RH e Auditor-Fiscal do Trabalho (destinatário dos arquivos).

## Histórias

### P1: Gerar AFD

**Dado** um intervalo de datas e um estabelecimento, **quando** o RH gera o AFD, **então** recebe o arquivo no leiaute oficial e o arquivo de assinatura `.p7s`.

### P1: Gerar AEJ

**Dado** um período tratado, **quando** o RH gera o AEJ, **então** recebe o arquivo no leiaute oficial, assinado.

### P1: Espelho de ponto

**Dado** um funcionário e um período, **quando** o RH emite o espelho, **então** recebe um PDF com os campos exigidos pela Portaria.

### P1: Atendimento à fiscalização

**Dado** um pedido da fiscalização, **quando** o RH acessa a área de arquivos, **então** consegue gerar de imediato o que for solicitado.

### P2: Arquivo para a folha

**Dado** um período fechado, **quando** o RH exporta para a folha, **então** recebe um arquivo no formato do sistema usado.

### P2: Troca de certificado

**Dado** um certificado perto do vencimento, **quando** o limite de alerta é atingido, **então** o painel avisa, e a troca não exige mudança de código.

## Requisitos

- **FR-001:** Somente o REP gera o AFD, sempre a partir do ARP e por intervalo de datas.
- **FR-002:** AEJ e espelho são gerados pelo PTRP.
- **FR-003:** Seguir a versão vigente dos Anexos V e VI.
- **FR-004:** Usar CRC-16/KERMIT nos registros 1 a 5 do AFD.
- **FR-005:** Assinar AFD e AEJ em CAdES destacado, com `.p7s` nomeado como o arquivo original mais a extensão.
- **FR-006:** Preencher a última linha com `ASSINATURA_DIGITAL_EM_ARQUIVO_P7S`, completada com espaços até 100 caracteres.
- **FR-007:** Assinar os PDFs conforme a Portaria, com PAdES no comprovante.
- **FR-008:** Usar certificado ICP-Brasil da empresa desenvolvedora em produção e certificado de teste em desenvolvimento.
- **FR-009:** Bloquear a identificação de arquivos de teste como documentos oficiais.
- **FR-010:** Registrar em auditoria cada geração e download.
- **FR-011:** Isolar o formato da folha em um adaptador, começando por um CSV configurável até a definição do sistema.
- **FR-012:** Guardar o modelo do Atestado Técnico (Anexo VII) como referência para os responsáveis.

## Critérios de sucesso

- AFD e AEJ passam em validação independente de leiaute e assinatura.
- Um AFD gerado duas vezes para o mesmo intervalo tem o mesmo conteúdo de marcações.
- O arquivo da folha é importado sem correção manual, depois de definido o formato.

## Fora de escopo

Registro no INPI e emissão do Atestado, que são processos fora do sistema, e envio direto ao sistema da folha.

## Pendências

`RH-03`, `RH-07`, `RH-08`, `RH-09`, `RH-32`, `RH-33`, `RH-34`.
