"""Fundação: estrutura, funcionários, feriados, usuários, auditoria e ARP (feature 001).

Revision ID: 0001
Revises:
Create Date: 2026-11-06

Princípios da constituição aplicados aqui:
- III (registro imutável): gatilhos recusam UPDATE/DELETE/TRUNCATE em arp_eventos e auditoria, e o papel da
  aplicação (ponto_app) nem tem essas permissões.
- VI (vigência): lotações, vínculo unidade → estabelecimento, locais de prestação e configurações têm início/fim,
  e o banco impede sobreposição (EXCLUDE USING gist).
- FR-015: o papel da aplicação não tem DELETE nos cadastros; cadastros com histórico são desativados.
"""
from alembic import op
from sqlalchemy.engine import make_url

from app.core.config import get_settings

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

TABELAS = [
    # ------------------------------------------------------------------ estrutura
    """CREATE TABLE empresas (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        tipo_identificador text NOT NULL CHECK (tipo_identificador IN ('cnpj', 'cpf')),
        identificador text NOT NULL UNIQUE CHECK (identificador ~ '^[0-9]{11,14}$'),
        razao_social text NOT NULL CHECK (length(trim(razao_social)) > 0),
        ativo boolean NOT NULL DEFAULT true,
        criado_em timestamptz NOT NULL DEFAULT now(),
        atualizado_em timestamptz NOT NULL DEFAULT now()
    )""",
    """CREATE TABLE estabelecimentos (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id uuid NOT NULL REFERENCES empresas(id),
        tipo_identificador text NOT NULL CHECK (tipo_identificador IN ('cnpj', 'cpf', 'caepf', 'cno')),
        identificador text NOT NULL CHECK (identificador ~ '^[0-9]{11,14}$'),
        razao_social text NOT NULL CHECK (length(trim(razao_social)) > 0),
        endereco jsonb NOT NULL,
        ativo boolean NOT NULL DEFAULT true,
        criado_em timestamptz NOT NULL DEFAULT now(),
        atualizado_em timestamptz NOT NULL DEFAULT now(),
        UNIQUE (tipo_identificador, identificador)
    )""",
    """CREATE TABLE unidades (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id uuid NOT NULL REFERENCES empresas(id),
        nome text NOT NULL CHECK (length(trim(nome)) > 0),
        endereco jsonb NOT NULL,
        uf char(2) NOT NULL CHECK (uf ~ '^[A-Z]{2}$'),
        municipio_ibge char(7) NOT NULL CHECK (municipio_ibge ~ '^[0-9]{7}$'),
        ativo boolean NOT NULL DEFAULT true,
        criado_em timestamptz NOT NULL DEFAULT now(),
        atualizado_em timestamptz NOT NULL DEFAULT now()
    )""",
    "CREATE UNIQUE INDEX unidades_nome_por_empresa ON unidades (empresa_id, lower(nome))",
    """CREATE TABLE unidade_estabelecimentos (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        unidade_id uuid NOT NULL REFERENCES unidades(id),
        estabelecimento_id uuid NOT NULL REFERENCES estabelecimentos(id),
        inicio date NOT NULL,
        fim date,
        CHECK (fim IS NULL OR fim >= inicio),
        EXCLUDE USING gist (unidade_id WITH =, daterange(inicio, fim, '[]') WITH &&)
    )""",
    """CREATE TABLE setores (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        unidade_id uuid NOT NULL REFERENCES unidades(id),
        nome text NOT NULL CHECK (length(trim(nome)) > 0),
        ativo boolean NOT NULL DEFAULT true,
        criado_em timestamptz NOT NULL DEFAULT now(),
        atualizado_em timestamptz NOT NULL DEFAULT now()
    )""",
    "CREATE UNIQUE INDEX setores_nome_por_unidade ON setores (unidade_id, lower(nome))",
    # ------------------------------------------------------------------ pessoas
    """CREATE TABLE tipos_vinculo (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        nome text NOT NULL,
        ativo boolean NOT NULL DEFAULT true
    )""",
    "CREATE UNIQUE INDEX tipos_vinculo_nome ON tipos_vinculo (lower(nome))",
    """CREATE TABLE funcionarios (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        empresa_id uuid NOT NULL REFERENCES empresas(id),
        nome text NOT NULL CHECK (length(trim(nome)) >= 3),
        cpf char(11) NOT NULL CHECK (cpf ~ '^[0-9]{11}$'),
        matricula text NOT NULL CHECK (length(trim(matricula)) > 0),
        admitido_em date NOT NULL,
        desligado_em date CHECK (desligado_em IS NULL OR desligado_em >= admitido_em),
        tipo_vinculo_id uuid NOT NULL REFERENCES tipos_vinculo(id),
        tipo_registro text NOT NULL CHECK (tipo_registro IN ('tablet', 'app')),
        email text,
        vinculo_anterior_id uuid REFERENCES funcionarios(id),
        biometria_exclusao_pendente boolean NOT NULL DEFAULT false,
        criado_em timestamptz NOT NULL DEFAULT now(),
        atualizado_em timestamptz NOT NULL DEFAULT now()
    )""",
    # CPF único entre ativos (FR-004); matrícula única por empresa, inclusive entre desligados.
    "CREATE UNIQUE INDEX funcionarios_cpf_ativo ON funcionarios (cpf) WHERE desligado_em IS NULL",
    "CREATE UNIQUE INDEX funcionarios_matricula_por_empresa ON funcionarios (empresa_id, lower(matricula))",
    "CREATE INDEX funcionarios_nome_trgm ON funcionarios USING gin (lower(nome) gin_trgm_ops)",
    """CREATE TABLE lotacoes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        funcionario_id uuid NOT NULL REFERENCES funcionarios(id),
        unidade_id uuid NOT NULL REFERENCES unidades(id),
        setor_id uuid NOT NULL REFERENCES setores(id),
        inicio date NOT NULL,
        fim date,
        CHECK (fim IS NULL OR fim >= inicio),
        EXCLUDE USING gist (funcionario_id WITH =, daterange(inicio, fim, '[]') WITH &&)
    )""",
    "CREATE INDEX lotacoes_unidade ON lotacoes (unidade_id)",
    "CREATE INDEX lotacoes_setor ON lotacoes (setor_id)",
    """CREATE TABLE locais_prestacao (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        funcionario_id uuid NOT NULL REFERENCES funcionarios(id),
        descricao text NOT NULL CHECK (length(trim(descricao)) > 0),
        tomador_tipo_identificador text CHECK (tomador_tipo_identificador IN ('cnpj', 'cpf', 'caepf', 'cno')),
        tomador_identificador text,
        endereco jsonb NOT NULL,
        inicio date NOT NULL,
        fim date,
        CHECK (fim IS NULL OR fim >= inicio),
        EXCLUDE USING gist (funcionario_id WITH =, daterange(inicio, fim, '[]') WITH &&)
    )""",
    # ------------------------------------------------------------------ calendário
    """CREATE TABLE feriados (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        data date NOT NULL,
        nome text NOT NULL CHECK (length(trim(nome)) > 0),
        abrangencia text NOT NULL CHECK (abrangencia IN ('nacional', 'estadual', 'municipal', 'unidade')),
        uf char(2),
        municipio_ibge char(7),
        unidade_id uuid REFERENCES unidades(id),
        ativo boolean NOT NULL DEFAULT true,
        criado_em timestamptz NOT NULL DEFAULT now(),
        CHECK ((abrangencia = 'estadual') = (uf IS NOT NULL)),
        CHECK ((abrangencia = 'municipal') = (municipio_ibge IS NOT NULL)),
        CHECK ((abrangencia = 'unidade') = (unidade_id IS NOT NULL))
    )""",
    "CREATE INDEX feriados_data ON feriados (data)",
    # ------------------------------------------------------------------ acesso
    """CREATE TABLE usuarios (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email citext NOT NULL UNIQUE,
        nome text NOT NULL CHECK (length(trim(nome)) > 0),
        cpf char(11) CHECK (cpf IS NULL OR cpf ~ '^[0-9]{11}$'),
        senha_hash text NOT NULL,
        perfil text NOT NULL CHECK (perfil IN ('administrador', 'rh', 'gestor')),
        mfa_segredo_cifrado bytea,
        mfa_segredo_pendente_cifrado bytea,
        mfa_ultimo_passo bigint,
        ativo boolean NOT NULL DEFAULT true,
        criado_em timestamptz NOT NULL DEFAULT now(),
        atualizado_em timestamptz NOT NULL DEFAULT now(),
        -- O AFD identifica quem fez cada operação: Administrador e RH precisam de CPF.
        CHECK (perfil = 'gestor' OR cpf IS NOT NULL)
    )""",
    """CREATE TABLE usuario_escopos (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        todas_unidades boolean NOT NULL DEFAULT false,
        unidade_id uuid REFERENCES unidades(id),
        setor_id uuid REFERENCES setores(id),
        -- Cada linha é exatamente uma coisa: "todas as unidades", uma unidade ou um setor.
        CHECK (num_nonnulls(nullif(todas_unidades, false), unidade_id, setor_id) = 1)
    )""",
    "CREATE INDEX usuario_escopos_usuario ON usuario_escopos (usuario_id)",
    """CREATE TABLE perfil_permissoes (
        perfil text NOT NULL CHECK (perfil IN ('administrador', 'rh', 'gestor')),
        permissao text NOT NULL,
        PRIMARY KEY (perfil, permissao),
        -- FR-013: gestor nunca abre atestados, nem por configuração.
        CHECK (NOT (perfil = 'gestor' AND permissao = 'atestado.abrir'))
    )""",
    """CREATE TABLE sessoes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        usuario_id uuid NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        token_hash char(64) NOT NULL UNIQUE,
        mfa_pendente boolean NOT NULL,
        criado_em timestamptz NOT NULL DEFAULT now(),
        ultimo_uso_em timestamptz NOT NULL DEFAULT now(),
        expira_em timestamptz NOT NULL,
        ip text,
        user_agent text
    )""",
    "CREATE INDEX sessoes_usuario ON sessoes (usuario_id)",
    """CREATE TABLE tentativas_login (
        chave text PRIMARY KEY,
        contagem integer NOT NULL DEFAULT 0,
        inicio_janela timestamptz NOT NULL DEFAULT now()
    )""",
    """CREATE TABLE configuracoes (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        chave text NOT NULL,
        valor jsonb NOT NULL,
        inicio date NOT NULL,
        fim date,
        CHECK (fim IS NULL OR fim >= inicio),
        EXCLUDE USING gist (chave WITH =, daterange(inicio, fim, '[]') WITH &&)
    )""",
    # ------------------------------------------------------------------ registros imutáveis
    """CREATE TABLE nsr_contadores (
        estabelecimento_id uuid PRIMARY KEY REFERENCES estabelecimentos(id),
        ultimo_nsr bigint NOT NULL DEFAULT 0 CHECK (ultimo_nsr >= 0)
    )""",
    """CREATE TABLE arp_eventos (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        estabelecimento_id uuid NOT NULL REFERENCES estabelecimentos(id),
        nsr bigint NOT NULL CHECK (nsr >= 1),
        tipo text NOT NULL CHECK (tipo IN ('empregador_inclusao', 'empregador_alteracao', 'empregado_inclusao',
                                           'empregado_alteracao', 'empregado_exclusao')),
        responsavel_usuario_id uuid NOT NULL REFERENCES usuarios(id),
        responsavel_cpf char(11) NOT NULL CHECK (responsavel_cpf ~ '^[0-9]{11}$'),
        ocorrido_em timestamptz NOT NULL,
        dados jsonb NOT NULL,
        hash_anterior char(64) NOT NULL,
        hash char(64) NOT NULL,
        UNIQUE (estabelecimento_id, nsr)
    )""",
    """CREATE TABLE auditoria (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        seq bigint NOT NULL UNIQUE CHECK (seq >= 1),
        usuario_id uuid REFERENCES usuarios(id),
        acao text NOT NULL,
        objeto_tipo text,
        objeto_id uuid,
        resultado text NOT NULL CHECK (resultado IN ('permitido', 'negado')),
        detalhes jsonb NOT NULL DEFAULT '{}'::jsonb,
        ip text,
        ocorrido_em timestamptz NOT NULL,
        hash_anterior char(64) NOT NULL,
        hash char(64) NOT NULL
    )""",
    "CREATE INDEX auditoria_ocorrido ON auditoria (ocorrido_em DESC)",
    "CREATE INDEX auditoria_objeto ON auditoria (objeto_id)",
]

