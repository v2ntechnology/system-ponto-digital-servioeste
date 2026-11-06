# Modelo de dados: Fundação e cadastros

Banco PostgreSQL 16. Todas as chaves são UUID. Datas e horas com fuso (`timestamptz`); vigências em `date`.
Colunas `criado_em`/`atualizado_em` existem em todas as tabelas de cadastro e foram omitidas abaixo.
Nenhum cadastro com histórico é apagado (FR-015): tabelas de cadastro têm `ativo` (bool).

## Estrutura da empresa

### empresas
| Campo | Tipo | Regras |
|---|---|---|
| id | uuid | PK |
| tipo_identificador | enum `cnpj`, `cpf` | obrigatório |
| identificador | text | só dígitos; CNPJ/CPF válidos pelos dígitos verificadores |
| razao_social | text | obrigatório |
| ativo | bool | padrão `true` |

### estabelecimentos
Identificador legal com sequência de NSR própria (Clarificação 1).

| Campo | Tipo | Regras |
|---|---|---|
| id | uuid | PK |
| empresa_id | uuid | FK empresas |
| tipo_identificador | enum `cnpj`, `cpf`, `caepf`, `cno` | obrigatório (Anexo IX) |
| identificador | text | só dígitos; único por tipo |
| razao_social | text | obrigatório |
| endereco | jsonb | logradouro, número, complemento, bairro, cidade, UF, CEP |
| ativo | bool | |

### unidades
| Campo | Tipo | Regras |
|---|---|---|
| id | uuid | PK |
| empresa_id | uuid | FK empresas |
| nome | text | único por empresa |
| endereco | jsonb | como acima |
| uf | char(2) | obrigatório (feriados estaduais) |
| municipio_ibge | char(7) | obrigatório (feriados municipais) |
| ativo | bool | |

### unidade_estabelecimentos (vigência)
| Campo | Tipo | Regras |
|---|---|---|
| unidade_id | uuid | FK |
| estabelecimento_id | uuid | FK; mesma empresa da unidade |
| inicio | date | obrigatório |
| fim | date | nulo = vigente |

`EXCLUDE USING gist (unidade_id WITH =, daterange(inicio, fim, '[]') WITH &&)`: uma unidade aponta para um só
estabelecimento em cada data.

### setores
| Campo | Tipo | Regras |
|---|---|---|
| id | uuid | PK |
| unidade_id | uuid | FK |
| nome | text | único por unidade |
| ativo | bool | |

## Pessoas

### funcionarios
| Campo | Tipo | Regras |
|---|---|---|
| id | uuid | PK |
| empresa_id | uuid | FK |
| nome | text | obrigatório |
| cpf | char(11) | dígitos verificadores válidos; **único entre ativos**: índice único parcial `WHERE desligado_em IS NULL` |
| matricula | text | **única por empresa** (inclui desligados) |
| admitido_em | date | obrigatório |
| desligado_em | date | nulo = ativo; `>= admitido_em` |
| tipo_vinculo_id | uuid | FK tipos_vinculo |
| tipo_registro | enum `tablet`, `app` | obrigatório (FR-010) |
| email | text | opcional (portal, feature 008) |
| vinculo_anterior_id | uuid | FK funcionarios, nulo; preenchido na recontratação |
| biometria_exclusao_pendente | bool | padrão `false`; `true` no desligamento, consumido pela feature 002 |

Recontratação: novo registro com o mesmo CPF e **nova matrícula** (a matrícula é única por empresa, inclusive
entre desligados). O histórico fica ligado por `vinculo_anterior_id`.

**Estados:** `ativo` → `desligado` (registro de `desligado_em`). Não há volta: readmissão cria novo vínculo.
Ao desligar: evento ARP de exclusão, marca `biometria_exclusao_pendente = true` (consumida pela feature 002),
portal passa a somente leitura até `desligado_em + configuracao.portal_dias_pos_desligamento`.

### tipos_vinculo
Lista configurável (FR-020): `id`, `nome` (único), `ativo`. Semente: CLT, Estágio, Aprendiz, Temporário.

### lotacoes (vigência)
| Campo | Tipo | Regras |
|---|---|---|
| id | uuid | PK |
| funcionario_id | uuid | FK |
| unidade_id | uuid | FK |
| setor_id | uuid | FK; setor pertence à unidade |
| inicio | date | `>= admitido_em` |
| fim | date | nulo = vigente; `<= desligado_em` |

`EXCLUDE` sem sobreposição por funcionário. Transferência = fecha a lotação atual (`fim = dia anterior`) e abre
outra, na mesma transação.

### locais_prestacao (vigência, FR-005)
`id`, `funcionario_id`, `descricao`, `tomador_tipo_identificador` (nulo), `tomador_identificador` (nulo),
`endereco` (jsonb), `inicio`, `fim`. `EXCLUDE` sem sobreposição por funcionário.

## Calendário

### feriados
| Campo | Tipo | Regras |
|---|---|---|
| id | uuid | PK |
| data | date | obrigatório |
| nome | text | obrigatório |
| abrangencia | enum `nacional`, `estadual`, `municipal`, `unidade` | obrigatório |
| uf | char(2) | obrigatório se `estadual` |
| municipio_ibge | char(7) | obrigatório se `municipal` |
| unidade_id | uuid | obrigatório se `unidade` (ponto facultativo local) |
| ativo | bool | remover = desativar |

