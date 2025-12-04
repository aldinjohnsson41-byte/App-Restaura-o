// calendarUtils.ts - Funções para gerenciar calendário com eventos de múltiplos dias

export interface EventoAgenda {
  id: string;
  nome: string;
  descricao?: string;
  data_evento: string;
  data_fim?: string;
  hora_inicio?: string;
  hora_fim?: string;
  dia_inteiro: boolean;
  multiplos_dias: boolean;
  status: 'confirmado' | 'pendente' | 'cancelado';
  espaco_id?: string;
  espaco?: any;
  participantes?: any[];
  endereco_completo?: string;
  observacoes?: string;
}

export interface CalendarDay {
  dia: number;
  ehMes: boolean;
  ehHoje: boolean;
  ehFeriado: boolean;
  feriado?: any;
  eventos: EventoAgenda[];
  reservas: any[];
  dataCompleta: Date;
}

export interface CalendarMonth {
  mes: number;
  ano: number;
  dias: CalendarDay[];
}

/**
 * Expande eventos de múltiplos dias em todos os dias do período
 */
export function expandirEventosMultiplosDias(eventos: EventoAgenda[]): EventoAgenda[] {
  const eventosExpandidos: EventoAgenda[] = [];

  eventos.forEach(evento => {
    if (!evento.multiplos_dias || !evento.data_fim) {
      // Evento de um único dia
      eventosExpandidos.push(evento);
      return;
    }

    // Evento de múltiplos dias - criar uma entrada para cada dia
    const dataInicio = new Date(evento.data_evento + 'T00:00:00');
    const dataFim = new Date(evento.data_fim + 'T00:00:00');
    
    let dataAtual = new Date(dataInicio);
    
    while (dataAtual <= dataFim) {
      eventosExpandidos.push({
        ...evento,
        data_evento: dataAtual.toISOString().split('T')[0],
        // Marcar se é o primeiro ou último dia para exibição diferenciada
        _isPrimeiroDia: dataAtual.getTime() === dataInicio.getTime(),
        _isUltimoDia: dataAtual.getTime() === dataFim.getTime(),
      } as any);
      
      dataAtual.setDate(dataAtual.getDate() + 1);
    }
  });

  return eventosExpandidos;
}

/**
 * Verifica conflitos de horários entre eventos
 */
export function verificarConflitosHorario(
  eventos: EventoAgenda[],
  novoEvento: {
    data_evento: string;
    hora_inicio?: string;
    hora_fim?: string;
    dia_inteiro: boolean;
    espaco_id?: string;
    id?: string;
  }
): { existe: boolean; conflitos: EventoAgenda[] } {
  
  // Se é evento de dia inteiro, não há conflito de horário
  if (novoEvento.dia_inteiro) {
    return { existe: false, conflitos: [] };
  }

  // Se não tem horário, não há como verificar
  if (!novoEvento.hora_inicio || !novoEvento.hora_fim) {
    return { existe: false, conflitos: [] };
  }

  const conflitos = eventos.filter(evento => {
    // Ignorar o próprio evento (em caso de edição)
    if (novoEvento.id && evento.id === novoEvento.id) {
      return false;
    }

    // Verificar se é no mesmo dia
    if (evento.data_evento !== novoEvento.data_evento) {
      return false;
    }

    // Se o evento existente é de dia inteiro, há conflito
    if (evento.dia_inteiro) {
      return true;
    }

    // Verificar se é no mesmo espaço (se aplicável)
    if (novoEvento.espaco_id && evento.espaco_id !== novoEvento.espaco_id) {
      return false;
    }

    // Verificar sobreposição de horários
    if (!evento.hora_inicio || !evento.hora_fim) {
      return false;
    }

    const novoInicio = converterHoraParaMinutos(novoEvento.hora_inicio);
    const novoFim = converterHoraParaMinutos(novoEvento.hora_fim);
    const eventoInicio = converterHoraParaMinutos(evento.hora_inicio);
    const eventoFim = converterHoraParaMinutos(evento.hora_fim);

    // Há conflito se os horários se sobrepõem
    return !(novoFim <= eventoInicio || novoInicio >= eventoFim);
  });

  return {
    existe: conflitos.length > 0,
    conflitos
  };
}

