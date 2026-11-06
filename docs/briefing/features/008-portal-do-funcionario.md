# 008: Portal do funcionário

## Objetivo

Dar a todo funcionário, inclusive a quem não usa celular para bater ponto, acesso aos próprios comprovantes, ao espelho e aos atestados.

## Atores

Funcionário e RH.

## Histórias

### P1: Primeiro acesso

**Dado** um funcionário cadastrado, **quando** ele acessa o portal pela primeira vez, **então** confirma a identidade de forma segura e cria a senha.

### P1: Comprovantes

**Dado** um funcionário autenticado, **quando** ele abre o histórico, **então** vê e baixa os próprios comprovantes em PDF.

### P1: Espelho

**Dado** um período disponível, **quando** o funcionário abre o espelho, **então** vê batidas e ajustes e registra a ciência, se ela for exigida.

### P2: Comprovante por e-mail

**Dado** um funcionário com e-mail que ativou a opção, **quando** uma batida é gravada, **então** recebe o comprovante por e-mail.

### P2: Atestado

**Dado** um funcionário no portal, **quando** ele envia um atestado, **então** acompanha o mesmo fluxo da feature 006.

### P2: Direitos sobre os dados

**Dado** um funcionário autenticado, **quando** ele consulta a área de privacidade, **então** encontra quais dados são tratados, para que finalidade, e por quanto tempo.

## Requisitos

- **FR-001:** Autenticar com CPF e senha, com limite de tentativas.
- **FR-002:** Oferecer primeiro acesso e recuperação de senha também a quem não tem e-mail.
- **FR-003:** Mostrar apenas dados do próprio funcionário.
- **FR-004:** Disponibilizar comprovantes sem depender de aprovação.
- **FR-005:** E-mail é opcional e nunca substitui o portal.
- **FR-006:** Funcionar bem em navegador de celular e no computador.
- **FR-007:** Registrar ciência com data, hora e versão do espelho.

## Critérios de sucesso

- Um funcionário consegue achar um comprovante em menos de 1 minuto.
- Nenhum funcionário acessa dados de outro.
- Todos do piloto concluem o primeiro acesso, com ajuda do RH quando necessário.

## Fora de escopo

Aplicativo separado para o portal, holerite e solicitação de férias.

## Pendências

`RH-22`, `RH-24`.
