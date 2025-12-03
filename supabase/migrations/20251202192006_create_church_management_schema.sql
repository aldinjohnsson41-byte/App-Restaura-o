/*
  # Sistema de Gestão de Igreja - Schema Completo
  
  1. Novas Tabelas
    - `cargos` - Cargos da igreja (pastor, líder, diácono, membro)
      - `id` (uuid, primary key)
      - `nome` (text, unique)
      - `descricao` (text)
      - `created_at` (timestamptz)
      
    - `ministerios` - Ministérios da igreja
      - `id` (uuid, primary key)
      - `nome` (text, unique)
      - `descricao` (text)
      - `created_at` (timestamptz)
      
    - `grupos_familiares` - Grupos familiares/células
      - `id` (uuid, primary key)
      - `nome` (text)
      - `descricao` (text)
      - `lider_id` (uuid, FK para pessoas)
      - `co_lider_id` (uuid, FK para pessoas)
      - `created_at` (timestamptz)
      
    - `tipos_ocorrencias` - Tipos de ocorrências
      - `id` (uuid, primary key)
      - `nome` (text, unique)
      - `created_at` (timestamptz)
      
    - `pessoas` - Cadastro principal de pessoas
      - `id` (uuid, primary key)
      - `nome_completo` (text, NOT NULL)
      - `data_nascimento` (date, NOT NULL)
      - `estado_civil` (text, NOT NULL)
      - `telefone` (text, NOT NULL)
      - `whatsapp` (text)
      - `email` (text)
      - `profissao` (text)
      - `e_membro` (boolean, NOT NULL)
      - `data_membro` (date)
      - `nome_conjuge` (text)
      - `observacoes` (text)
      - `cargo_id` (uuid, FK)
      - `ministerio_id` (uuid, FK)
      - `grupo_familiar_id` (uuid, FK)
      - `papel_grupo` (text)
      - `endereco_completo` (text)
      - `cep` (text)
      - `cidade` (text)
      - `estado` (text)
      - `latitude` (numeric)
      - `longitude` (numeric)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `created_by` (uuid, FK para auth.users)
      
    - `ocorrencias` - Ocorrências vinculadas às pessoas
      - `id` (uuid, primary key)
      - `pessoa_id` (uuid, FK, NOT NULL)
      - `tipo_ocorrencia_id` (uuid, FK, NOT NULL)
      - `data_ocorrencia` (date, NOT NULL)
      - `descricao` (text, NOT NULL)
      - `created_at` (timestamptz)
      - `created_by` (uuid, FK para auth.users)
      
    - `historico_pessoas` - Histórico automático de alterações
      - `id` (uuid, primary key)
      - `pessoa_id` (uuid, FK, NOT NULL)
      - `acao` (text, NOT NULL)
      - `detalhes` (jsonb)
      - `created_at` (timestamptz)
      - `created_by` (uuid, FK para auth.users)
      
  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Políticas para usuários autenticados
    
  3. Notas Importantes
    - Validação de papéis no grupo familiar (líder/co-líder) será feita no frontend
    - Histórico será registrado via triggers do banco de dados
    - Todos os campos obrigatórios têm constraint NOT NULL
*/

-- Tabela de Cargos
CREATE TABLE IF NOT EXISTS cargos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text UNIQUE NOT NULL,
  descricao text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cargos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem visualizar cargos"
  ON cargos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir cargos"
  ON cargos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar cargos"
  ON cargos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar cargos"
  ON cargos FOR DELETE
  TO authenticated
  USING (true);

-- Tabela de Ministérios
CREATE TABLE IF NOT EXISTS ministerios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text UNIQUE NOT NULL,
  descricao text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ministerios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem visualizar ministérios"
  ON ministerios FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir ministérios"
  ON ministerios FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar ministérios"
  ON ministerios FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar ministérios"
  ON ministerios FOR DELETE
  TO authenticated
  USING (true);

-- Tabela de Tipos de Ocorrências
CREATE TABLE IF NOT EXISTS tipos_ocorrencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE tipos_ocorrencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem visualizar tipos de ocorrências"
  ON tipos_ocorrencias FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir tipos de ocorrências"
  ON tipos_ocorrencias FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar tipos de ocorrências"
  ON tipos_ocorrencias FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar tipos de ocorrências"
  ON tipos_ocorrencias FOR DELETE
  TO authenticated
  USING (true);