IMUTAVEL = [
    """CREATE FUNCTION bloquear_alteracao() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
        RAISE EXCEPTION 'Registro imutável: % não permite %', TG_TABLE_NAME, TG_OP USING ERRCODE = 'P0001';
    END
    $$""",
]
for _t in ("arp_eventos", "auditoria"):
    IMUTAVEL += [
        f"CREATE TRIGGER {_t}_imutavel BEFORE UPDATE OR DELETE ON {_t} FOR EACH ROW EXECUTE FUNCTION bloquear_alteracao()",
        f"CREATE TRIGGER {_t}_sem_truncate BEFORE TRUNCATE ON {_t} FOR EACH STATEMENT EXECUTE FUNCTION bloquear_alteracao()",
    ]

# Matriz de data-model.md. Ajustável depois (FR-006), mas o banco impede atestado.abrir para gestor.
PERMISSOES = {
    "administrador": ["estrutura.ler", "estrutura.editar", "funcionario.ler", "funcionario.editar", "funcionario.desligar",
                      "feriado.editar", "usuario.gerenciar", "auditoria.ler"],
    "rh": ["estrutura.ler", "funcionario.ler", "funcionario.editar", "funcionario.desligar", "feriado.editar", "atestado.abrir"],
    "gestor": ["estrutura.ler", "funcionario.ler"],
}

