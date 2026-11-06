# Especificação da Feature: Fundação e cadastros

**Branch**: `main` (o projeto trabalha direto na main; a pasta da feature é `specs/001-fundacao-cadastros`)

**Criada em**: 2026-11-06

**Status**: Rascunho

**Entrada**: Descrição do usuário: "Use docs/briefing/features/001-fundacao-e-cadastros.md como fonte. Escreva em português."

## Objetivo

Dar ao sistema a base de empresas, unidades, setores, funcionários, acessos e auditoria da qual todas as outras
features dependem. O piloto acontece em São Cristóvão, mas a estrutura precisa receber as outras 17 unidades sem
retrabalho.

## Clarifications

### Session 2026-11-06

- Q: Como as unidades se relacionam com o CNPJ do empregador para fins legais? → A: Estabelecimento (identificador
  legal, com sequência de NSR própria) é separado da unidade (local físico); cada unidade aponta para um
  estabelecimento. Se cada unidade terá CNPJ próprio ainda depende de `RH-03`.
- Q: O que define quais funcionários um gestor pode ver? → A: O administrador atribui ao gestor um ou mais setores
  e/ou unidades inteiras; ele vê todos os funcionários lotados ali na data consultada.
- Q: O perfil RH enxerga todas as unidades ou só as atribuídas a ele? → A: O RH tem escopo de unidades atribuído pelo
  administrador, com a opção "todas as unidades".
- Q: Por quanto tempo o funcionário desligado continua acessando o portal? → A: Acesso somente leitura por prazo
  configurável, com valor inicial de 5 anos após o desligamento.
- Q: O login de Administrador e RH no painel deve exigir segundo fator além da senha? → A: Sim. Segundo fator
  obrigatório (app autenticador) para Administrador e RH; Gestor entra só com senha.

## Cenários de Usuário e Testes *(obrigatório)*

### História 1 - Administrador cadastra a estrutura da empresa (Prioridade: P1)

O administrador cadastra a empresa (empregador), os estabelecimentos (identificadores legais), as unidades (locais
físicos, cada uma ligada a um estabelecimento) e os setores de cada unidade.
Cada inclusão ou alteração fica registrada com data, hora e responsável, e os dados do empregador exigidos pela
Portaria 671 ficam guardados no registro legal de ponto.

**Por que esta prioridade**: sem empresa, unidade e setor não existe onde vincular funcionários, e nenhuma outra
feature funciona.

**Teste independente**: um administrador cadastra a empresa, a unidade São Cristóvão e dois setores, e consegue
consultar a estrutura e o histórico de cada alteração com autor e data.

**Cenários de aceitação**:

1. **Dado** um administrador autenticado, **quando** ele cadastra uma empresa com tipo e número do identificador,
   razão social e endereço, **então** a empresa fica disponível e a inclusão é registrada com data, hora e
   responsável.
2. **Dado** uma empresa cadastrada, **quando** o administrador cadastra um estabelecimento com tipo e número do
   identificador, razão social e endereço, **então** o estabelecimento fica disponível para receber unidades.
3. **Dado** um estabelecimento cadastrado, **quando** o administrador cadastra uma unidade com nome, endereço e
   cidade e a liga a esse estabelecimento, **então** a unidade fica disponível para receber setores, funcionários e
   feriados.
4. **Dado** uma unidade cadastrada, **quando** o administrador cadastra um setor, **então** o setor fica
   disponível para vincular funcionários.
5. **Dado** um dado do empregador, de um estabelecimento ou de uma unidade, **quando** o administrador o altera, **então** o valor anterior
   é preservado no histórico e a alteração é gravada no registro legal de ponto com responsável, data e hora.
6. **Dado** um usuário com perfil RH ou Gestor, **quando** ele tenta cadastrar ou alterar empresa, estabelecimento,
   unidade ou setor,
   **então** a ação é negada e a tentativa é registrada na auditoria.

---

### História 2 - RH cadastra um funcionário (Prioridade: P1)

O RH cadastra o funcionário com nome, CPF, matrícula, data de admissão, unidade, setor e tipo de registro (tablet
ou app). O funcionário passa a existir para as próximas features (escala, facial, marcação) e a inclusão fica
gravada no registro legal de ponto.

