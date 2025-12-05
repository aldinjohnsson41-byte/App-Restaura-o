// types/ministerios.ts

export type MinistryStatus = 'ativo' | 'inativo';
export type MemberRole = 'membro' | 'lider';
export type MemberStatus = 'ativo' | 'inativo' | 'afastado';
export type ScheduleStatus = 'planejada' | 'confirmada' | 'cancelada' | 'concluida';

export interface Ministry {
  id: string;
  nome: string;
  descricao?: string | null;
  status: MinistryStatus;
  cor: string;
  membros_count?: number | null;
  escalas_count?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface Pessoa {
  id: string;
  nome_completo: string;
  email?: string | null;
  telefone?: string | null;
  data_nascimento?: string | null;
  status?: string | null;
}

export interface MinistryMemberRow {
  id: string;
  ministerio_id: string;
  pessoa_id: string;
  funcao?: MemberRole | null;
  status?: MemberStatus | null;
  data_entrada?: string | null;
  pessoa?: Pessoa | null;
}

export interface ScheduleRow {
  id: string;
  ministerio_id: string;
  data_escala: string;
  hora_inicio: string;
  hora_fim: string;
  status: ScheduleStatus;
  observacoes?: string | null;
}

export interface ScaleMemberRow {
  id: string;
  escala_id: string;
  pessoa_id: string;
  pessoa?: Pessoa | null;
}

export interface MinistryFormData {
  nome: string;
  descricao: string;
  status: MinistryStatus;
  cor: string;
}

export interface MemberFormData {
  pessoa_id: string;
  funcao: MemberRole;
  status: MemberStatus;
  data_entrada: string;
}

export interface ScheduleFormData {
  data_escala: string;
  hora_inicio: string;
  hora_fim: string;
  observacoes: string;
}