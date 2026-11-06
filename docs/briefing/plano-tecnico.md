# Plano técnico de referência

Entrada para `/speckit.plan`. As regras de negócio ficam nas features.

## Stack

| Camada | Tecnologia |
|---|---|
| API | Python com FastAPI |
| Banco | PostgreSQL |
| App dos motoristas e tablet | Um projeto React Native com Expo; tablet em modo quiosque |
| Painel do RH e portal do funcionário | React + Vite + TypeScript, Tailwind 4, componentes no estilo shadcn/ui, TanStack Query e React Router (mesma stack do Servioeste Hub) |
| PDFs | WeasyPrint |
| Assinatura | Módulo próprio, com biblioteca Python compatível com CAdES e PAdES |
| Infraestrutura | Docker e Caddy em VPS |
| CI | Testes e verificações a cada alteração |

Facial no aparelho e armazenamento seguro podem exigir development build do Expo, em vez do Expo Go.

O visual do painel e do portal segue o Servioeste Hub. Ver `layout.md`.

## Ordem de implementação

Toda feature segue esta sequência, e o `tasks.md` deve refleti-la:

1. **Contratos:** definir os tipos e as respostas esperadas da API em `system-ponto-digital-servioeste-back/contracts`.
2. **Frontend:** construir telas, navegação, estados de carregamento, erro e vazio, usando dados simulados que seguem esses contratos.
3. **Validação:** a equipe revisa os fluxos antes de iniciar o backend.
4. **Backend:** implementar API, banco e regras de negócio, com testes antes do código nas áreas do Princípio IX.
5. **Integração:** trocar os dados simulados pela API real e remover os simulados do fluxo de produção.

Features com pouca interface, como a geração de arquivos legais, seguem a mesma ordem, com a parte de frontend limitada às telas de operação.

## Arquitetura

Repositório único:

```text
system-ponto-digital-servioeste-front            Painel do RH e portal do funcionário (React + Vite)
system-ponto-digital-servioeste-back             API, banco e regras de negócio
system-ponto-digital-servioeste-back/contracts   Contrato da API (OpenAPI); o front gera os tipos a partir dele
infra                                   Docker Compose e Caddy
docs/briefing                           Este pacote
specs                                   Gerado pelo Spec Kit
(a definir na feature 002/003)          App e tablet (Expo, dois modos do mesmo projeto)
```

Separações obrigatórias dentro da API:

- **REP:** recebe marcações, grava o ARP, emite comprovante e gera o AFD.
- **PTRP:** faz o tratamento, os cálculos, o espelho e o AEJ. Nunca gera o AFD.
- **`FacialEngine`:** cadastrar, identificar (1:N), verificar (1:1), apagar e versão do motor.
- **`Signer`:** assinar CAdES destacado e PAdES. Tem implementação de teste e implementação ICP-Brasil.
- **`PayrollExporter`:** um adaptador por leiaute de folha.

## Requisitos do REP-P que afetam a arquitetura

- **Relógio:** sincronismo com a Hora Legal Brasileira, com variação máxima de 30 segundos.
- **Coletor:** exibe relógio digital com horas, minutos e segundos no momento da marcação.
- **Offline:** é exceção. A marcação é enviada no primeiro momento em que o coletor voltar a ficar online.
- **Campos da marcação:** NSR, CPF, data e hora da marcação com fuso, data e hora da gravação com fuso, identificação do coletor e hash SHA-256.
- **NSR:** uma sequência por estabelecimento, começando em 1, sem lacunas. Precisa de controle transacional no banco.
- **Outros eventos no ARP:** dados do empregador, ajuste de relógio, inclusão, alteração e exclusão de empregados, e eventos sensíveis do REP.
- **AFD:** gerado por intervalo de datas e assinado em CAdES destacado, em arquivo `<nome>.txt.p7s`. A última linha traz `ASSINATURA_DIGITAL_EM_ARQUIVO_P7S`, completada com espaços até 100 caracteres. CRC-16/KERMIT nos registros 1 a 5.
- **AEJ:** gerado pelo PTRP, com a mesma regra de assinatura.
- **Comprovante em PDF:** assinado em PAdES com o certificado da empresa desenvolvedora.

Conferir todos os leiautes na versão vigente dos Anexos V, VI e IX antes de implementar.

## Certificados

- **e-CNPJ A1:** assina AFD, AEJ e comprovantes de forma automática. É o certificado da empresa desenvolvedora, mesmo quando ela também usa o sistema.
- **Atestado Técnico:** assinado pelo responsável técnico e pelo responsável legal, com certificados de pessoa física (A1 ou A3).
- **Desenvolvimento:** certificado autoassinado, com a mesma interface `Signer`.
- A chave fica fora do repositório, com acesso restrito, e o sistema alerta antes do vencimento.

## Reconhecimento facial

Motor ainda aberto (D-57). Implementar primeiro um adaptador gratuito para testes e depois o adaptador AWS Rekognition.

- Guardar em cada template o motor e a versão.
- Medir falsa aceitação, falsa rejeição e tempo de resposta com o tablet real e com o mesmo conjunto de fotos para cada motor.
- Definir os limiares de decisão com base nessas medições.
- Confirmar a disponibilidade em `sa-east-1` das operações necessárias antes de escolher a região.
- Testes usam apenas pessoas da equipe ou voluntários autorizados, até a validação jurídica.

## Offline

- Fila local criptografada, com chave em armazenamento seguro do aparelho.
- Identificador único gerado no aparelho, para reenvio sem duplicar marcação.
- Ajuste da hora com a diferença medida na última sincronização. Mudança suspeita no relógio do aparelho gera revisão, sem bloquear a marcação.

## Segurança e dados

- HTTPS em todo o tráfego.
- Criptografia em repouso para templates, fotos, atestados e backups.
- Permissões do usuário do banco sem `UPDATE` e `DELETE` nas tabelas de marcação, além de gatilhos que rejeitem essas operações.
- Hash encadeado nas tabelas de marcação e auditoria.
- Rotina automática para os prazos de retenção de fotos e dados biométricos.

## Ambientes e custo

- **Desenvolvimento:** `docker compose` local, sem custo.
- **Homologação e produção:** VPS a contratar, separadas das outras automações.
- **Disponibilidade:** o REP-P exige armazenamento com redundância e alta disponibilidade. Uma única VPS com backup diário pode não bastar, então a produção precisa de uma estratégia definida antes de substituir o papel.
- **Backup:** diário, criptografado e fora da VPS, com restauração testada periodicamente.

## Testes obrigatórios

- Unitários para todas as regras de jornada.
- Testes de leiaute para AFD e AEJ, com CRC, hash e assinatura verificados por ferramenta independente.
- Fluxo completo: marcação, sincronização offline, ajuste, fechamento e geração dos arquivos.
- Testes de imutabilidade garantindo que o ARP rejeite alterações.
