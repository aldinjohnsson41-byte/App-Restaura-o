import { CalendarMonth, CalendarDay } from '../../types/calendar';
import CalendarDayCell from './CalendarDayCell';

interface CalendarGridProps {
  calendarMes: CalendarMonth;
  onSelectEvento: (evento: any) => void;
  onEditarEvento: (evento: any) => void;
  onNovoEvento: () => void;
}

export default function CalendarGrid({
  calendarMes,
  onSelectEvento,
  onEditarEvento,
  onNovoEvento,
}: CalendarGridProps) {
  const diasSemana = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Cabeçalho com dias da semana */}
      <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
        {diasSemana.map((dia) => (
          <div key={dia} className="p-4 text-center font-semibold text-slate-700 text-sm">
            {dia}
          </div>
        ))}
      </div>

      {/* Grade de dias */}
      <div className="grid grid-cols-7">
        {calendarMes.dias.map((dia, idx) =>
          dia ? (
            <CalendarDayCell
              key={idx}
              dia={dia}
              onSelectEvento={onSelectEvento}
              onEditarEvento={onEditarEvento}
            />
          ) : (
            // fallback para dias vazios (antes/depois do mês)
            <div
              key={idx}
              className="min-h-32 border bg-slate-50 border-slate-100"
            />
          )
        )}
      </div>

      {/* Legenda de feriados */}
      {calendarMes.dias.some(d => d?.ehFeriado) && (
        <div className="border-t border-slate-200 p-4 bg-slate-50">
          <h4 className="font-semibold text-slate-900 mb-3 text-sm">Legenda de Feriados</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-300"></div>
              <span>Nacional</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300"></div>
              <span>Estadual</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-green-100 border border-green-300"></div>
              <span>Municipal</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-purple-100 border border-purple-300"></div>
              <span>Religioso</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
