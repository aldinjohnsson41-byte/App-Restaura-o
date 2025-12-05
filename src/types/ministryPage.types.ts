// types/ministryPage.types.ts

export type MinistryStatus = 'ativo' | 'inativo';
export type MemberRole = 'membro' | 'lider';
export type MemberStatus = 'ativo' | 'inativo' | 'afastado';

export interface Ministry {
  id: string;
  nome: string;
  descricao?: string;
  status: MinistryStatus;
  cor: string;
  membros_count?: number;
  escalas_count?: number;
}

export interface Member {
  id: string;
  pessoa_id: string;
  nome_completo: string;
  funcao: MemberRole;
  status: MemberStatus;
  data_entrada: string;
  email?: string;
  telefone?: string;
}

export interface Schedule {
  id: string;
  data_escala: string;
  hora_inicio: string;
  hora_fim: string;
  status: string;
  membros: Member[];
}

export interface MinistryFormData {
  nome: string;
  descricao: string;
  status: MinistryStatus;
  cor: string;
}

export type ViewType = 'list' | 'form' | 'details';
export type TabType = 'dados' | 'membros' | 'escalas';