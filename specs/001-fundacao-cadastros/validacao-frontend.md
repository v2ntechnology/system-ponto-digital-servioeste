# Validação do frontend (Fase 8)

**Data:** 2026-11-06
**Como:** `npm run dev:mock` (dados simulados), seguindo a Etapa A de [quickstart.md](quickstart.md).
**Resultado:** aprovado pela equipe, sem ajustes pendentes. Liberada a Parte B (backend).

## O que foi validado

| Item do roteiro | Situação |
|---|---|
| 1. Login dos três perfis e segundo fator (Administrador e RH) | Aprovado |
| 2. Estrutura: empresa → estabelecimento → unidade → setor, com NSR | Aprovado |
| 3. Funcionários: cadastro, CPF, busca, transferência, local de prestação | Aprovado |
| 4. Escopo: gestor só vê o próprio setor; fora do escopo = "não encontrado" | Aprovado |
| 5. Usuários e auditoria (último administrador, ARP íntegro) | Aprovado |
| 6. Feriados por abrangência (nacional em vermelho) | Aprovado |
| 7. Desligamento e recontratação | Aprovado |
| 8. Estados (carregando, vazio, erro), tema claro/escuro, largura de celular | Aprovado |

## Ajustes feitos durante as fases (antes desta validação)

- Lista de escolha nativa trocada por um Select no visual do sistema, com segunda linha de detalhe e busca.
- São Cristóvão no Rio de Janeiro/RJ (D-61), com os feriados do RJ e do município do Rio.
- Feriados nacionais destacados em vermelho, como no calendário.
- Contrato: `cpf` em `UsuarioAlteracao`, `cpf_mascarado` em `Usuario` e `detalhes` da auditoria com chaves livres.

## Regras decididas na implementação (conferir quando o RH responder)

- Transferência entre estabelecimentos diferentes gera exclusão no antigo e inclusão no novo, no ARP.
- Só a mudança de nome do empregado gera alteração no ARP; vínculo, tipo de registro e e-mail ficam só na auditoria.
- Feriado criado só muda de nome; para corrigir data ou abrangência, desativa-se e cria-se outro.
- Desligamento com data futura deixa a pessoa ativa até a data; ela vira "desligada" no dia seguinte.