**Por que esta prioridade**: o funcionário é o centro de todas as outras features.

**Teste independente**: o RH cadastra um funcionário da sede (tablet) e um motorista (app), consulta os dois na
lista filtrada por unidade e setor e vê a inclusão registrada.

**Cenários de aceitação**:

1. **Dado** um usuário do RH, **quando** ele cadastra nome, CPF, matrícula, data de admissão, unidade, setor e
   tipo de registro, **então** o funcionário fica ativo e a inclusão é gravada no registro legal de ponto com
   responsável, data e hora.
2. **Dado** um CPF já usado por um funcionário ativo, **quando** o RH tenta cadastrá-lo de novo, **então** o
   sistema recusa; se o funcionário existente estiver no escopo do usuário, indica qual é; se estiver fora, mostra
   apenas "CPF já cadastrado em outra unidade, procure o administrador", sem revelar nome nem unidade.
3. **Dado** uma matrícula já usada na mesma empresa, **quando** o RH tenta cadastrá-la de novo, **então** o sistema
   recusa e indica o conflito.
4. **Dado** um CPF inválido (dígitos verificadores errados), **quando** o RH tenta salvar, **então** o sistema
   recusa e explica o erro.
5. **Dado** um funcionário que atua externamente ou em instalações de terceiros, **quando** o RH informa o local
   de prestação de serviço, **então** esse local fica associado ao funcionário com vigência.
6. **Dado** um funcionário cadastrado, **quando** o RH altera um dado (por exemplo, setor ou nome), **então** o
   valor anterior é preservado e a alteração é gravada no registro legal de ponto.

---

### História 3 - Acesso respeita o perfil (Prioridade: P1)

Cada usuário do painel vê e faz apenas o que o perfil permite. O gestor vê somente a própria equipe ou unidade e
nunca abre atestados.

**Por que esta prioridade**: o sistema trata dados pessoais e sensíveis; um vazamento entre equipes é falha de
LGPD.

**Teste independente**: um gestor de um setor tenta abrir, por qualquer tela ou endereço direto, um funcionário
de outro setor e é negado, e a tentativa aparece na auditoria.

**Cenários de aceitação**:

1. **Dado** um gestor vinculado a um setor ou unidade, **quando** ele acessa o sistema, **então** vê apenas os
   funcionários desse escopo.
2. **Dado** um gestor, **quando** ele tenta acessar um funcionário fora do seu escopo por qualquer caminho,
   **então** o acesso é negado e registrado na auditoria.
3. **Dado** um gestor, **quando** ele consulta um funcionário afastado, **então** não tem acesso ao conteúdo de
   atestados.
4. **Dado** um usuário do RH, **quando** ele consulta dados pessoais de um funcionário do seu escopo, **então** o
   acesso fica registrado na auditoria.
5. **Dado** um usuário com perfil Administrador ou RH, **quando** ele entra no painel, **então** precisa informar a
   senha e o código do app autenticador; sem o código, o acesso é negado e a tentativa é registrada.
6. **Dado** um usuário do RH com escopo de uma unidade, **quando** ele tenta acessar ou cadastrar funcionário de outra
   unidade, **então** o acesso é negado e registrado na auditoria.
7. **Dado** um administrador, **quando** ele cria um usuário do painel e atribui um perfil e um escopo, **então** o
   usuário passa a ter exatamente as permissões daquele perfil e escopo.

---

### História 4 - Feriados por unidade (Prioridade: P2)

O RH mantém o calendário de feriados de cada unidade (nacionais, estaduais e municipais), que será usado no
cálculo da jornada.

**Por que esta prioridade**: o cálculo de jornada (feature 005) depende dele, mas não bloqueia o cadastro de
pessoas.

**Teste independente**: o RH cadastra os feriados de 2027 para São Cristóvão e vê que outra unidade não herda os
feriados municipais de São Cristóvão.

**Cenários de aceitação**:

1. **Dado** uma unidade, **quando** o RH cadastra um feriado com data, nome e abrangência, **então** ele passa a
   valer apenas para as unidades da abrangência informada.
