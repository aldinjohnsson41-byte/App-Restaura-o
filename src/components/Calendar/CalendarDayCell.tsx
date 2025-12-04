import React, { useState } from 'react';
import { Clock, MapPin, Users, Calendar, ChevronRight } from 'lucide-react';
import { CalendarDay, EventoAgenda } from '../../types/calendar';
import { obterCoresPorStatus } from '../../utils/calendarUtils';

interface CalendarDayCellProps {
  dia: CalendarDay;
  onSelectEvento: (evento: EventoAgenda) => void;
  onEditarEvento: (evento: EventoAgenda) => void;
}

export default function CalendarDayCell({
  dia,
  onSelectEvento,
  onEditarEvento,
}: CalendarDayCellProps) {
  const [showAllEvents, setShowAllEvents] = useState(false);

  const eventosOrdenados = [...dia.eventos].sort((a, b) => {
    if (a.dia_inteiro && !b.dia_inteiro) return -1;
    if (!a.dia_inteiro && b.dia_inteiro) return 1;
    if (!a.hora_inicio || !b.hora_inicio) return 0;
    return a.hora_inicio.localeCompare(b.hora_inicio);
  });

  const maxVisible = 2;
  const eventosVisiveis = showAllEvents 
    ? eventosOrdenados 
    : eventosOrdenados.slice(0, maxVisible);
  const eventosRestantes = eventosOrdenados.length - maxVisible;

  return (
    <div
      className={`min-h-32 border border-slate-200 p-2 transition-all hover:shadow-md ${
        !dia.ehMes ? 'bg-slate-50' : 'bg-white'
      } ${dia.ehHoje ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200' : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          // Click no próprio dia
          setShowAllEvents(!showAllEvents);
        }
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <span
          className={`font-semibold text-sm ${
            dia.ehMes ? 'text-slate-900' : 'text-slate-400'
          } ${
            dia.ehHoje
              ? 'bg-blue-600 text-white rounded-full w-7 h-7 flex items-center justify-center'
              : ''
          }`}
        >
          {dia.dia}
        </span>
        {dia.eventos.length > 0 && (
          <span className="text-xs bg-slate-700 text-white rounded-full px-2 py-0.5">
            {dia.eventos.length}
          </span>
        )}
      </div>

      {/* Feriado */}
      {dia.ehFeriado && dia.feriado && (
        <div className="mb-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded border border-yellow-300">
          {dia.feriado.nome}
        </div>
      )}

      <div className="space-y-1">
        {eventosVisiveis.map((evento) => {
          const cores = obterCoresPorStatus(evento.status);
          
          return (
            <button
              key={evento.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectEvento(evento);
              }}
              className={`w-full text-left text-xs px-2 py-1 rounded hover:opacity-80 transition truncate border ${cores.bg} ${cores.text} ${cores.border}`}
              title={`${evento.nome}${evento.hora_inicio ? ` - ${evento.hora_inicio.substring(0, 5)}` : ''}`}
            >
              <div className="flex items-center gap-1">
                {!evento.dia_inteiro && evento.hora_inicio && (
                  <Clock className="w-3 h-3 flex-shrink-0" />
                )}
                <span className="truncate">
                  {evento.dia_inteiro ? '📅 ' : `${evento.hora_inicio?.substring(0, 5)} `}
                  {evento.nome}
                </span>
              </div>
            </button>
          );
        })}

        {!showAllEvents && eventosRestantes > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAllEvents(true);
            }}
            className="w-full text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-2 py-1 rounded transition flex items-center justify-between font-medium"
          >
            <span>+{eventosRestantes} mais</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        )}

        {showAllEvents && eventosOrdenados.length > maxVisible && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAllEvents(false);
            }}
            className="w-full text-xs text-slate-600 hover:text-slate-700 hover:bg-slate-50 px-2 py-1 rounded transition"
          >
            Mostrar menos
          </button>
        )}
      </div>

      {/* Reservas */}
      {dia.reservas && dia.reservas.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-200">
          {dia.reservas.slice(0, 1).map((reserva) => (
            <div
              key={reserva.id}
              className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-200 truncate"
            >
              <MapPin className="w-3 h-3 inline mr-1" />
              {reserva.responsavel_nome}
            </div>
          ))}
          {dia.reservas.length > 1 && (
            <div className="text-xs text-slate-500 mt-1">
              +{dia.reservas.length - 1} reserva(s)
            </div>
          )}
        </div>
      )}
    </div>
  );
}