Feriados de uma unidade numa data = nacionais + estaduais da UF + municipais do município + específicos da
unidade, todos ativos. Períodos fechados não dependem desta tabela (o fechamento da feature 007 salva os
resultados), então editar feriado não altera período fechado.

## Acesso

### usuarios
| Campo | Tipo | Regras |
|---|---|---|
| id | uuid | PK |
| email | citext | único |
| nome | text | |
| cpf | char(11) | obrigatório para Administrador e RH: o AFD identifica quem fez a operação |
| senha_hash | text | argon2 |
| perfil | enum `administrador`, `rh`, `gestor` | |
| mfa_segredo_cifrado | bytea | nulo até cadastrar; Fernet |
| mfa_ultimo_passo | bigint | evita reuso do mesmo código TOTP |
| mfa_exigido | bool | derivado: `perfil in (administrador, rh)` |
| ativo | bool | não pode desativar o último administrador ativo |

### usuario_escopos
`usuario_id`, `todas_unidades` (bool), `unidade_id` (nulo), `setor_id` (nulo). Regras:
- Gestor: uma ou mais linhas com `unidade_id` ou `setor_id`; nunca `todas_unidades`.
- RH: linhas com `unidade_id` ou uma linha `todas_unidades = true`.
- Administrador: sem escopo (vê tudo).

Funcionário visível ao usuário numa data `d` = existe lotação vigente em `d` cuja unidade ou setor está no
escopo.

### perfil_permissoes
`perfil`, `permissao` (texto). Semente:

| Permissão | Administrador | RH | Gestor |
|---|---|---|---|
| `estrutura.ler` | ✓ | ✓ | ✓ (só escopo) |
| `estrutura.editar` | ✓ | | |
| `funcionario.ler` | ✓ | ✓ | ✓ |
| `funcionario.editar` | ✓ | ✓ | |
| `funcionario.desligar` | ✓ | ✓ | |
| `feriado.editar` | ✓ | ✓ | |
| `usuario.gerenciar` | ✓ | | |
| `auditoria.ler` | ✓ | | |
| `atestado.abrir` | | ✓ | (nunca) |

`atestado.abrir` é negado ao Gestor no código, além da tabela (FR-013), para não depender só de configuração.

### sessoes
Como no Hub: `id`, `usuario_id`, `token_hash` (sha256), `mfa_pendente` (bool), `expira_em`, `ip`, `user_agent`.

### tentativas_login
Como no Hub: limite por e-mail e IP, em tabela.

### configuracoes (vigência)
`chave`, `valor` (jsonb), `inicio`, `fim`. Semente: `portal_dias_pos_desligamento = 1825` (5 anos),
`sessao_inatividade_min_admin_rh = 30`, `sessao_max_horas = 8`,
`biometria_dias_pos_desligamento` (definido na feature 002).

## Registros imutáveis

### nsr_contadores
`estabelecimento_id` (PK), `ultimo_nsr` (bigint, começa em 0). Atualizado com `SELECT ... FOR UPDATE` na mesma
transação do evento.

### arp_eventos (só inserção)
| Campo | Tipo | Regras |
|---|---|---|
| id | uuid | PK |
| estabelecimento_id | uuid | FK |
| nsr | bigint | `UNIQUE (estabelecimento_id, nsr)`; sem lacunas |
| tipo | enum `empregador_inclusao`, `empregador_alteracao`, `empregado_inclusao`, `empregado_alteracao`, `empregado_exclusao` | marcações entram na feature 003 |
| responsavel_usuario_id | uuid | FK usuarios |
| responsavel_cpf | char(11) | exigido pelo AFD; nunca vai para log |
| ocorrido_em | timestamptz | com fuso |
| dados | jsonb | snapshot canônico (chaves ordenadas) do empregador ou empregado |
| hash_anterior | char(64) | hash da linha anterior do mesmo estabelecimento (zeros na primeira) |
| hash | char(64) | SHA-256 de `hash_anterior` + conteúdo canônico |

Gatilho rejeita `UPDATE`/`DELETE`; papel `ponto_app` só tem `INSERT`/`SELECT`.

### auditoria (só inserção)
`id`, `seq` (bigint, atribuído sob trava, sem lacunas), `usuario_id` (nulo para anônimo), `acao` (texto, ex.: `funcionario.ver`,
`funcionario.criar`, `login.falhou`, `acesso.negado`), `objeto_tipo`, `objeto_id`, `resultado`
(`permitido`/`negado`), `detalhes` (jsonb, sem CPF em claro), `ip`, `ocorrido_em`, `hash_anterior`, `hash`.
Mesmo gatilho e permissões do ARP. Encadeamento global por `seq`. Para duas gravações simultâneas não usarem o
mesmo `hash_anterior`, a gravação pega `pg_advisory_xact_lock` (chave fixa da auditoria), lê a última linha,
calcula `seq + 1` e o hash, e insere na mesma transação.

## Relações

```text
empresa 1─N estabelecimento 1─N nsr/arp_eventos
empresa 1─N unidade N─1 estabelecimento   (via unidade_estabelecimentos, com vigência)
unidade 1─N setor
funcionario 1─N lotacao N─1 unidade/setor (vigência)
funcionario 1─N local_prestacao (vigência)
usuario 1─N usuario_escopos → unidade | setor
```
