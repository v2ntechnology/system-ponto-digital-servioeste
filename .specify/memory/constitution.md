# Constituição: Ponto Digital Servioeste

Sistema de ponto próprio da Servioeste, enquadrado como REP-P pela Portaria MTP 671/2021. Estes princípios
valem para todas as features e têm prioridade sobre conveniência de implementação.

## Princípios Fundamentais

### I. Conformidade legal vem primeiro

Todo requisito da Portaria 671, da CLT e da LGPD é requisito de produto. Em caso de dúvida, prevalece o texto
vigente da norma, e a dúvida DEVE ser registrada (em `docs/briefing/pendencias.md` ou como
`[NEEDS CLARIFICATION]` na spec) em vez de resolvida por suposição.

**Por quê:** o sistema só substitui o papel se for válido diante da fiscalização e da Justiça do Trabalho.

### II. A marcação nunca é bloqueada

O sistema NÃO PODE impedir, restringir ou recusar um registro de ponto por horário, escala, local ou falha de
reconhecimento. Casos suspeitos DEVEM ser registrados e enviados para revisão humana.

**Por quê:** a Portaria 671 proíbe restringir a marcação; o controle de fraude acontece depois, na revisão.

### III. O registro original é imutável

Marcações e demais dados do Armazenamento de Registro de Ponto (ARP) NÃO PODEM ser alterados nem apagados,
direta ou indiretamente, nem por administradores. Correções DEVEM ser registros separados, com autor, data,
motivo e vínculo com o original.

**Por quê:** a integridade do ARP é a base da validade legal do AFD e do comprovante.

### IV. Tudo é rastreável

Acessos a dados pessoais, ajustes, fechamentos, reaberturas e exportações DEVEM gerar trilha de auditoria.
Registros DEVEM ser encadeados por hash, para que uma alteração indevida seja detectável, inclusive quando feita
por quem administra o sistema.

**Por quê:** a equipe que mantém o sistema também tem acesso a ele; a prova de integridade não pode depender de
confiança.

### V. Dados pessoais no mínimo necessário

Biometria, localização e atestados só são coletados para a finalidade declarada e DEVEM ser protegidos por
criptografia, acesso restrito e prazo de retenção definido. Não há rastreamento contínuo, e fotos, templates,
CPF e tokens NÃO PODEM aparecer em logs. Nenhum cadastro biométrico real ocorre antes da validação jurídica.

**Por quê:** a foto do rosto é dado biométrico sensível pela LGPD.

### VI. Regras de negócio são dados com vigência

Escalas, tolerâncias, percentuais, feriados e vínculos DEVEM ser configuráveis e ter período de validade. Mudar
uma regra NUNCA altera o resultado de períodos passados, e valores específicos da empresa NÃO PODEM ficar fixos
no código.

**Por quê:** as regras dependem de convenções coletivas que mudam, e muitas ainda estão pendentes com o RH.

### VII. Fronteiras isoladas

Reconhecimento facial (`FacialEngine`), assinatura digital (`Signer`) e exportação para a folha
(`PayrollExporter`) DEVEM ficar atrás de interfaces próprias. Trocar o motor, o certificado ou o leiaute NÃO
PODE exigir mudanças no restante do sistema. Dentro da API, o REP (marcações, ARP, comprovante, AFD) e o PTRP
(tratamento, cálculos, espelho, AEJ) DEVEM permanecer separados, e o PTRP nunca gera o AFD.

**Por quê:** o motor facial ainda está em aberto e o certificado de produção só chega no fim.

### VIII. Coletores funcionam sem internet

Tablet e app DEVEM continuar registrando sem conexão, como exceção à operação online. Nenhuma marcação aceita
pelo aparelho pode se perder, e o sistema DEVE preservar a hora da marcação e a hora da gravação no servidor.

**Por quê:** motoristas passam por áreas sem sinal, e a marcação não pode ser bloqueada (Princípio II).

### IX. Cálculos e arquivos legais são testados antes

Regras de jornada, leiaute do AFD e do AEJ, CRC, hash e assinatura DEVEM ser desenvolvidos com testes escritos
antes do código, usando casos conhecidos. Nenhuma alteração nessas áreas é integrada com testes falhando.
(NÃO NEGOCIÁVEL)

**Por quê:** um erro de cálculo ou de leiaute vira passivo trabalhista ou autuação.

### X. Simples o bastante para duas pessoas

A equipe tem duas pessoas, que desenvolvem e mantêm o sistema. Prefira menos tecnologias, um repositório único e
soluções conhecidas. Toda nova dependência ou serviço DEVE justificar seu custo de manutenção e, no MVP, usar
opção gratuita sempre que possível.

**Por quê:** cada peça a mais é manutenção para sempre, sem equipe para absorver.