-- Tabela de Pessoas
CREATE TABLE IF NOT EXISTS pessoas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome_completo text NOT NULL,
  data_nascimento date NOT NULL,
  estado_civil text NOT NULL CHECK (estado_civil IN ('solteiro', 'casado', 'viúvo', 'divorciado')),
  telefone text NOT NULL,
  whatsapp text,
  email text,
  profissao text,
  e_membro boolean NOT NULL DEFAULT false,
  data_membro date,
  nome_conjuge text,
  observacoes text,
  cargo_id uuid REFERENCES cargos(id) ON DELETE SET NULL,
  ministerio_id uuid REFERENCES ministerios(id) ON DELETE SET NULL,
  grupo_familiar_id uuid,
  papel_grupo text CHECK (papel_grupo IN ('membro', 'líder', 'co-líder')),
  endereco_completo text,
  cep text,
  cidade text,
  estado text,
  latitude numeric,
  longitude numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE pessoas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem visualizar pessoas"
  ON pessoas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir pessoas"
  ON pessoas FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar pessoas"
  ON pessoas FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar pessoas"
  ON pessoas FOR DELETE
  TO authenticated
  USING (true);

-- Tabela de Grupos Familiares (deve ser criada depois de pessoas)
CREATE TABLE IF NOT EXISTS grupos_familiares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  lider_id uuid REFERENCES pessoas(id) ON DELETE SET NULL,
  co_lider_id uuid REFERENCES pessoas(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE grupos_familiares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem visualizar grupos familiares"
  ON grupos_familiares FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir grupos familiares"
  ON grupos_familiares FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar grupos familiares"
  ON grupos_familiares FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar grupos familiares"
  ON grupos_familiares FOR DELETE
  TO authenticated
  USING (true);

-- Adicionar FK de grupos_familiares em pessoas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'pessoas_grupo_familiar_id_fkey'
  ) THEN
    ALTER TABLE pessoas ADD CONSTRAINT pessoas_grupo_familiar_id_fkey
      FOREIGN KEY (grupo_familiar_id) REFERENCES grupos_familiares(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Tabela de Ocorrências
CREATE TABLE IF NOT EXISTS ocorrencias (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id uuid NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
  tipo_ocorrencia_id uuid NOT NULL REFERENCES tipos_ocorrencias(id) ON DELETE RESTRICT,
  data_ocorrencia date NOT NULL,
  descricao text NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE ocorrencias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem visualizar ocorrências"
  ON ocorrencias FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir ocorrências"
  ON ocorrencias FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar ocorrências"
  ON ocorrencias FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar ocorrências"
  ON ocorrencias FOR DELETE
  TO authenticated
  USING (true);

-- Tabela de Histórico
CREATE TABLE IF NOT EXISTS historico_pessoas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pessoa_id uuid NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
  acao text NOT NULL,
  detalhes jsonb,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE historico_pessoas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem visualizar histórico"
  ON historico_pessoas FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem inserir histórico"
  ON historico_pessoas FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_pessoas_nome ON pessoas(nome_completo);
CREATE INDEX IF NOT EXISTS idx_pessoas_cargo ON pessoas(cargo_id);
CREATE INDEX IF NOT EXISTS idx_pessoas_ministerio ON pessoas(ministerio_id);
CREATE INDEX IF NOT EXISTS idx_pessoas_grupo ON pessoas(grupo_familiar_id);
CREATE INDEX IF NOT EXISTS idx_ocorrencias_pessoa ON ocorrencias(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_historico_pessoa ON historico_pessoas(pessoa_id);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at em pessoas
DROP TRIGGER IF EXISTS update_pessoas_updated_at ON pessoas;
CREATE TRIGGER update_pessoas_updated_at
  BEFORE UPDATE ON pessoas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados iniciais
INSERT INTO cargos (nome, descricao) VALUES
  ('Pastor', 'Pastor da igreja'),
  ('Líder', 'Líder de ministério ou grupo'),
  ('Diácono', 'Diácono da igreja'),
  ('Membro', 'Membro da igreja')
ON CONFLICT (nome) DO NOTHING;

INSERT INTO tipos_ocorrencias (nome) VALUES
  ('Visita'),
  ('Aconselhamento'),
  ('Disciplina'),
  ('Batismo'),
  ('Casamento'),
  ('Transferência'),
  ('Afastamento'),
  ('Outros')
ON CONFLICT (nome) DO NOTHING;