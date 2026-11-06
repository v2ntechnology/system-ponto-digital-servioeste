# 002: Reconhecimento facial e cadastro biométrico

## Objetivo

Identificar o funcionário pelo rosto com segurança, sem amarrar o sistema a um fornecedor e tratando a biometria como dado sensível.

## Atores

RH, funcionário e equipe técnica.

## Histórias

### P1: Cadastro do rosto com aviso prévio

**Dado** um funcionário que recebeu o aviso por escrito, **quando** o RH faz o cadastro facial, **então** o sistema guarda o template criptografado, registra quem fez, quando, a versão do aviso e o motor usado.

### P1: Verificação de pessoa real

**Dado** um cadastro ativo, **quando** alguém tenta bater ponto, **então** o sistema aplica uma prova de vida simples para dificultar o uso de fotos.

### P1: Comparação de motores

**Dado** um conjunto de testes autorizado, **quando** a equipe roda a avaliação, **então** recebe falsa aceitação, falsa rejeição e tempo de resposta de cada motor, nas mesmas condições.

### P2: Troca de motor

**Dado** um novo motor, **quando** a equipe o ativa, **então** o restante do sistema não muda, e os funcionários afetados aparecem na lista de recadastro.

### P2: Exclusão no desligamento

**Dado** um funcionário desligado, **quando** o prazo definido termina, **então** os dados biométricos são apagados, e a exclusão fica registrada sem apagar as marcações.

## Requisitos

- **FR-001:** Identificar um rosto entre os funcionários elegíveis (1:N) e verificar um funcionário específico (1:1).
- **FR-002:** Isolar o motor em uma interface própria, permitindo mais de uma implementação.
- **FR-003:** Guardar template sempre que possível, evitando manter a foto do cadastro.
- **FR-004:** Associar cada template ao motor e à versão.
- **FR-005:** Limiares de decisão são configuráveis.
- **FR-006:** Permitir limitar a busca aos funcionários da unidade, caso o desempenho exija.
- **FR-007:** Registrar o resultado do reconhecimento na marcação, sem expor dados biométricos.
- **FR-008:** Oferecer exclusão de biometria por funcionário.
- **FR-009:** Bloquear cadastro de pessoas reais em produção enquanto a validação jurídica não estiver marcada como concluída.
- **FR-010:** A falha no reconhecimento nunca impede a marcação (ver feature 003).

## Critérios de sucesso

- A troca do motor não exige alterações fora do adaptador.
- A identificação no tablet termina em até 3 segundos no uso normal, medida no aparelho real.
- As taxas de erro são medidas e aprovadas pela equipe antes do piloto.

## Fora de escopo

Treinar modelo próprio, análise de emoção, idade, gênero ou qualquer outro atributo.

## Pendências

`RH-25`, `RH-26`, `RH-27`, `RH-28`, `RH-29`, `RH-30`. Motor em aberto: `D-57` em `decisoes.md`.
