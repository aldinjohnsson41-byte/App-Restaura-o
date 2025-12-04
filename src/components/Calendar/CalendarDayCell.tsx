import { CalendarDay } from '../../types/calendar';
import { formatarDataBR, obterCoresPorTipoFeriado } from '../../utils/calendarUtils';

interface CalendarDayCellProps {
  dia: CalendarDay;
  onSelectEvento: (evento: any) => void;
  onEditarEvento: (evento: any) => void;
}

export default function CalendarDayCell({
  dia,
  onSelectEvento,
  onEditarEvento,
}: CalendarDayCellProps) {
  return (
    <div
      className={`min-h-32 border border-slate-200 p-2 ${
        !dia.ehMes ? 'bg-slate-50' : 'bg-white'
      } ${dia.ehHoje ? 'bg-blue-50 border-blue-200' : ''} relative`}
    >
      <div className="flex justify-between items-start mb-2">
        <span
          className={`font-semibold text-sm ${
            dia.ehMes ? 'text-slate-900' : 'text-slate-400'
          } ${dia.ehHoje ? 'bg-blue-600 text-white rounded px-2 py-1' : ''}`}
        >
          {dia.dia}
        </span>
      </div>

      {dia.ehFeriado && dia.feriado && (
        <div className={`text-xs px-2 py-1 rounded mb-1 font-medium truncate ${obterCoresPorTipoFeriado(dia.feriado.tipo)}`}>
          {dia.feriado.nome}
        </div>
      )}

      <div className="space-y-1">
        {dia.eventos.slice(0, 2).map((evento) => (
          <button
            key={evento.id}
            onClick={() => onSelectEvento(evento)}
            className="w-full text-left text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded hover:bg-blue-200 transition truncate border border-blue-200"
            title={evento.nome}
          >
            {evento.dia_inteiro ? '' : `${evento.hora_inicio?.substring(0, 5)} `}
            {evento.nome}
          </button>
        ))}

        {dia.reservas.slice(0, 1).map((reserva) => (
          <div
            key={reserva.id}
            className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded truncate border border-orange-200"
            title={`Reservado: ${reserva.responsavel_nome}`}
          >
            Reservado: {reserva.responsavel_nome.split(' ')[0]}
          </div>
        ))}

        {dia.eventos.length > 2 && (
          <div className="text-xs text-slate-600 px-2 py-1">
            +{dia.eventos.length - 2} mais
          </div>
        )}
      </div>
    </div>
  );
}
