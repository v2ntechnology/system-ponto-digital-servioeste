# Registro de decisões

Status: **Decidido**, **Provisório** (vale até a validação indicada) ou **Aberto**.

## Escopo

| ID | Decisão | Status |
|---|---|---|
| D-01 | Sistema próprio, feito do zero. Sem comparativo com fornecedores. | Decidido |
| D-02 | Mínimo de 100 funcionários como base de dimensionamento; número real em `RH-01`. | Provisório |
| D-03 | 18 unidades no total; piloto só em São Cristóvão. | Decidido |
| D-04 | Equipe de duas pessoas, que também mantém o sistema. Sem data-alvo. | Decidido |
| D-05 | Piloto com um grupo pequeno da sede e um grupo pequeno de motoristas de São Cristóvão. | Decidido |
| D-06 | MVP completo: registro, comprovante, espelho, horas extras, banco de horas, correções, AFD e AEJ assinados. | Decidido |
| D-07 | O sistema gera um arquivo para importação na folha; formato depende de `RH-07` a `RH-09`. | Provisório |
| D-08 | MVP deve ser desenvolvido sem gastos. Custos inevitáveis estão listados no fim deste arquivo, e a verba em `RH-35`. | Decidido |
| D-09 | O projeto não tem relação com as outras automações da Servioeste. | Decidido |
| D-61 | A unidade piloto São Cristóvão fica no Rio de Janeiro/RJ: R. Idalina Senra, 45, Imperial de São Cristóvão, CEP 20941-090 (IBGE 3304557). Valem os feriados estaduais do RJ e os municipais do Rio. | Decidido |

## Jornada

| ID | Decisão | Status |
|---|---|---|
| D-10 | RH cadastra as escalas no painel e vincula funcionários com vigência de início e fim. | Decidido |
| D-11 | Regras de cálculo configuráveis por grupo. Valores iniciais pela CLT, como tolerância de 5 minutos por marcação e 10 por dia. | Provisório |
| D-12 | O tratamento do intervalo é definido por escala: registrado ou pré-assinalado. | Decidido |
| D-13 | Motoristas têm controle detalhado no MVP: entrada, saída, intervalos, direção, espera e descanso. Aplicação da lei em `RH-17`. | Decidido |
| D-14 | Modelo empresa → unidade → setor → funcionário, com feriados por unidade. | Decidido |

## Registro do ponto

| ID | Decisão | Status |
|---|---|---|
| D-20 | Tablet identifica só pelo rosto e mostra o nome antes de confirmar. | Decidido |
| D-21 | Falhou o rosto: matrícula + PIN com foto, e a batida fica pendente de revisão. A marcação não é bloqueada. | Decidido |
| D-22 | Prova de vida simples, como piscar ou virar o rosto. | Decidido |
| D-23 | Tablet e app funcionam offline. A batida fica criptografada no aparelho e é enviada na volta da conexão, com verificação facial nesse momento. | Decidido |
| D-24 | Tablet offline não consegue identificar pelo rosto, então usa matrícula + foto e a identidade é verificada na sincronização. | Provisório |
| D-25 | GPS só no momento da batida, sem alerta de local e sem rastreamento. | Decidido |
| D-26 | Motoristas usam Android da empresa. O app é desenvolvido para Android e iOS. | Decidido |

## Painel e portal

| ID | Decisão | Status |
|---|---|---|
| D-30 | Perfis Administrador, RH e Gestor, com permissões configuráveis depois. | Decidido |
| D-31 | Batida original nunca é editada. Ajuste é um registro separado, com motivo e autor, e o espelho mostra os dois. | Decidido |
| D-32 | Funcionário envia atestado pelo app ou pelo portal. O RH analisa, e só então o abono é lançado. Gestor vê apenas o status. | Decidido |
| D-33 | Todos têm portal web, e o e-mail do comprovante é opcional. | Decidido |
| D-34 | Fechamento: período definido pelo RH, lista de pendências, bloqueio com cálculos salvos, reabertura só pelo RH com motivo. | Decidido |
| D-35 | Ciência do funcionário no espelho, conforme resposta de `RH-22`. | Provisório |
| D-36 | Tela inicial do RH com pendências e alertas de jornada, com resumo diário opcional por e-mail. | Decidido |

## Legal e LGPD

