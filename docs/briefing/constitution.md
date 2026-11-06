# Constituição: Ponto Digital Servioeste

Sistema de ponto próprio da Servioeste, enquadrado como REP-P pela Portaria MTP 671/2021. Estes princípios valem para todas as features e têm prioridade sobre conveniência de implementação.

## I. Conformidade legal vem primeiro

Todo requisito da Portaria 671, da CLT e da LGPD é requisito de produto. Em caso de dúvida, prevalece o texto vigente da norma, e a dúvida deve ser registrada em vez de resolvida por suposição.

## II. A marcação nunca é bloqueada

O sistema não pode impedir, restringir ou recusar um registro de ponto por horário, escala, local ou falha de reconhecimento. Casos suspeitos são registrados e enviados para revisão humana.

## III. O registro original é imutável

Marcações e demais dados do Armazenamento de Registro de Ponto (ARP) não são alterados nem apagados, direta ou indiretamente, nem por administradores. Correções são registros separados, com autor, data, motivo e vínculo com o original.

## IV. Tudo é rastreável

Acessos a dados pessoais, ajustes, fechamentos, reaberturas e exportações geram trilha de auditoria. Registros são encadeados por hash para que uma alteração indevida seja detectável, inclusive quando feita por quem administra o sistema.

## V. Dados pessoais no mínimo necessário

Biometria, localização e atestados só são coletados para a finalidade declarada. São protegidos por criptografia, acesso restrito e prazo de retenção definido. Não há rastreamento contínuo, e fotos, templates, CPF e tokens não aparecem em logs. Nenhum cadastro biométrico real ocorre antes da validação jurídica.

## VI. Regras de negócio são dados com vigência

Escalas, tolerâncias, percentuais, feriados e vínculos são configuráveis e têm período de validade. Mudar uma regra nunca altera o resultado de períodos passados, e valores específicos da empresa não ficam fixos no código.

## VII. Fronteiras isoladas

Reconhecimento facial, assinatura digital e exportação para a folha ficam atrás de interfaces próprias. Trocar o motor, o certificado ou o leiaute não pode exigir mudanças no restante do sistema.

## VIII. Coletores funcionam sem internet

Tablet e app continuam registrando sem conexão, como exceção à operação online. Nenhuma marcação aceita pelo aparelho pode se perder, e o sistema preserva a hora da marcação e a hora da gravação no servidor.

## IX. Cálculos e arquivos legais são testados antes

Regras de jornada, leiaute do AFD e do AEJ, CRC, hash e assinatura são desenvolvidos com testes escritos antes do código, usando casos conhecidos. Nenhuma alteração nessas áreas é integrada com testes falhando.

## X. Simples o bastante para duas pessoas

A equipe tem duas pessoas, que desenvolvem e mantêm o sistema. Prefira menos tecnologias, um repositório único e soluções conhecidas. Toda nova dependência ou serviço deve justificar seu custo de manutenção e, no MVP, usar opção gratuita sempre que possível.

## XI. O papel só sai com critérios cumpridos

Sem INPI e Atestado Técnico, o sistema não tem validade legal como ponto, e a folha de papel continua em paralelo. A substituição exige todos os critérios de `decisoes.md` (D-46).

## XII. Frontend primeiro, backend depois

Em cada feature, as telas e os fluxos são construídos primeiro, com dados simulados, e validados pela equipe. Só depois entram a API, o banco e as regras de backend, que substituem os dados simulados. Dados simulados nunca chegam à produção, nenhuma foto real é usada nessa fase, e o Princípio IX continua valendo quando o backend for implementado.

## Governança

Esta constituição prevalece sobre specs, planos e tarefas. Toda feature deve verificar conformidade com ela durante `/speckit.analyze`. Alterações exigem motivo registrado e revisão das duas pessoas da equipe. Documentação, specs e textos da interface ficam em português do Brasil.
