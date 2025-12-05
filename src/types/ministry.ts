// types/ministry.ts

export type MinistryStatus = 'ativo' | 'inativo';
export type MemberRole = 'membro' | 'lider';
export type MemberStatus = 'ativo' | 'inativo' | 'afastado';
export type ScheduleStatus = 'planejada' | 'confirmada' | 'concluida' | 'cancelada';
export type ServiceStatus = 'ativo' | 'inativo';
export type OccurrenceStatus = 'planejado' | 'confirmado' | 'realizado' | 'cancelado';
export type ScaleStatus = 'pendente' | 'completo' | 'incompleto';

export interface Ministry {
  id: string;
  nome: string;
  descricao?: string;
  status: MinistryStatus;
  cor: string;
  created_at: string;
  updated_at: string;
  created_by?: string;
  _count?: {
    membros_ativos: number;
    escalas_futuras: number;
  };
}

export interface MinistryMember {
  id: string;
  ministry_id: string;
  pessoa_id: string;
  funcao: MemberRole;
  status: MemberStatus;
  data_entrada: string;
  data_saida?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  pessoa?: {
    id: string;
    nome_completo: string;
    email?: string;
    telefone?: string;
    whatsapp?: string;
  };
  ministry?: Ministry;
}

export interface MinistrySchedule {
  id: string;
  ministry_id: string;
  data_escala: string;
  hora_inicio: string;
  hora_fim: string;
  observacoes?: string;
  status: ScheduleStatus;
  created_at: string;
  updated_at: string;
  created_by?: string;
  ministry?: Ministry;
  membros?: ScheduleMember[];
}

export interface ScheduleMember {
  id: string;
  schedule_id: string;
  pessoa_id: string;
  funcao_escala?: string;
  presente?: boolean;
  observacoes?: string;
  created_at: string;
  pessoa?: {
    id: string;
    nome_completo: string;
    email?: string;
    telefone?: string;
  };
}

export interface Service {
  id: string;
  nome: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  observacoes?: string;
  status: ServiceStatus;
  created_at: string;
  updated_at: string;
  created_by?: string;
  ministerios?: ServiceMinistry[];
}

export interface ServiceMinistry {
  id: string;
  service_id: string;
  ministry_id: string;
  ordem: number;
  obrigatorio: boolean;
  created_at: string;
  ministry?: Ministry;
}

export interface ServiceOccurrence {
  id: string;
  service_id: string;
  data_culto: string;
  hora_inicio: string;
  hora_fim: string;
  status: OccurrenceStatus;
  observacoes?: string;
  tema?: string;
  pregador_id?: string;
  created_at: string;
  updated_at: string;
  service?: Service;
  pregador?: {
    id: string;
    nome_completo: string;
  };
  escalas?: OccurrenceScale[];
}

export interface OccurrenceScale {
  id: string;
  occurrence_id: string;
  ministry_id: string;
  schedule_id?: string;
  status: ScaleStatus;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  ministry?: Ministry;
  schedule?: MinistrySchedule;
  membros?: OccurrenceScaleMember[];
}

export interface OccurrenceScaleMember {
  id: string;
  scale_id: string;
  pessoa_id: string;
  funcao?: string;
  substituindo_id?: string;
  presente?: boolean;
  observacoes?: string;
  created_at: string;
  pessoa?: {
    id: string;
    nome_completo: string;
    email?: string;
    telefone?: string;
  };
  substituindo?: {
    id: string;
    nome_completo: string;
  };
}

export interface ScheduleChange {
  id: string;
  tabela: string;
  registro_id: string;
  acao: 'create' | 'update' | 'delete' | 'substituicao';
  dados_anteriores?: any;
  dados_novos?: any;
  motivo?: string;
  created_at: string;
  created_by?: string;
}

// Form Types
export interface MinistryFormData {
  nome: string;
  descricao: string;
  status: MinistryStatus;
  cor: string;
}

