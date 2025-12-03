import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Cargo {
  id: string;
  nome: string;
  descricao: string | null;
  created_at: string;
}

export interface Ministerio {
  id: string;
  nome: string;
  descricao: string | null;
  created_at: string;
}

export interface GrupoFamiliar {
  id: string;
  nome: string;
  descricao: string | null;
  lider_id: string | null;
  co_lider_id: string | null;
  created_at: string;
}

export interface TipoOcorrencia {
  id: string;
  nome: string;
  created_at: string;
}

export interface Pessoa {
  id: string;
  nome_completo: string;
  data_nascimento: string;
  estado_civil: 'solteiro' | 'casado' | 'viúvo' | 'divorciado';
  telefone: string;
  whatsapp: string | null;
  email: string | null;
  profissao: string | null;
  e_membro: boolean;
  data_membro: string | null;
  nome_conjuge: string | null;
  observacoes: string | null;
  cargo_id: string | null;
  ministerio_id: string | null;
  grupo_familiar_id: string | null;
  papel_grupo: 'membro' | 'líder' | 'co-líder' | null;
  endereco_completo: string | null;
  cep: string | null;
  cidade: string | null;
  estado: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Ocorrencia {
  id: string;
  pessoa_id: string;
  tipo_ocorrencia_id: string;
  data_ocorrencia: string;
  descricao: string;
  created_at: string;
  created_by: string | null;
}

export interface HistoricoPessoa {
  id: string;
  pessoa_id: string;
  acao: string;
  detalhes: Record<string, unknown> | null;
  created_at: string;
  created_by: string | null;
}
