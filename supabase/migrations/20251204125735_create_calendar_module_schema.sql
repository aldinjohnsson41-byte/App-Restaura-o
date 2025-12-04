/*
  # Módulo de Agenda da Igreja - Schema Completo
  
  1. Novas Tabelas
    - `espacos_fisicos` - Espaços da igreja (auditório, sala, etc)
    - `disponibilidade_espacos` - Horários disponíveis para locação
    - `eventos_agenda` - Eventos da agenda da igreja
    - `participantes_evento` - Participantes dos eventos
    - `reservas_espacos` - Reservas de espaços físicos
    - `feriados` - Feriados nacionais e locais
    - `sincronizacao_google` - Histórico de sincronização Google Calendar
    - `configuracoes_notificacoes` - Preferências de notificações por usuário
    
  2. Segurança
    - Habilitar RLS em todas as tabelas
    - Políticas para usuários autenticados
    
  3. Índices para Performance
    - Índices para consultas frequentes
    - Índices para filtros de data/horário
*/

-- Tabela de Espaços Físicos
CREATE TABLE IF NOT EXISTS espacos_fisicos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  descricao text,
  capacidade integer,
  localizacao text,
  equipamentos text[],
  foto_url text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE espacos_fisicos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem visualizar espaços"
  ON espacos_fisicos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar espaços"
  ON espacos_fisicos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar espaços"
  ON espacos_fisicos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem deletar espaços"
  ON espacos_fisicos FOR DELETE
  TO authenticated
  USING (true);

-- Tabela de Disponibilidade de Espaços
CREATE TABLE IF NOT EXISTS disponibilidade_espacos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  espaco_id uuid NOT NULL REFERENCES espacos_fisicos(id) ON DELETE CASCADE,
  dia_semana integer NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio time NOT NULL,
  hora_fim time NOT NULL,
  disponivel boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE disponibilidade_espacos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem visualizar disponibilidade"
  ON disponibilidade_espacos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem gerenciar disponibilidade"
  ON disponibilidade_espacos FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar disponibilidade"
  ON disponibilidade_espacos FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tabela de Eventos da Agenda
CREATE TABLE IF NOT EXISTS eventos_agenda (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  data_evento date NOT NULL,
  hora_inicio time,
  hora_fim time,
  dia_inteiro boolean DEFAULT false,
  local text,
  espaco_id uuid REFERENCES espacos_fisicos(id) ON DELETE SET NULL,
  status text NOT NULL CHECK (status IN ('confirmado', 'pendente', 'cancelado')) DEFAULT 'confirmado',
  criado_por uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_calendar_id text,
  sincronizado_google boolean DEFAULT false,
  data_sincronizacao_google timestamptz,
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE eventos_agenda ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem visualizar eventos"
  ON eventos_agenda FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar eventos"
  ON eventos_agenda FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = criado_por);

CREATE POLICY "Criadores podem atualizar seus eventos"
  ON eventos_agenda FOR UPDATE
  TO authenticated
  USING (auth.uid() = criado_por)
  WITH CHECK (auth.uid() = criado_por);

CREATE POLICY "Criadores podem deletar seus eventos"
  ON eventos_agenda FOR DELETE
  TO authenticated
  USING (auth.uid() = criado_por);