export interface MemberFormData {
  ministry_id: string;
  pessoa_id: string;
  funcao: MemberRole;
  status: MemberStatus;
  data_entrada: string;
  data_saida?: string;
  observacoes?: string;
}

export interface ScheduleFormData {
  ministry_id: string;
  data_escala: string;
  hora_inicio: string;
  hora_fim: string;
  observacoes?: string;
  status: ScheduleStatus;
  membros: {
    pessoa_id: string;
    funcao_escala?: string;
  }[];
}

export interface ServiceFormData {
  nome: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  observacoes?: string;
  status: ServiceStatus;
  ministerios: {
    ministry_id: string;
    ordem: number;
    obrigatorio: boolean;
  }[];
}

export interface OccurrenceFormData {
  service_id: string;
  data_culto: string;
  hora_inicio: string;
  hora_fim: string;
  status: OccurrenceStatus;
  observacoes?: string;
  tema?: string;
  pregador_id?: string;
}

// Filter Types
export interface MinistryFilters {
  status?: MinistryStatus;
  search?: string;
}

export interface MemberFilters {
  ministry_id?: string;
  funcao?: MemberRole;
  status?: MemberStatus;
  search?: string;
}

export interface ScheduleFilters {
  ministry_id?: string;
  data_inicio?: string;
  data_fim?: string;
  status?: ScheduleStatus;
}

export interface ServiceFilters {
  status?: ServiceStatus;
  dia_semana?: number;
  search?: string;
}

export interface OccurrenceFilters {
  service_id?: string;
  data_inicio?: string;
  data_fim?: string;
  status?: OccurrenceStatus;
}

// Utility Types
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// Constants
export const DIAS_SEMANA = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Segunda-feira' },
  { value: 2, label: 'Terça-feira' },
  { value: 3, label: 'Quarta-feira' },
  { value: 4, label: 'Quinta-feira' },
  { value: 5, label: 'Sexta-feira' },
  { value: 6, label: 'Sábado' }
];

export const MINISTRY_STATUS_LABELS: Record<MinistryStatus, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo'
};

export const MEMBER_ROLE_LABELS: Record<MemberRole, string> = {
  membro: 'Membro',
  lider: 'Líder'
};

export const MEMBER_STATUS_LABELS: Record<MemberStatus, string> = {
  ativo: 'Ativo',
  inativo: 'Inativo',
  afastado: 'Afastado'
};

export const SCHEDULE_STATUS_LABELS: Record<ScheduleStatus, string> = {
  planejada: 'Planejada',
  confirmada: 'Confirmada',
  concluida: 'Concluída',
  cancelada: 'Cancelada'
};

export const OCCURRENCE_STATUS_LABELS: Record<OccurrenceStatus, string> = {
  planejado: 'Planejado',
  confirmado: 'Confirmado',
  realizado: 'Realizado',
  cancelado: 'Cancelado'
};

export const SCALE_STATUS_LABELS: Record<ScaleStatus, string> = {
  pendente: 'Pendente',
  completo: 'Completo',
  incompleto: 'Incompleto'
};

// Color utilities
export const MINISTRY_COLORS = [
  '#3B82F6', // blue
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
];

export const STATUS_COLORS = {
  ativo: 'bg-green-100 text-green-800 border-green-200',
  inativo: 'bg-slate-100 text-slate-800 border-slate-200',
  afastado: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  planejada: 'bg-blue-100 text-blue-800 border-blue-200',
  confirmada: 'bg-green-100 text-green-800 border-green-200',
  concluida: 'bg-slate-100 text-slate-800 border-slate-200',
  cancelada: 'bg-red-100 text-red-800 border-red-200',
  planejado: 'bg-blue-100 text-blue-800 border-blue-200',
  confirmado: 'bg-green-100 text-green-800 border-green-200',
  realizado: 'bg-slate-100 text-slate-800 border-slate-200',
  cancelado: 'bg-red-100 text-red-800 border-red-200',
  pendente: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  completo: 'bg-green-100 text-green-800 border-green-200',
  incompleto: 'bg-red-100 text-red-800 border-red-200',
};