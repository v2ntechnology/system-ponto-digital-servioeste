# Glossário

Conceitos do Ponto Digital explicados em linguagem simples. Serve para a equipe, para conversas com o RH e para a
tela de conceitos da área de desenvolvimento. Cada termo tem uma seção própria (`## Termo`) e um resumo de uma linha
logo abaixo.

## NSR

**Número Sequencial de Registro.** Contador exigido pela Portaria 671 que numera tudo o que é gravado no registro legal de ponto.

Cada coisa gravada no [ARP](#arp) recebe um número em sequência: 1, 2, 3, 4… Isso vale para cada batida de ponto e
também para os eventos de cadastro.

| NSR | Evento |
|---|---|
| 1 | Inclusão do empregador (quando o estabelecimento é cadastrado) |
| 2 | Inclusão do funcionário Ana |
| 3 | Inclusão do funcionário Bruno |
| 4 | Batida de entrada da Ana às 07:58 (a partir da feature 003) |
| 5 | Alteração do nome do Bruno |

Regras da Portaria:

- **Um contador por [estabelecimento](#estabelecimento) (CNPJ).** Cada filial tem a sua sequência.
- **Começa em 1 e sobe de 1 em 1, sem pular número.** Uma sequência 4, 5, 7 indica que o registro 6 sumiu ou foi
  apagado.
- **Nunca volta atrás.** O que foi gravado não é editado nem apagado. Uma correção é um registro novo, com número
  novo.

Para que serve: o NSR aparece no [comprovante](#comprovante) de cada batida e no [AFD](#afd). Com ele, o auditor
fiscal confere que a sequência está completa e que ninguém mexeu nos registros. Junto com o
[hash encadeado](#hash-encadeado), é o que prova que o ponto não foi adulterado.

No sistema: o selo "NSR n" na tela de Estrutura mostra o último número usado em cada estabelecimento. Ele sobe ao
cadastrar o estabelecimento, incluir ou alterar um funcionário e transferir alguém entre estabelecimentos. Na
feature 003, cada batida de ponto também passa a consumir um número da mesma sequência.

## ARP

**Armazenamento de Registro de Ponto.** O "livro" legal onde ficam as batidas e os eventos de cadastro, que nunca pode ser alterado nem apagado.

Guarda as marcações e os eventos exigidos pela Portaria (inclusão e alteração do empregador; inclusão, alteração e
exclusão de empregados; ajustes de relógio). Ninguém altera nem apaga nada no ARP, nem o administrador do sistema
(Princípio III da constituição). O banco de dados recusa essas operações.

## REP-P

**Registrador Eletrônico de Ponto via Programa.** O tipo de sistema de ponto que estamos construindo, segundo a Portaria 671.

É um ponto feito por software (tablet e app), sem relógio físico. Para ter validade legal, precisa de registro no
INPI e de Atestado Técnico. Sem isso, a folha de papel continua em paralelo (Princípio XI).

## REP e PTRP

**As duas partes do sistema que a Portaria separa.** O REP grava as batidas; o PTRP trata e calcula a jornada.

- **REP** (registro): recebe as marcações, grava o ARP, emite o comprovante e gera o AFD.
- **PTRP** (Programa de Tratamento de Registro de Ponto): faz os cálculos de jornada, o espelho de ponto e o AEJ.
  Nunca gera o AFD.

## AFD

**Arquivo Fonte de Dados.** Arquivo de texto no leiaute oficial com tudo o que está no ARP, uma linha por registro.

É o que a fiscalização pede para auditar o ponto. Sai assinado digitalmente (arquivo `.p7s`) com o certificado
ICP-Brasil da empresa, o que prova que ninguém alterou o conteúdo. Gerado na feature 009.

## AEJ

**Arquivo Eletrônico de Jornada.** Arquivo oficial com a jornada já tratada: horários contratuais, horas trabalhadas, faltas, abonos.

Diferente do AFD, que tem só as batidas, o AEJ traz o resultado dos cálculos. É gerado pelo PTRP e também é
assinado. Feature 009.

## Comprovante

**Recibo de cada batida.** PDF que o funcionário pode acessar sempre, sem pedir a ninguém.

Traz os campos do art. 79 da Portaria, incluindo o NSR e o hash, e é assinado eletronicamente (PAdES). O sistema
precisa disponibilizar pelo menos os comprovantes das últimas 48 horas. Feature 003.

## Espelho de ponto

**Relatório do período do funcionário.** Mostra as batidas originais, os ajustes e o resultado da jornada.

O funcionário consulta no portal e pode precisar dar ciência, dependendo da resposta da pendência `RH-22`.

## Hash encadeado

**"Lacre" de cada registro, ligado ao registro anterior.** Se alguém alterar uma linha antiga, a corrente quebra e a alteração aparece.

Cada registro guarda um código (SHA-256) calculado a partir do seu conteúdo e do código do registro anterior. Mudar
qualquer letra de um registro antigo muda o código dele e de todos os seguintes. Isso torna detectável até uma
alteração feita por quem administra o banco (Princípio IV). Vale para o ARP e para a trilha de auditoria.

## Trilha de auditoria

**Histórico de quem fez o quê e quando.** Registra cadastros, alterações, acessos a dados pessoais e tentativas negadas.

Diferente do ARP, que é o registro legal do ponto, a auditoria é o controle interno do sistema: quem abriu a ficha
de quem, quem tentou acessar algo fora do seu escopo, quem trocou uma senha. Também não pode ser apagada.

## Estabelecimento

**O CNPJ (ou CPF, CAEPF, CNO) com numeração própria de NSR.** É a identidade legal de onde o ponto é registrado.

Uma empresa pode ter vários estabelecimentos. Se cada uma das 18 unidades tem CNPJ próprio ainda é a pendência
`RH-03`.

## Unidade

**O local físico de trabalho.** Recebe setores, funcionários e feriados.

Cada unidade aponta para um estabelecimento. Várias unidades podem apontar para o mesmo estabelecimento, se
compartilharem o CNPJ.

## Lotação

**Onde o funcionário está trabalhando: unidade e setor, com data de início e fim.**

Transferir alguém fecha a lotação atual no dia anterior e abre uma nova. O histórico fica guardado, e o cálculo de
períodos passados continua usando a lotação da época.

## Vigência

**Período em que uma regra ou vínculo vale.** Data de início e, opcionalmente, de fim.

Escalas, regras de cálculo, lotações e configurações têm vigência. Mudar uma regra cria uma nova vigência e nunca
altera o resultado de períodos passados (Princípio VI).

## Escopo

**O pedaço da empresa que cada usuário do painel enxerga.**

- **Administrador:** tudo.
- **RH:** as unidades atribuídas a ele, ou "todas as unidades".
- **Gestor:** setores e/ou unidades inteiras atribuídos a ele.

Funcionário fora do escopo aparece como "não encontrado", para não revelar que existe, e a tentativa fica na
auditoria.

## Segundo fator (MFA)

**Código de 6 dígitos de um app no celular, pedido além da senha.** Obrigatório para Administrador e RH.

Funciona com Google Authenticator, Microsoft Authenticator ou Aegis. No primeiro acesso a pessoa escaneia um QR
code; depois, digita o código que muda a cada 30 segundos.

## Dados simulados

**Dados fictícios que o front-end usa antes de existir o back-end.** Nunca chegam à produção.

Ligados com `npm run dev:mock`. Nomes, CPFs e CNPJs são inventados (com dígitos verificadores válidos), sem fotos.
O comando `make check-no-mocks` garante que nada disso entra no build de produção (Princípio XII).

## Marcação nunca é bloqueada

**O sistema nunca impede uma batida de ponto.** Casos suspeitos são gravados e vão para revisão do RH.

A Portaria proíbe restringir a marcação por horário, escala, local ou falha de reconhecimento facial (Princípio
II). Rosto não reconhecido, por exemplo, vira batida por matrícula e PIN com foto, pendente de revisão.