/**
 * Converte hora HH:MM para minutos desde meia-noite
 */
function converterHoraParaMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

/**
 * Gera o calendário do mês com eventos expandidos
 */
export function gerarCalendarioComEventos(
  mes: number,
  ano: number,
  eventos: EventoAgenda[],
  reservas: any[] = [],
  feriados: any[] = []
): CalendarMonth {
  const eventosExpandidos = expandirEventosMultiplosDias(eventos);
  
  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);
  const diasNoMes = ultimoDia.getDate();
  const primeiroDiaSemana = primeiroDia.getDay();
  
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  
  const dias: CalendarDay[] = [];
  
  // Dias do mês anterior
  const diasMesAnterior = new Date(ano, mes, 0).getDate();
  for (let i = primeiroDiaSemana - 1; i >= 0; i--) {
    const dia = diasMesAnterior - i;
    const data = new Date(ano, mes - 1, dia);
    
    dias.push({
      dia,
      ehMes: false,
      ehHoje: false,
      ehFeriado: false,
      eventos: [],
      reservas: [],
      dataCompleta: data
    });
  }
  
  // Dias do mês atual
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const data = new Date(ano, mes, dia);
    const dataStr = data.toISOString().split('T')[0];
    
    const eventosD ia = eventosExpandidos.filter(e => e.data_evento === dataStr);
    const reservasDia = reservas.filter(r => r.data_reserva === dataStr);
    const feriadoDia = feriados.find(f => f.data === dataStr);
    
    dias.push({
      dia,
      ehMes: true,
      ehHoje: data.getTime() === hoje.getTime(),
      ehFeriado: !!feriadoDia,
      feriado: feriadoDia,
      eventos: eventosDia,
      reservas: reservasDia,
      dataCompleta: data
    });
  }
  
  // Dias do próximo mês
  const diasRestantes = 42 - dias.length; // 6 semanas x 7 dias
  for (let dia = 1; dia <= diasRestantes; dia++) {
    const data = new Date(ano, mes + 1, dia);
    
    dias.push({
      dia,
      ehMes: false,
      ehHoje: false,
      ehFeriado: false,
      eventos: [],
      reservas: [],
      dataCompleta: data
    });
  }
  
  return {
    mes,
    ano,
    dias
  };
}

/**
 * Formata data para exibição (DD/MM/AAAA)
 */
export function formatarDataBR(data: string): string {
  if (!data) return '';
  const [ano, mes, dia] = data.split('-');
  return `${dia}/${mes}/${ano}`;
}

/**
 * Formata hora para exibição (HH:MM)
 */
export function formatarHora(hora: string): string {
  if (!hora) return '';
  return hora.substring(0, 5);
}

/**
 * Obtém nome do mês
 */
export function obterNomeMes(mes: number): string {
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return meses[mes];
}

/**
 * Obtém cores por status do evento
 */
export function obterCoresPorStatus(status: string) {
  const cores = {
    confirmado: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    pendente: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    cancelado: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' }
  };
  return cores[status as keyof typeof cores] || cores.pendente;
}

/**
 * Obtém cores por tipo de feriado
 */
export function obterCoresPorTipoFeriado(tipo: string) {
  const cores = {
    nacional: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    estadual: 'bg-blue-100 text-blue-800 border-blue-300',
    municipal: 'bg-green-100 text-green-800 border-green-300',
    religioso: 'bg-purple-100 text-purple-800 border-purple-300'
  };
  return cores[tipo as keyof typeof cores] || 'bg-gray-100 text-gray-800 border-gray-300';
}

/**
 * Calcula duração entre dois horários
 */
export function calcularDuracao(horaInicio: string, horaFim: string): string {
  if (!horaInicio || !horaFim) return '';
  
  const minutos = converterHoraParaMinutos(horaFim) - converterHoraParaMinutos(horaInicio);
  const horas = Math.floor(minutos / 60);
  const mins = minutos % 60;
  
  if (horas === 0) return `${mins} minutos`;
  if (mins === 0) return `${horas} hora${horas > 1 ? 's' : ''}`;
  return `${horas}h ${mins}min`;
}