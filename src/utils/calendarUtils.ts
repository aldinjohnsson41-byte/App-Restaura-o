// =============================================================
// calendarUtils.ts - VersÃ£o Integrada com Melhorias
// =============================================================

import { CalendarMonth, CalendarDay, Feriado, EventoAgenda, ReservaEspaco } from '../types/calendar';

/* ============================================================
   1. ExpansÃ£o de eventos mÃºltiplos dias
============================================================ */
export function expandirEventosMultiplosDias(eventos: EventoAgenda[]): EventoAgenda[] {
  const eventosExpandidos: EventoAgenda[] = [];

  eventos.forEach(evento => {
    if (!evento.multiplos_dias || !evento.data_fim) {
      eventosExpandidos.push(evento);
      return;
    }

    const dataInicio = new Date(evento.data_evento + 'T00:00:00');
    const dataFim = new Date(evento.data_fim + 'T00:00:00');

    let dataAtual = new Date(dataInicio);

    while (dataAtual <= dataFim) {
      eventosExpandidos.push({
        ...evento,
        data_evento: dataAtual.toISOString().split('T')[0],
        _isPrimeiroDia: dataAtual.getTime() === dataInicio.getTime(),
        _isUltimoDia: dataAtual.getTime() === dataFim.getTime(),
      } as any);

      dataAtual.setDate(dataAtual.getDate() + 1);
    }
  });

  return eventosExpandidos;
}

/* ============================================================
   2. VerificaÃ§Ã£o de conflitos de horÃ¡rio
============================================================ */
function converterHoraParaMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number);
  return h * 60 + m;
}

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
  
  if (novoEvento.dia_inteiro) return { existe: false, conflitos: [] };
  if (!novoEvento.hora_inicio || !novoEvento.hora_fim) return { existe: false, conflitos: [] };

  const conflitos = eventos.filter(evento => {
    if (novoEvento.id && evento.id === novoEvento.id) return false;
    if (evento.data_evento !== novoEvento.data_evento) return false;
    if (evento.dia_inteiro) return true;
    if (novoEvento.espaco_id && evento.espaco_id !== novoEvento.espaco_id) return false;
    if (!evento.hora_inicio || !evento.hora_fim) return false;

    const nInicio = converterHoraParaMinutos(novoEvento.hora_inicio);
    const nFim = converterHoraParaMinutos(novoEvento.hora_fim);
    const eInicio = converterHoraParaMinutos(evento.hora_inicio);
    const eFim = converterHoraParaMinutos(evento.hora_fim);

    return !(nFim <= eInicio || nInicio >= eFim);
  });

  return { existe: conflitos.length > 0, conflitos };
}

/* ============================================================
   3. GeraÃ§Ã£o completa do calendÃ¡rio (42 dias)
============================================================ */
export function gerarCalendarioComEventos(
  mes: number,
  ano: number,
  eventos: EventoAgenda[],
  reservas: ReservaEspaco[] = [],
  feriados: Feriado[] = []
): CalendarMonth {

  const eventosExpandidos = expandirEventosMultiplosDias(eventos);

  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);
  const diasNoMes = ultimoDia.getDate();
  const primeiroDiaSemana = primeiroDia.getDay();

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dias: CalendarDay[] = [];

  // Dias do mÃªs anterior
  const diasMesAnterior = new Date(ano, mes, 0).getDate();
  for (let i = primeiroDiaSemana - 1; i >= 0; i--) {
    const dia = diasMesAnterior - i;
    const data = new Date(ano, mes - 1, dia);

    dias.push(criarDiaCalendario(data, mes, feriados, eventosExpandidos, reservas));
  }

  // Dias do mÃªs atual
  for (let dia = 1; dia <= diasNoMes; dia++) {
    const data = new Date(ano, mes, dia);
    dias.push(criarDiaCalendario(data, mes, feriados, eventosExpandidos, reservas));
  }

  // Dias do prÃ³ximo mÃªs para completar 42
  const diasRestantes = 42 - dias.length;
  for (let dia = 1; dia <= diasRestantes; dia++) {
    const data = new Date(ano, mes + 1, dia);
    dias.push(criarDiaCalendario(data, mes, feriados, eventosExpandidos, reservas));
  }

  return { mes, ano, dias };
}

/* ============================================================
   4. Criar dia do calendÃ¡rio (usado em ambas as versÃµes)
============================================================ */
export function criarDiaCalendario(
  data: Date,
  mesAtual: number,
  feriados: Feriado[] = [],
  eventos: EventoAgenda[] = [],
  reservas: ReservaEspaco[] = []
): CalendarDay {
  const dataString = formatarData(data);
  const feriado = feriados.find(f => f.data === dataString);

  return {
    data: dataString,
    dia: data.getDate(),
    mes: data.getMonth(),
    ano: data.getFullYear(),
    ehMes: data.getMonth() === mesAtual,
    ehHoje: dataString === formatarData(new Date()),
    ehFeriado: !!feriado,
    feriado,
    eventos: eventos.filter(e => e.data_evento === dataString),
    reservas: reservas.filter(r => r.data_reserva === dataString),
  };
}

/* ============================================================
   5. Formatadores de data e hora
============================================================ */
export function formatarData(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function formatarDataBR(dataString: string): string {
  if (!dataString) return '';
  const [ano, mes, dia] = dataString.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function formatarHora(hora: string): string {
  if (!hora) return '';
  return hora.substring(0, 5);
}

/* ============================================================
   6. Utilidades de texto e cÃ¡lculos
============================================================ */
export function obterNomeMes(mes: number): string {
  const meses = [
    'Janeiro', 'Fevereiro', 'MarÃ§o', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return meses[mes];
}

export function calcularDuracao(horaInicio: string, horaFim: string): string {
  const min = converterHoraParaMinutos(horaFim) - converterHoraParaMinutos(horaInicio);
  const h = Math.floor(min / 60);
  const m = min % 60;

  if (h === 0) return `${m} minutos`;
  if (m === 0) return `${h} hora${h > 1 ? 's' : ''}`;
  return `${h}h ${m}min`;
}

/* ============================================================
   7. Cores por status e tipo de feriado
============================================================ */
export function obterCoresPorStatus(status: string) {
  const cores = {
    confirmado: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
    pendente: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
    cancelado: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' }
  };
  return cores[status as keyof typeof cores] || cores.pendente;
}

export function obterCoresPorTipoFeriado(tipo: string) {
  const cores = {
    nacional: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    estadual: 'bg-blue-100 text-blue-800 border-blue-300',
    municipal: 'bg-green-100 text-green-800 border-green-300',
    religioso: 'bg-purple-100 text-purple-800 border-purple-300'
  };
  return cores[tipo as keyof typeof cores] || 'bg-gray-100 text-gray-800 border-gray-300';
}