-- Tabela de Participantes de Eventos
CREATE TABLE IF NOT EXISTS participantes_evento (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  evento_id uuid NOT NULL REFERENCES eventos_agenda(id) ON DELETE CASCADE,
  pessoa_id uuid NOT NULL REFERENCES pessoas(id) ON DELETE CASCADE,
  confirmacao_presenca text DEFAULT 'pendente' CHECK (confirmacao_presenca IN ('confirmado', 'pendente', 'recusado')),
  data_confirmacao timestamptz,
  notificacao_enviada boolean DEFAULT false,
  email_enviado_para text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE participantes_evento ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem visualizar participantes"
  ON participantes_evento FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem adicionar participantes"
  ON participantes_evento FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Usuários autenticados podem atualizar confirmação"
  ON participantes_evento FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tabela de Reservas de Espaços
CREATE TABLE IF NOT EXISTS reservas_espacos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  espaco_id uuid NOT NULL REFERENCES espacos_fisicos(id) ON DELETE CASCADE,
  evento_id uuid REFERENCES eventos_agenda(id) ON DELETE SET NULL,
  data_reserva date NOT NULL,
  hora_inicio time NOT NULL,
  hora_fim time NOT NULL,
  responsavel_nome text NOT NULL,
  responsavel_email text,
  responsavel_telefone text,
  status text NOT NULL CHECK (status IN ('confirmada', 'pendente', 'cancelada')) DEFAULT 'confirmada',
  valor_locacao numeric(10,2),
  observacoes text,
  criado_por uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reservas_espacos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem visualizar reservas"
  ON reservas_espacos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar reservas"
  ON reservas_espacos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = criado_por);

CREATE POLICY "Criadores podem atualizar suas reservas"
  ON reservas_espacos FOR UPDATE
  TO authenticated
  USING (auth.uid() = criado_por)
  WITH CHECK (auth.uid() = criado_por);

CREATE POLICY "Criadores podem deletar suas reservas"
  ON reservas_espacos FOR DELETE
  TO authenticated
  USING (auth.uid() = criado_por);

-- Tabela de Feriados
CREATE TABLE IF NOT EXISTS feriados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL UNIQUE,
  nome text NOT NULL,
  tipo text CHECK (tipo IN ('nacional', 'estadual', 'municipal', 'religioso')) DEFAULT 'nacional',
  recorrente boolean DEFAULT false,
  mes integer,
  dia integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE feriados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários autenticados podem visualizar feriados"
  ON feriados FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Usuários autenticados podem criar feriados"
  ON feriados FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Tabela de Sincronização Google Calendar