2. **Dado** um feriado nacional, **quando** ele é cadastrado uma vez, **então** vale para todas as unidades.
3. **Dado** um feriado já usado em período fechado, **quando** o RH tenta alterá-lo ou removê-lo, **então** a
   mudança não altera o resultado do período fechado.

---

### História 5 - Desligamento (Prioridade: P2)

O RH registra a data de desligamento. O funcionário deixa de bater ponto a partir do dia seguinte, mantém acesso
somente leitura ao portal pelo prazo configurado (inicialmente 5 anos), e seus dados biométricos entram no fluxo de exclusão. Nenhuma marcação é apagada.

**Por que esta prioridade**: é necessário antes do piloto, mas o piloto pode começar sem desligamentos.

**Teste independente**: o RH desliga um funcionário com marcações; ele some da lista de ativos, as marcações
continuam consultáveis e a exclusão aparece no registro legal de ponto.

**Cenários de aceitação**:

1. **Dado** um funcionário ativo, **quando** o RH registra a data de desligamento, **então** ele deixa de aparecer
   como apto a bater ponto após essa data, e o evento de exclusão é gravado no registro legal de ponto.
2. **Dado** um funcionário desligado, **quando** alguém consulta suas marcações, **então** elas continuam
   disponíveis e inalteradas.
3. **Dado** um funcionário desligado, **quando** o desligamento é registrado, **então** seus dados biométricos são
   marcados para exclusão conforme o prazo configurado (executado pela feature 002).
4. *(O bloqueio de acesso ao portal é entregue pela feature 008; esta feature grava e mostra a data-limite.)*
   **Dado** um funcionário desligado dentro do prazo de acesso, **quando** ele entra no portal, **então** consegue
   apenas consultar e baixar seus comprovantes e espelhos, sem enviar atestados nem registrar ciência.
5. **Dado** um funcionário desligado cujo prazo de acesso terminou, **quando** ele tenta entrar no portal, **então**
   o acesso é negado com orientação para procurar o RH, e os dados continuam guardados pelo prazo legal.
6. **Dado** um ex-funcionário recontratado, **quando** o RH o cadastra de novo com o mesmo CPF, **então** o
   sistema aceita e mantém o histórico do vínculo anterior.

---

### Casos de borda

- Unidades que compartilham o mesmo CNPJ: várias unidades apontam para o mesmo estabelecimento e usam a mesma
  numeração legal. Unidades com CNPJ próprio: cada uma aponta para o seu estabelecimento (pendência `RH-03`).
- Unidade que muda de estabelecimento: a ligação tem vigência; marcações passadas continuam no estabelecimento
  em que foram gravadas.
- Identificador do empregador que não é CNPJ (CPF, CAEPF ou CNO): o tipo do identificador é informado no
  cadastro.
- Funcionário transferido de unidade ou setor: o vínculo anterior é encerrado e um novo é aberto com data de
  início, sem apagar o histórico.
- Tentativa de excluir empresa, unidade ou setor com funcionários ou histórico: o sistema não apaga; permite
  apenas desativar.
- Gestor sem nenhum escopo atribuído: não vê nenhum funcionário.
- Funcionário transferido para fora do escopo do gestor: a partir da data da transferência, o gestor deixa de
  vê-lo; o gestor do novo setor passa a vê-lo.
- Último administrador ativo: o sistema não permite desativá-lo.
- Administrador ou RH que perdeu o celular com o app autenticador: outro administrador redefine o segundo fator, com
  auditoria; se for o único administrador, há um procedimento de recuperação documentado fora do painel.
- Usuário promovido de Gestor para RH: precisa cadastrar o segundo fator no próximo acesso.
- Data de desligamento anterior à admissão: o sistema recusa. Data até 90 dias no futuro: aceita com confirmação.
  Data a mais de 90 dias no futuro: o sistema recusa.
- CPF e outros dados pessoais nunca aparecem em mensagens de erro técnicas ou registros de diagnóstico.

## Requisitos *(obrigatório)*

### Requisitos funcionais

- **FR-001**: O sistema DEVE manter a hierarquia empresa → estabelecimento → unidade → setor → funcionário.
- **FR-002**: Estabelecimento (identificador legal) e unidade (local físico) DEVEM ser cadastros separados, e
  cada unidade DEVE estar ligada a exatamente um estabelecimento, com vigência. Cada estabelecimento DEVE guardar tipo e número do identificador (CNPJ, CPF, CAEPF ou CNO), razão
  social, endereço e demais dados do empregador exigidos pelo Anexo IX da Portaria 671.
