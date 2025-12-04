export interface EspacoFisico {
  id: string;
  nome: string;
  descricao?: string;
  capacidade?: number;
  localizacao?: string;
  equipamentos?: string[];
  foto_url?: string;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface DisponibilidadeEspaco {
  id: string;
  espaco_id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  disponivel: boolean;
  created_at: string;
}

export interface EventoAgenda {
  id: string;
  nome: string;
  descricao?: string;
  data_evento: string;
  // ✅ Novos campos para múltiplos dias
  data_fim?: string;
  multiplos_dias?: boolean;
  endereco_completo?: string;
  hora_inicio?: string;
  hora_fim?: string;
  dia_inteiro: boolean;
  local?: string;
  espaco_id?: string;
  status: 'confirmado' | 'pendente' | 'cancelado';
  criado_por: string;
  google_calendar_id?: string;
  sincronizado_google: boolean;
  data_sincronizacao_google?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  espaco?: EspacoFisico;
  participantes?: ParticipanteEvento[];
}

export interface ParticipanteEvento {
  id: string;
  evento_id: string;
  pessoa_id: string;
  confirmacao_presenca: 'confirmado' | 'pendente' | 'recusado';
  data_confirmacao?: string;
  notificacao_enviada: boolean;
  email_enviado_para?: string;
  created_at: string;
  pessoa?: {
    id: string;
    nome_completo: string;
    email?: string;
    telefone?: string;
  };
}

export interface ReservaEspaco {
  id: string;
  espaco_id: string;
  evento_id?: string;
  data_reserva: string;
  hora_inicio: string;
  hora_fim: string;
  responsavel_nome: string;
  responsavel_email?: string;
  responsavel_telefone?: string;
  status: 'confirmada' | 'pendente' | 'cancelada';
  valor_locacao?: number;
  observacoes?: string;
  criado_por: string;
  created_at: string;
  updated_at: string;
  espaco?: EspacoFisico;
}

export interface Feriado {
  id: string;
  data: string;
  nome: string;
  tipo: 'nacional' | 'estadual' | 'municipal' | 'religioso';
  recorrente: boolean;
  mes?: number;
  dia?: number;
  created_at: string;
}

export interface SincronizacaoGoogle {
  id: string;
  usuario_id: string;
  evento_id: string;
  google_calendar_id: string;
  google_event_id: string;
  direcao: 'exportacao' | 'importacao';
  status_sincronizacao: 'sucesso' | 'erro' | 'pendente';
  mensagem_erro?: string;
  ultima_sincronizacao?: string;
  created_at: string;
  updated_at: string;
}

export interface ConfiguracaoNotificacoes {
  id: string;
  usuario_id: string;
  notificar_novo_evento: boolean;
  notificar_confirmacao: boolean;
  notificar_cancelamento: boolean;
  notificar_alteracao: boolean;
  notificar_convite_evento: boolean;
  notificar_lembretes_evento: boolean;
  antecedencia_lembrete: number;
  email_primario: string;
  email_secundario?: string;
  created_at: string;
  updated_at: string;
}

// ✅ Interface atualizada com novos campos
export interface EventoFormData {
  nome: string;
  descricao: string;
  data_evento: string;
  data_fim?: string;
  multiplos_dias?: boolean;
  hora_inicio: string;
  hora_fim: string;
  dia_inteiro: boolean;
  local: string;
  endereco_completo?: string;
  espaco_id: string;
  status: 'confirmado' | 'pendente' | 'cancelado';
  participantes_ids: string[];
  observacoes: string;
}

export interface ReservaFormData {
  espaco_id: string;
  data_reserva: string;
  hora_inicio: string;
  hora_fim: string;
  responsavel_nome: string;
  responsavel_email: string;
  responsavel_telefone: string;
  status: 'confirmada' | 'pendente' | 'cancelada';
  valor_locacao: string;
  observacoes: string;
}

export interface ConflitoDiagnostico {
  existe: boolean;
  tipo: 'espaco' | 'horario' | 'nenhum';
  mensagem: string;
  conflitos: Array<{
    evento_id?: string;
    reserva_id?: string;
    nome: string;
    data: string;
    hora_inicio: string;
    hora_fim: string;
  }>;
}

export interface CalendarMonth {
  mes: number;
  ano: number;
  dias: CalendarDay[];
}

export interface CalendarDay {
  data: string;
  dia: number;
  mes: number;
  ano: number;
  ehMes: boolean;
  ehHoje: boolean;
  ehFeriado: boolean;
  feriado?: Feriado;
  eventos: EventoAgenda[];
  reservas: ReservaEspaco[];
}