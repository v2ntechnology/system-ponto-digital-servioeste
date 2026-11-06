# 001: Fundação e cadastros

## Objetivo

Dar ao sistema a base de empresas, unidades, pessoas, acessos e auditoria da qual todas as outras features dependem.

## Atores

Administrador, RH e Gestor.

## Histórias

### P1: Administrador cadastra a estrutura da empresa

**Dado** um administrador autenticado, **quando** ele cadastra uma empresa, uma unidade e um setor, **então** a estrutura fica disponível para vincular funcionários, e cada inclusão ou alteração fica registrada com data, hora e responsável.

### P1: RH cadastra um funcionário

**Dado** um usuário do RH, **quando** ele cadastra nome, CPF, matrícula, data de admissão, unidade, setor e tipo de registro (tablet ou app), **então** o funcionário pode ser vinculado a uma escala e a operação fica registrada.

### P1: Acesso respeita o perfil

**Dado** um gestor, **quando** ele acessa o sistema, **então** vê apenas a própria equipe ou unidade e não abre atestados.

### P2: Desligamento

**Dado** um funcionário desligado, **quando** o RH registra a data, **então** ele deixa de bater ponto, mantém o acesso que a política definir, e seus dados biométricos entram no fluxo de exclusão.

## Requisitos

- **FR-001:** Manter a hierarquia empresa → unidade → setor → funcionário.
- **FR-002:** Cada estabelecimento guarda tipo e número do identificador, razão social, endereço e demais dados exigidos pelo Anexo IX.
- **FR-003:** Inclusões e alterações do empregador, e inclusões, alterações e exclusões de empregados, são gravadas no ARP com responsável, data e hora.
- **FR-004:** CPF é único por funcionário ativo; matrícula é única por empresa.
- **FR-005:** Permitir o local de prestação de serviço quando o funcionário atuar externamente ou em instalações de terceiros.
- **FR-006:** Oferecer os perfis Administrador, RH e Gestor, com permissões configuráveis depois.
- **FR-007:** Registrar em trilha de auditoria acessos a dados pessoais e ações administrativas.
- **FR-008:** Manter calendário de feriados por unidade.
- **FR-009:** Aceitar operação com várias unidades, mesmo com o piloto em uma só.

## Critérios de sucesso

- 100% das alterações cadastrais têm autor e data registrados.
- Um gestor não consegue acessar dados de outra equipe em nenhuma tela ou API.
- São Cristóvão pode ser cadastrada e operada sem alterações que atrapalhem a inclusão das outras 17 unidades.

## Fora de escopo

Importação automática de dados de RH e integração com outras automações.

## Pendências

`RH-01`, `RH-02`, `RH-03`, `RH-04`, `RH-05`, `RH-06`.