- **FR-003**: Inclusões e alterações do empregador, e inclusões, alterações e exclusões de empregados, DEVEM ser
  gravadas no registro legal de ponto (ARP) com responsável, data e hora, sem possibilidade de edição ou remoção
  posterior.
- **FR-004**: O CPF DEVE ser único entre funcionários ativos e validado pelos dígitos verificadores; a matrícula
  DEVE ser única por empresa.
- **FR-005**: O sistema DEVE permitir informar o local de prestação de serviço, com vigência, quando o
  funcionário atuar externamente ou em instalações de terceiros.
- **FR-006**: O sistema DEVE oferecer os perfis Administrador, RH e Gestor, com a matriz de permissões guardada
  como configuração, para permitir ajustes futuros sem mudar o sistema.
- **FR-007**: O sistema DEVE registrar em trilha de auditoria os acessos a dados pessoais, as ações
  administrativas e as tentativas de acesso negadas, com usuário, data, hora e objeto acessado.
- **FR-008**: O sistema DEVE manter calendário de feriados com abrangência nacional, estadual, municipal ou de uma
  unidade específica (ponto facultativo local), aplicado às unidades correspondentes.
- **FR-009**: O sistema DEVE aceitar operação com várias empresas e unidades, mesmo com o piloto em uma só.
- **FR-010**: O sistema DEVE guardar o tipo de registro de cada funcionário (tablet ou app).
- **FR-011**: Vínculos do funcionário com unidade, setor e local de prestação DEVEM ter data de início e fim,
  preservando o histórico.
- **FR-012**: O gestor DEVE ver apenas funcionários lotados nos setores e/ou unidades inteiras atribuídos a ele pelo
  administrador, em todas as telas, listas, buscas e exportações. Não há atribuição de funcionários avulsos.
- **FR-012a**: O usuário do RH DEVE ter escopo de unidades atribuído pelo administrador, que pode ser "todas as
  unidades". Todas as ações do RH (cadastro, consulta, feriados e, nas próximas features, atestados) ficam restritas
  a esse escopo: o RH com escopo limitado só cria ou altera feriados municipais dos municípios das suas unidades e
  feriados das suas unidades; feriados nacionais e estaduais ficam com o Administrador e o RH com "todas as
  unidades".
- **FR-013**: O gestor NÃO PODE abrir, visualizar nem baixar atestados.
- **FR-014**: O sistema DEVE registrar a data de desligamento, impedir que o funcionário apareça como apto a bater
  ponto após essa data e sinalizar seus dados biométricos para o fluxo de exclusão.
- **FR-014a**: Após o desligamento, o acesso do funcionário ao portal DEVE passar a somente leitura e terminar ao fim
  de um prazo configurável, com valor inicial de 5 anos. O fim do acesso não apaga dados. Esta feature calcula,
  grava e exibe a data-limite; a aplicação dela no login do portal é entregue pela feature 008.
- **FR-015**: Empresas, unidades, setores e funcionários NÃO PODEM ser apagados quando tiverem histórico; apenas
  desativados.
- **FR-016**: Usuários do painel DEVEM se autenticar com credencial individual (e-mail e senha), com limite de
  tentativas e encerramento de sessão: após 30 minutos sem uso para Administrador e RH, e após 8 horas no máximo
  para todos os perfis (valores configuráveis).
- **FR-016a**: Administrador e RH DEVEM usar segundo fator de autenticação obrigatório por app autenticador, sem
  custo de SMS, cadastrado no primeiro acesso. O Gestor entra só com senha. A recuperação de um segundo fator perdido
  é feita por um administrador e fica registrada na auditoria.
- **FR-017**: O sistema DEVE permitir ao administrador criar, desativar e alterar o perfil e o escopo dos usuários
  do painel, com auditoria.
- **FR-018**: Listas de funcionários DEVEM permitir busca por nome, CPF ou matrícula e filtro por unidade, setor,
  situação e tipo de registro.