SEMENTES = [
    # Valores constantes deste arquivo (não vêm de fora): montar o texto aqui é seguro.
    "INSERT INTO perfil_permissoes (perfil, permissao) VALUES "  # noqa: S608
    + ", ".join(f"('{p}', '{x}')" for p, lista in PERMISSOES.items() for x in lista),
    "INSERT INTO tipos_vinculo (nome) VALUES ('CLT'), ('Estágio'), ('Aprendiz'), ('Temporário')",
    """INSERT INTO configuracoes (chave, valor, inicio) VALUES
        ('portal_dias_pos_desligamento', '1825', '2000-01-01'),
        ('sessao_inatividade_min_admin_rh', '30', '2000-01-01'),
        ('sessao_max_horas', '8', '2000-01-01')""",
]

# Papel da aplicação. Sem UPDATE/DELETE/TRUNCATE no ARP e na auditoria; sem DELETE nos cadastros (FR-015).
SEM_DELETE = ["empresas", "estabelecimentos", "unidades", "unidade_estabelecimentos", "setores", "tipos_vinculo",
              "funcionarios", "lotacoes", "locais_prestacao", "feriados", "usuarios", "configuracoes", "nsr_contadores"]


def _papel_app() -> list[str]:
    senha = make_url(get_settings().database_url).password or ""
    senha_sql = senha.replace("'", "''")
    return [
        f"""DO $$ BEGIN
            IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'ponto_app') THEN
                CREATE ROLE ponto_app LOGIN PASSWORD '{senha_sql}';
            ELSE
                ALTER ROLE ponto_app LOGIN PASSWORD '{senha_sql}';
            END IF;
        END $$""",
        "DO $$ BEGIN EXECUTE format('GRANT CONNECT ON DATABASE %I TO ponto_app', current_database()); END $$",
        "GRANT USAGE ON SCHEMA public TO ponto_app",
        "GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ponto_app",
        "REVOKE UPDATE, DELETE, TRUNCATE ON arp_eventos, auditoria FROM ponto_app",
        f"REVOKE DELETE, TRUNCATE ON {', '.join(SEM_DELETE)} FROM ponto_app",
        "REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON perfil_permissoes FROM ponto_app",
    ]


def upgrade() -> None:
    for ext in ("btree_gist", "pg_trgm", "citext"):
        op.execute(f"CREATE EXTENSION IF NOT EXISTS {ext}")
    for sql in TABELAS + IMUTAVEL + SEMENTES + _papel_app():
        op.execute(sql)


def downgrade() -> None:
    for t in ("auditoria", "arp_eventos", "nsr_contadores", "configuracoes", "tentativas_login", "sessoes",
              "perfil_permissoes", "usuario_escopos", "usuarios", "feriados", "locais_prestacao", "lotacoes",
              "funcionarios", "tipos_vinculo", "setores", "unidade_estabelecimentos", "unidades", "estabelecimentos",
              "empresas"):
        op.execute(f"DROP TABLE IF EXISTS {t} CASCADE")
    op.execute("DROP FUNCTION IF EXISTS bloquear_alteracao()")
