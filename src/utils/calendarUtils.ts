import { CalendarMonth, CalendarDay, Feriado, EventoAgenda, ReservaEspaco } from '../types/calendar';

export function gerarCalendarMes(
  mes: number,
  ano: number,
  feriados: Feriado[] = [],
  eventos: EventoAgenda[] = [],
  reservas: ReservaEspaco[] = []
): CalendarMonth {
  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);
  const diaSemanaInicial = primeiroDia.getDay();

  const dias: CalendarDay[] = [];
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Dias do mês anterior
  for (let i = diaSemanaInicial - 1; i >= 0; i--) {
    const data = new Date(ano, mes, -i);
    dias.push(criarDiaCalendario(data, mes, feriados, eventos, reservas));
  }

  // Dias do mês atual
  for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
    const data = new Date(ano, mes, dia);
    dias.push(criarDiaCalendario(data, mes, feriados, eventos, reservas));
  }

  // Dias do próximo mês para completar 42 dias (6 semanas)
  const diasRestantes = 42 - dias.length;
  for (let i = 1; i <= diasRestantes; i++) {
    const data = new Date(ano, mes + 1, i);
    dias.push(criarDiaCalendario(data, mes, feriados, eventos, reservas));
  }

  return { mes, ano, dias };
}

export function criarDiaCalendario(
  data: Date,
  mesAtual: number,
  feriados: Feriado[] = [],
  eventos: EventoAgenda[] = [],
  reservas: ReservaEspaco[] = []
): CalendarDay {
  const dataString = formatarData(data);
  const ehMes = data.getMonth() === mesAtual;

  // Encontrar feriado do dia
  const feriado = feriados.find(f => f.data === dataString);

  // ✅ CORREÇÃO: Filtrar eventos que ocorrem neste dia
  // Incluindo eventos de múltiplos dias
  const eventosDodia = eventos.filter(e => {
    // Normalizar datas para comparação
    const dataEvento = new Date(e.data_evento + 'T00:00:00');
    const dataFim = e.data_fim ? new Date(e.data_fim + 'T00:00:00') : dataEvento;
    const dataAtual = new Date(dataString + 'T00:00:00');

    // ✅ Verificar se a data atual está entre o início e fim do evento
    return dataAtual >= dataEvento && dataAtual <= dataFim;
  });

  // Filtrar reservas do dia
  const reservasDodia = reservas.filter(r => r.data_reserva === dataString);

  // Verificar se é hoje
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const ehHoje = data.getTime() === hoje.getTime();

  return {
    data: dataString,
    dia: data.getDate(),
    mes: data.getMonth(),
    ano: data.getFullYear(),
    ehMes,
    ehHoje,
    ehFeriado: !!feriado,
    feriado,
    eventos: eventosDodia,
    reservas: reservasDodia,
  };
}

export function formatarData(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const dia = String(data.getDate()).padStart(2, '0');
  return `${ano}-${mes}-${dia}`;
}

export function formatarHora(hora: string): string {
  if (!hora) return '';
  return hora.substring(0, 5);
}

export function formatarDataBR(dataString: string): string {
  if (!dataString) return '';
  const [ano, mes, dia] = dataString.split('-');
  return `${dia}/${mes}/${ano}`;
}

export function formatarDataHoraBR(data: string, hora?: string): string {
  const dataFormatada = formatarDataBR(data);
  if (!hora) return dataFormatada;
  return `${dataFormatada} às ${formatarHora(hora)}`;
}

export function obterNomeDiaSemana(data: Date): string {
  const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
  return diasSemana[data.getDay()];
}

export function obterNomeMes(mes: number): string {
  const meses = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return meses[mes];
}

export function adicionarMeses(data: Date, meses: number): Date {
  const novaData = new Date(data);
  novaData.setMonth(novaData.getMonth() + meses);
  return novaData;
}

export function verificarSobreposicaoHorario(
  inicio1: string,
  fim1: string,
  inicio2: string,
  fim2: string
): boolean {
  return !(fim1 <= inicio2 || inicio1 >= fim2);
}

export function calcularDuracaoEvento(hora_inicio: string, hora_fim: string): number {
  if (!hora_inicio || !hora_fim) return 0;
  const [horaInicio, minutoInicio] = hora_inicio.split(':').map(Number);
  const [horaFim, minutoFim] = hora_fim.split(':').map(Number);

  const totalMinutosInicio = horaInicio * 60 + minutoInicio;
  const totalMinutosFim = horaFim * 60 + minutoFim;

  return (totalMinutosFim - totalMinutosInicio) / 60;
}

export function obterCoresPorStatus(status: string): { bg: string; text: string; border: string } {
  switch (status) {
    case 'confirmado':
      return { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' };
    case 'pendente':
      return { bg: 'bg-yellow-50', text: 'text-yellow-700', border: 'border-yellow-200' };
    case 'cancelado':
      return { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' };
    default:
      return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
  }
}

export function obterCoresPorTipoFeriado(tipo: string): string {
  switch (tipo) {
    case 'nacional':
      return 'bg-yellow-100 text-yellow-900';
    case 'estadual':
      return 'bg-blue-100 text-blue-900';
    case 'municipal':
      return 'bg-green-100 text-green-900';
    case 'religioso':
      return 'bg-purple-100 text-purple-900';
    default:
      return 'bg-slate-100 text-slate-900';
  }
}

// ✅ Nova função auxiliar para calcular dias entre datas
export function calcularDiasEntreDatas(dataInicio: string, dataFim: string): number {
  const inicio = new Date(dataInicio + 'T00:00:00');
  const fim = new Date(dataFim + 'T00:00:00');
  const diffTime = Math.abs(fim.getTime() - inicio.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

// ✅ Nova função para verificar se uma data está em um intervalo
export function dataEstaNoIntervalo(data: string, inicio: string, fim?: string): boolean {
  const dataCheck = new Date(data + 'T00:00:00');
  const dataInicio = new Date(inicio + 'T00:00:00');
  const dataFim = fim ? new Date(fim + 'T00:00:00') : dataInicio;

  return dataCheck >= dataInicio && dataCheck <= dataFim;
}