### XI. O papel só sai com critérios cumpridos

Sem registro no INPI e Atestado Técnico, o sistema não tem validade legal como ponto, e a folha de papel
continua em paralelo. A substituição exige todos os critérios de `docs/briefing/decisoes.md` (D-46).

**Por quê:** desligar o papel antes da hora deixa a empresa sem controle de jornada válido.

### XII. Frontend primeiro, backend depois

Em cada feature, as telas e os fluxos DEVEM ser construídos primeiro, com dados simulados que seguem os
contratos de `system-ponto-digital-servioeste-back/contracts`, e validados pela equipe. Só depois entram a API, o banco e as regras de backend, que
substituem os dados simulados. Dados simulados NUNCA chegam à produção, nenhuma foto real é usada nessa fase, e o
Princípio IX continua valendo quando o backend for implementado.

**Por quê:** validar o fluxo com o RH antes de investir em backend evita retrabalho.

## Restrições técnicas e de segurança

- **Stack (D-50):** API em Python com FastAPI; PostgreSQL; app e tablet em React Native com Expo (tablet em modo
  quiosque); painel do RH e portal em React + Vite + TypeScript + Tailwind + shadcn/ui, a mesma stack do
  Servioeste Hub; PDFs com WeasyPrint. Infraestrutura com Docker e Caddy em VPS.
- **Repositório único:** `system-ponto-digital-servioeste-front` (todo o frontend), `system-ponto-digital-servioeste-back` (todo o backend, incluindo o contrato em
  `system-ponto-digital-servioeste-back/contracts`), `infra`, `docs/briefing`, `specs`. A pasta do app mobile e do tablet é definida na
  feature 002/003.
- **Layout:** painel e portal seguem a linguagem visual do Servioeste Hub (referência principal) e do Radar,
  conforme `docs/briefing/layout.md`.
- **REP-P:** relógio sincronizado com a Hora Legal Brasileira (variação máxima de 30 s); NSR sequencial por
  estabelecimento, sem lacunas, com controle transacional; AFD e AEJ assinados em CAdES destacado; comprovante
  em PAdES. Leiautes conferidos na versão vigente dos Anexos V, VI e IX antes de implementar.
- **Banco:** o usuário da aplicação NÃO tem `UPDATE` nem `DELETE` nas tabelas de marcação, e gatilhos rejeitam
  essas operações.
- **Segurança:** HTTPS em todo o tráfego; criptografia em repouso para templates, fotos, atestados e backups;
  backup diário criptografado fora da VPS, com restauração testada.
- **Segredos:** `.env`, certificados, chaves, dumps, fotos, atestados e documentos do RH NUNCA são versionados.
  Certificados de produção ficam fora do repositório, com acesso restrito e alerta de vencimento.
- **Ambientes:** desenvolvimento local com `docker compose`; homologação e produção separadas, sem compartilhar
  servidor com outras automações.

## Fluxo de desenvolvimento

- Cada feature passa por `/speckit-specify`, `/speckit-clarify`, `/speckit-plan`, `/speckit-tasks`,
  `/speckit-analyze` e `/speckit-implement`, a partir de `docs/briefing/features/`.
- O `tasks.md` DEVE seguir a ordem: contratos → frontend com dados simulados → validação da equipe → backend
  (com testes antes nas áreas do Princípio IX) → integração e remoção dos dados simulados.
- Pendência sem resposta vira `[NEEDS CLARIFICATION]`; se travar a feature, é implementada como regra
  configurável ou com o valor provisório indicado, nunca fixada no código.
- CI roda testes e verificações a cada alteração. Testes obrigatórios: regras de jornada, leiaute do AFD e do
  AEJ (com CRC, hash e assinatura verificados por ferramenta independente), fluxo completo e imutabilidade do ARP.
- Commits no padrão `<prefixo em inglês>: <descrição em português>` (Conventional Commits), sem `Co-Authored-By`
  de ferramentas de IA.

## Governança

- Esta constituição prevalece sobre specs, planos e tarefas. Toda feature DEVE verificar conformidade com ela
  durante `/speckit-analyze`, e violações justificadas são registradas na seção de complexidade do plano.
- Alterações exigem motivo registrado e revisão das duas pessoas da equipe.
- Versionamento semântico: MAJOR para remoção ou redefinição de princípio; MINOR para princípio ou seção nova ou
  orientação ampliada; PATCH para esclarecimentos e redação.
- Documentação, specs e textos da interface ficam em português do Brasil.
- Orientação de dia a dia: `docs/briefing/` (decisões, pendências, plano técnico e layout).

**Version**: 1.0.1 | **Ratified**: 2026-11-06 | **Last Amended**: 2026-11-06