- **FR-019**: Dados pessoais como CPF NÃO PODEM aparecer em registros de diagnóstico do sistema.
- **FR-020**: O tipo de vínculo do funcionário (por exemplo, CLT, estágio, aprendiz, temporário) DEVE ser uma
  lista configurável, para receber a resposta de `RH-06` sem mudar o sistema.

### Entidades principais

- **Empresa (empregador)**: quem contrata. Tipo e número do identificador, razão social, endereço, situação.
- **Estabelecimento**: identificador legal de uma empresa (tipo e número, razão social, endereço). Tem sua própria
  numeração legal de marcações (NSR), usada a partir da feature 003.
- **Unidade**: local físico de trabalho (nome, endereço, cidade e UF), ligada a um estabelecimento com vigência.
  Recebe setores, funcionários e feriados.
- **Setor**: divisão de uma unidade. Nome e situação.
- **Funcionário**: nome, CPF, matrícula, data de admissão, data de desligamento, tipo de vínculo, tipo de registro
  (tablet ou app) e situação.
- **Lotação**: vínculo com vigência entre funcionário, unidade e setor.
- **Local de prestação de serviço**: endereço de terceiro ou externo onde o funcionário atua, com vigência.
- **Feriado**: data, nome e abrangência (nacional, UF ou município).
- **Usuário do painel**: pessoa que acessa o painel, com perfil e escopo. Gestor: setores e/ou unidades inteiras.
  RH: unidades ou "todas as unidades". Administrador: sem restrição.
- **Perfil e permissões**: Administrador, RH e Gestor, com a matriz de permissões configurável.
- **Evento do registro legal (ARP)**: inclusão ou alteração do empregador, inclusão, alteração ou exclusão de
  empregado, com responsável, data e hora; nunca alterado nem apagado.
- **Registro de auditoria**: quem fez o quê, quando, sobre qual objeto, incluindo acessos negados.

## Critérios de sucesso *(obrigatório)*

### Resultados mensuráveis

- **SC-001**: 100% das alterações cadastrais têm autor, data e hora registrados e consultáveis.
- **SC-002**: Um gestor não consegue acessar dados de outra equipe em nenhuma tela, busca, exportação ou endereço
  direto, comprovado por teste com todos os caminhos de acesso.
- **SC-003**: São Cristóvão pode ser cadastrada e operada, e uma segunda unidade fictícia pode ser incluída
  depois, sem nenhuma alteração no sistema.
- **SC-004**: O RH cadastra um funcionário completo em menos de 2 minutos.
- **SC-005**: O RH encontra qualquer funcionário pelo nome, CPF ou matrícula em menos de 10 segundos.
- **SC-006**: Nenhum evento gravado no registro legal de ponto pode ser alterado ou removido, comprovado por
  teste automatizado.

## Fora de escopo

- Importação automática de dados de RH e integração com outras automações ou com o Servioeste Hub (D-09, D-56).
- Cadastro facial (feature 002), escalas (feature 005) e portal do funcionário (feature 008).
- Execução da exclusão de dados biométricos (feature 002); aqui só a sinalização.

## Premissas

- O piloto começa com uma empresa e a unidade São Cristóvão; o modelo já aceita várias (D-03, D-14).
- No piloto, São Cristóvão terá um estabelecimento e uma unidade. Se cada uma das 18 unidades tem CNPJ próprio
  ainda depende de `RH-03`; o modelo atende os dois casos sem mudança.
- O prazo inicial de 5 anos de acesso após o desligamento segue o prazo de guarda das marcações (D-43) e pode ser
  ajustado com o jurídico (`RH-29`).
- Usuários do painel (Administrador, RH, Gestor) usam e-mail e senha próprios deste sistema; o acesso do
  funcionário ao portal é tratado na feature 008.
- Os valores reais de unidades, setores, quantidade de funcionários e tipos de vínculo virão de `RH-01` a `RH-06`;
  até lá, a equipe usa dados fictícios.
- Seguindo o Princípio XII, as telas são construídas e validadas primeiro com dados simulados, sem dados reais de
  funcionários.

## Pendências relacionadas

`RH-01`, `RH-02`, `RH-03`, `RH-04`, `RH-05`, `RH-06`, `RH-23`.