CREATE TABLE IF NOT EXISTS sincronizacao_google (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evento_id uuid NOT NULL REFERENCES eventos_agenda(id) ON DELETE CASCADE,
  google_calendar_id text NOT NULL,
  google_event_id text NOT NULL,
  direcao text CHECK (direcao IN ('exportacao', 'importacao')) DEFAULT 'exportacao',
  status_sincronizacao text CHECK (status_sincronizacao IN ('sucesso', 'erro', 'pendente')) DEFAULT 'pendente',
  mensagem_erro text,
  ultima_sincronizacao timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE sincronizacao_google ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem visualizar sua sincronização"
  ON sincronizacao_google FOR SELECT
  TO authenticated
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem criar sincronização"
  ON sincronizacao_google FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar sua sincronização"
  ON sincronizacao_google FOR UPDATE
  TO authenticated
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

-- Tabela de Configurações de Notificações
CREATE TABLE IF NOT EXISTS configuracoes_notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  notificar_novo_evento boolean DEFAULT true,
  notificar_confirmacao boolean DEFAULT true,
  notificar_cancelamento boolean DEFAULT true,
  notificar_alteracao boolean DEFAULT true,
  notificar_convite_evento boolean DEFAULT true,
  notificar_lembretes_evento boolean DEFAULT true,
  antecedencia_lembrete integer DEFAULT 24,
  email_primario text NOT NULL,
  email_secundario text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE configuracoes_notificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuários podem visualizar suas configurações"
  ON configuracoes_notificacoes FOR SELECT
  TO authenticated
  USING (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem atualizar suas configurações"
  ON configuracoes_notificacoes FOR UPDATE
  TO authenticated
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Usuários podem criar suas configurações"
  ON configuracoes_notificacoes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = usuario_id);

-- Índices para Performance
CREATE INDEX IF NOT EXISTS idx_eventos_data ON eventos_agenda(data_evento);
CREATE INDEX IF NOT EXISTS idx_eventos_espaco ON eventos_agenda(espaco_id);
CREATE INDEX IF NOT EXISTS idx_eventos_criador ON eventos_agenda(criado_por);
CREATE INDEX IF NOT EXISTS idx_eventos_status ON eventos_agenda(status);
CREATE INDEX IF NOT EXISTS idx_participantes_evento ON participantes_evento(evento_id);
CREATE INDEX IF NOT EXISTS idx_participantes_pessoa ON participantes_evento(pessoa_id);
CREATE INDEX IF NOT EXISTS idx_reservas_espaco ON reservas_espacos(espaco_id);
CREATE INDEX IF NOT EXISTS idx_reservas_data ON reservas_espacos(data_reserva);
CREATE INDEX IF NOT EXISTS idx_disponibilidade_espaco ON disponibilidade_espacos(espaco_id);
CREATE INDEX IF NOT EXISTS idx_sincronizacao_usuario ON sincronizacao_google(usuario_id);
CREATE INDEX IF NOT EXISTS idx_feriados_data ON feriados(data);

-- Função para atualizar updated_at em eventos
CREATE OR REPLACE FUNCTION update_eventos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_eventos_agenda_updated_at ON eventos_agenda;
CREATE TRIGGER update_eventos_agenda_updated_at
  BEFORE UPDATE ON eventos_agenda
  FOR EACH ROW
  EXECUTE FUNCTION update_eventos_updated_at();

-- Função para atualizar updated_at em reservas
CREATE OR REPLACE FUNCTION update_reservas_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_reservas_espacos_updated_at ON reservas_espacos;
CREATE TRIGGER update_reservas_espacos_updated_at
  BEFORE UPDATE ON reservas_espacos
  FOR EACH ROW
  EXECUTE FUNCTION update_reservas_updated_at();

-- Inserir espaços padrão
INSERT INTO espacos_fisicos (nome, descricao, capacidade, localizacao, equipamentos) VALUES
  ('Auditório Principal', 'Auditório com projeção e som', 200, 'Bloco Principal', ARRAY['projetor', 'som', 'microfone']),
  ('Sala de Reunião 1', 'Sala para reuniões pequenas', 20, 'Bloco Administrativo', ARRAY['quadro branco', 'projetor']),
  ('Sala de Reunião 2', 'Sala para reuniões pequenas', 20, 'Bloco Administrativo', ARRAY['quadro branco']),
  ('Espaço de Eventos', 'Espaço aberto para eventos', 500, 'Área Externa', ARRAY['som', 'iluminação']),
  ('Sala de Aula 1', 'Sala para ensino', 30, 'Bloco de Educação', ARRAY['quadro', 'carteiras'])
ON CONFLICT (nome) DO NOTHING;

-- Inserir feriados brasileiros 2024
INSERT INTO feriados (data, nome, tipo, recorrente, mes, dia) VALUES
  ('2024-01-01', 'Confraternização Universal', 'nacional', true, 1, 1),
  ('2024-02-13', 'Carnaval', 'nacional', false, 2, 13),
  ('2024-03-29', 'Sexta-feira Santa', 'religioso', false, 3, 29),
  ('2024-04-21', 'Tiradentes', 'nacional', true, 4, 21),
  ('2024-05-01', 'Dia do Trabalho', 'nacional', true, 5, 1),
  ('2024-09-07', 'Independência do Brasil', 'nacional', true, 9, 7),
  ('2024-10-12', 'Nossa Senhora Aparecida', 'religioso', true, 10, 12),
  ('2024-11-02', 'Finados', 'nacional', true, 11, 2),
  ('2024-11-15', 'Proclamação da República', 'nacional', true, 11, 15),
  ('2024-11-20', 'Consciência Negra', 'nacional', true, 11, 20),
  ('2024-12-25', 'Natal', 'religioso', true, 12, 25)
ON CONFLICT (data) DO NOTHING;