| ID | Decisão | Status |
|---|---|---|
| D-40 | Facial obrigatória para todos. Depende de validação jurídica antes do primeiro cadastro real. | Provisório |
| D-41 | Rosto: template criptografado, sem foto de cadastro quando possível; apagado no desligamento. | Provisório |
| D-42 | Foto da batida: 90 dias, ou até o fim da revisão. | Provisório |
| D-43 | GPS, batidas, ajustes e arquivos legais: pelo menos 5 anos. Atestados: prazo definido pelo RH/jurídico. | Provisório |
| D-44 | Batidas sem edição nem exclusão, registros encadeados por hash, auditoria completa, backups diários criptografados e restauração testada. | Decidido |
| D-45 | Titular do software e responsáveis formais a definir em `RH-32` a `RH-34`. | Aberto |
| D-46 | O papel só sai com INPI, Atestado, certificado em uso, AFD e AEJ validados, ao menos um fechamento em paralelo, funcionários avisados e aprovação do RH e do jurídico (`RH-36`). Cada nova unidade repete a conferência em escala menor. | Decidido |

## Stack e infraestrutura

| ID | Decisão | Status |
|---|---|---|
| D-50 | FastAPI, PostgreSQL, React Native/Expo (app e tablet), React + Vite + TypeScript + Tailwind + shadcn/ui (painel e portal, mesma stack do Servioeste Hub; substitui o Next.js em 2026-11-06), WeasyPrint. | Decidido |
| D-51 | Docker e Caddy, com homologação e produção separadas e backup externo criptografado. | Decidido |
| D-52 | VPS será usada, mas ainda não existe. Desenvolvimento roda localmente. | Decidido |
| D-53 | Produção não compartilha servidor com outras automações. | Decidido |
| D-54 | e-CNPJ A1 para AFD, AEJ e comprovantes, em módulo isolado com alerta de vencimento. Certificado de pessoa física para o Atestado. | Decidido |
| D-55 | Repositório único, testes obrigatórios para cálculos e arquivos legais, CI a cada alteração. | Decidido |
| D-56 | Nenhuma integração no MVP além do arquivo para a folha. | Decidido |
| D-58 | Cada feature começa pelo frontend com dados simulados; o backend entra depois da validação das telas. | Decidido |
| D-57 | Motor facial em módulo trocável. Proposta: motor de testes + AWS Rekognition na validação. | Aberto |
| D-59 | Repositório único com todo o frontend em `system-ponto-digital-servioeste-front` e todo o backend em `system-ponto-digital-servioeste-back`; o contrato da API fica em `system-ponto-digital-servioeste-back/contracts/openapi.yaml` e o front gera os tipos dele. Front e back são independentes, sem `package.json` nem `node_modules` na raiz. Pasta do app mobile/tablet a definir na feature 002/003. | Decidido |
| D-60 | Área de desenvolvimento em `/dev` (plano, board, histórico, dúvidas do RH, conceitos), só no servidor de desenvolvimento e fora do build de produção. Lê `specs/*/tasks.md`, `docs/briefing/*.md` e o `git log`; grava respostas do RH em `pendencias.md`. | Decidido |

## Motor facial (D-57)

- **Azure Face:** descartado, por ser restrito a clientes gerenciados pela Microsoft.
- **InsightFace:** o código é MIT, mas os modelos prontos pedem contato para licenciamento e foram descritos como só para pesquisa não comercial. Só usar depois de confirmar a licença por escrito.
- **OpenCV SFace + YuNet:** alternativa gratuita com licenças Apache 2.0 e MIT. A origem dos dados de treino do SFace não é declarada.
- **AWS Rekognition:** candidato para a validação. Confirmar se as operações de busca facial estão disponíveis em São Paulo (`sa-east-1`).

A troca de motor exige recadastrar os rostos, porque os templates de motores diferentes não são compatíveis.

## O que dá e o que não dá para fazer sem gastar

| Item | Sem custo? | Observação |
|---|---|---|
| Desenvolvimento local e testes | Sim | Docker local e certificado autoassinado |
| Motor facial de testes | Sim | SFace, ou InsightFace se a licença permitir |
| Build Android para testes | Sim | Instalação direta do APK |
| Rekognition no piloto | Em parte | Créditos de conta nova cobrem um período limitado |
| VPS, redundância e backup externo | Não | Necessários para homologação e produção |
| Tablet(s) | Não | Necessários para o piloto na sede |
| Certificados ICP-Brasil | Não | e-CNPJ e certificados de pessoa física |
| Registro no INPI | Não | Taxa conforme a tabela de retribuições do INPI |
| Distribuição iOS | Não | Exige conta paga da Apple; motoristas do piloto usam Android |
